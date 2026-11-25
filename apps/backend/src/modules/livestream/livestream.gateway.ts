import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LivestreamCommentProcessor, SendCommentDto } from './livestream-comment.processor';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { createCorsOptions } from '../../core/config/cors.config';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
@WebSocketGateway({
    cors: createCorsOptions(),
})
export class LivestreamGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(LivestreamGateway.name);
    // Map livestreamId -> (socketId -> buyerUserId) để đếm chính xác số người xem (BUYER) duy nhất
    private readonly roomViewers = new Map<string, Map<string, string>>();

    constructor(
        private readonly commentProcessor: LivestreamCommentProcessor,
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
    ) { }

    private getUniqueViewerCount(livestreamId: string): number {
        const viewers = this.roomViewers.get(livestreamId);
        if (!viewers || viewers.size === 0) return 0;
        return new Set(viewers.values()).size;
    }

    private emitViewerCount(livestreamId: string) {
        const viewerCount = this.getUniqueViewerCount(livestreamId);
        this.server
            ?.to?.(livestreamId)
            ?.emit('viewer_count', { livestreamId, viewerCount });
    }

    private removeClientFromRoomTracking(client: Socket, livestreamId: string) {
        const viewers = this.roomViewers.get(livestreamId);
        if (viewers) {
            viewers.delete(client.id);
            if (viewers.size === 0) {
                this.roomViewers.delete(livestreamId);
            }
        }
        const joinedRooms = client.data?.joinedRooms as Set<string> | undefined;
        joinedRooms?.delete(livestreamId);
    }

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth?.token;
            if (typeof token !== 'string' || !token) {
                throw new Error('MISSING_TOKEN');
            }

            const payload = this.jwtService.verify<JwtPayload>(token);
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
                select: { id: true, name: true, role: true },
            });

            if (!user) {
                throw new Error('USER_NOT_FOUND');
            }

            client.data.user = {
                userId: user.id,
                email: payload.email,
                role: user.role,
                name: user.name,
            };

            this.logger.log(`Client ${client.id} kết nối Socket với role ${user.role}`);
        } catch {
            this.logger.warn(`Từ chối Socket không có JWT hợp lệ: ${client.id}`);
            client.emit('auth_error', {
                message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
            });
            client.disconnect(true);
        }
    }

    handleDisconnect(client: Socket) {
        const joinedRooms = client.data?.joinedRooms as Set<string> | undefined;
        if (joinedRooms && joinedRooms.size > 0) {
            for (const livestreamId of Array.from(joinedRooms)) {
                this.removeClientFromRoomTracking(client, livestreamId);
                this.emitViewerCount(livestreamId);
            }
        }
        this.logger.log(`Client ngắt kết nối Socket: ${client.id}`);
    }

    notifyStreamEnded(livestreamId: string) {
        this.roomViewers.delete(livestreamId);
        this.server.emit('stream_ended', { livestreamId });
    }

    notifyNewOrder(livestreamId: string, orderData: unknown) {
        this.server.to(livestreamId).emit('new_order', orderData);
    }

    notifyStreamStarted(stream: {
        id: string;
        title: string;
        sellerId: string;
        seller: { id: string; name: string };
    }) {
        this.server.emit('stream_started', {
            id: stream.id,
            title: stream.title,
            sellerId: stream.sellerId,
            seller: {
                id: stream.seller.id,
                name: stream.seller.name,
            },
        });
    }

    @SubscribeMessage('join_room')
    async handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { livestreamId: string },
    ) {
        if (!data?.livestreamId || typeof data.livestreamId !== 'string') return;
        const livestreamId = data.livestreamId.trim();
        if (!livestreamId) return;

        await client.join(livestreamId);
        if (!client.data) {
            client.data = {};
        }
        if (!(client.data.joinedRooms instanceof Set)) {
            client.data.joinedRooms = new Set<string>();
        }
        (client.data.joinedRooms as Set<string>).add(livestreamId);

        const authUser = client.data?.user as
            | { userId?: string; role?: string }
            | undefined;
        if (authUser?.role === 'BUYER' && authUser.userId) {
            let viewers = this.roomViewers.get(livestreamId);
            if (!viewers) {
                viewers = new Map<string, string>();
                this.roomViewers.set(livestreamId, viewers);
            }
            viewers.set(client.id, authUser.userId);
        }

        const viewerCount = this.getUniqueViewerCount(livestreamId);
        this.logger.log(
            `Client ${client.id} đã tham gia phòng: ${livestreamId} (${viewerCount} mắt xem)`,
        );
        client.emit('room_joined', {
            livestreamId,
            status: 'SUCCESS',
            viewerCount,
        });
        this.emitViewerCount(livestreamId);
    }

    @SubscribeMessage('leave_room')
    async handleLeaveRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { livestreamId: string },
    ) {
        if (!data?.livestreamId || typeof data.livestreamId !== 'string') return;
        const livestreamId = data.livestreamId.trim();
        if (!livestreamId) return;

        await client.leave(livestreamId);
        this.removeClientFromRoomTracking(client, livestreamId);
        this.emitViewerCount(livestreamId);
        this.logger.log(`Client ${client.id} đã rời phòng: ${livestreamId}`);
    }

    @SubscribeMessage('send_comment')
    async handleSendComment(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: Partial<SendCommentDto> | undefined,
    ) {
        const authUser = client.data?.user as
            | { userId: string; email?: string; role?: string; name?: string }
            | undefined;
        if (!authUser?.userId) {
            client.emit('auth_error', {
                message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
            });
            return;
        }

        if (
            !data ||
            typeof data.livestreamId !== 'string' ||
            typeof data.commentText !== 'string'
        ) {
            return;
        }

        const livestreamId = data.livestreamId.trim();
        const trimmedComment = data.commentText.trim();
        if (!livestreamId || trimmedComment.length === 0) {
            return;
        }
        const cappedComment = trimmedComment.slice(0, 500);

        const payload: SendCommentDto = {
            livestreamId,
            buyerId: authUser.userId,
            buyerName: authUser.name || 'Khách hàng',
            buyerRole: authUser.role,
            commentText: cappedComment,
            phone: typeof data.phone === 'string' ? data.phone : undefined,
        };

        await this.commentProcessor.processComment(this.server, payload, client);
    }
}
