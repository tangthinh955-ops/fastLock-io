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
import { LivestreamCommentProcessor, SendCommentDto } from './livestream-comment.processor';

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

    constructor(private readonly commentProcessor: LivestreamCommentProcessor) { }

    handleConnection(client: Socket) {
        this.logger.log(`Client kết nối Socket: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client ngắt kết nối Socket: ${client.id}`);
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
