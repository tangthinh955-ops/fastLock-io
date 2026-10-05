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

@Injectable()
@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class LivestreamGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(LivestreamGateway.name);

    constructor(
        private readonly commentProcessor: LivestreamCommentProcessor,
        private readonly jwtService: JwtService,
    ) { }

    handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth?.token;
            if (typeof token !== 'string' || !token) {
                throw new Error('MISSING_TOKEN');
            }

            const payload = this.jwtService.verify<JwtPayload>(token);
            client.data.user = {
                userId: payload.sub,
                email: payload.email,
                role: payload.role,
            };

            this.logger.log(`Client ${client.id} kết nối Socket với role ${payload.role}`);
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
        this.server.to(livestreamId).emit('stream_ended', { livestreamId });
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
    handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { livestreamId: string },
    ) {
        if (!data?.livestreamId) return;
        client.join(data.livestreamId);
        this.logger.log(`Client ${client.id} đã tham gia phòng: ${data.livestreamId}`);
        client.emit('room_joined', { livestreamId: data.livestreamId, status: 'SUCCESS' });
    }

    @SubscribeMessage('leave_room')
    handleLeaveRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { livestreamId: string },
    ) {
        if (!data?.livestreamId) return;
        client.leave(data.livestreamId);
        this.logger.log(`Client ${client.id} đã rời phòng: ${data.livestreamId}`);
    }

    @SubscribeMessage('send_comment')
    async handleSendComment(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: SendCommentDto,
    ) {
        await this.commentProcessor.processComment(this.server, data);
    }
}
