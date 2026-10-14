import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Role } from '@prisma/client';
import { Namespace, Socket } from 'socket.io';
import { PrismaService } from '../../core/prisma/prisma.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { DirectMessageEvents, inboxUserRoom } from './direct-message.events';

@WebSocketGateway({ namespace: '/inbox', cors: { origin: true } })
export class DirectMessageGateway
  implements OnGatewayInit, OnGatewayConnection
{
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly events: DirectMessageEvents,
  ) {}

  afterInit(server: Namespace) {
    this.events.setServer(server);
    server.use((client, next) => {
      void this.authenticate(client).then(
        () => next(),
        () =>
          next(new Error('Không thể xác thực Inbox. Vui lòng đăng nhập lại.')),
      );
    });
  }

  private async authenticate(client: Socket) {
    const token: unknown = client.handshake.auth?.token;
    if (typeof token !== 'string' || !token) throw new Error('Missing token');

    const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
    });
    if (typeof payload.sub !== 'string' || !payload.sub) {
      throw new Error('Invalid subject');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true },
    });
    if (
      !user ||
      user.role !== payload.role ||
      (user.role !== Role.BUYER && user.role !== Role.SELLER)
    ) {
      throw new Error('Invalid Inbox account');
    }
    client.data.inboxUserId = user.id;
  }

  async handleConnection(client: Socket) {
    const userId: unknown = client.data.inboxUserId;
    if (typeof userId !== 'string' || !userId) {
      client.disconnect();
      return;
    }
    try {
      // Không nhận buyerId/sellerId/room từ client; chỉ vào room của JWT.
      await client.join(inboxUserRoom(userId));
      client.emit('inbox_ready');
    } catch {
      client.disconnect();
    }
  }
}
