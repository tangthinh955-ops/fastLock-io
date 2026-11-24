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

    constructor(
        private readonly commentProcessor: LivestreamCommentProcessor,
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
    ) { }

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
        this.logger.log(`Client ngắt kết nối Socket: ${client.id}`);
    }

    notifyStreamEnded(livestreamId: string) {
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
        await client.join(data.livestreamId);
        this.logger.log(`Client ${client.id} đã tham gia phòng: ${data.livestreamId}`);
        client.emit('room_joined', { livestreamId: data.livestreamId, status: 'SUCCESS' });
    }

    @SubscribeMessage('leave_room')
    async handleLeaveRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { livestreamId: string },
    ) {
        if (!data?.livestreamId || typeof data.livestreamId !== 'string') return;
        await client.leave(data.livestreamId);
        this.logger.log(`Client ${client.id} đã rời phòng: ${data.livestreamId}`);
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
