import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { ChatMode, Role } from '@prisma/client';
import { Namespace, Socket } from 'socket.io';
import { PrismaService } from '../../core/prisma/prisma.service';
import { DirectMessageGateway } from './direct-message.gateway';
import {
  DirectMessageEvents,
  type InboxMessage,
} from './direct-message.events';

describe('DirectMessageGateway authentication', () => {
  const jwt = { verifyAsync: jest.fn() };
  const config = { getOrThrow: jest.fn() };
  const prisma = { user: { findUnique: jest.fn() } };
  const events = { setServer: jest.fn() };
  let middleware: (client: Socket, next: (error?: Error) => void) => void;
  let gateway: DirectMessageGateway;

  beforeEach(() => {
    jest.resetAllMocks();
    jwt.verifyAsync.mockResolvedValue({ sub: 'buyer-a', role: Role.BUYER });
    config.getOrThrow.mockReturnValue('test-secret');
    prisma.user.findUnique.mockResolvedValue({
      id: 'buyer-a',
      role: Role.BUYER,
    });
    gateway = new DirectMessageGateway(
      jwt as unknown as JwtService,
      config as unknown as ConfigService,
      prisma as unknown as PrismaService,
      events as unknown as DirectMessageEvents,
    );
    gateway.afterInit({
      use: (handler: typeof middleware) => {
        middleware = handler;
      },
    } as unknown as Namespace);
  });

  const createClient = (token: unknown = 'token') => ({
    handshake: { auth: { token, userId: 'victim', room: 'user:victim' } },
    data: {} as Record<string, unknown>,
    join: jest.fn().mockResolvedValue(undefined),
    emit: jest.fn(),
    disconnect: jest.fn(),
  });

  const authenticate = (client: ReturnType<typeof createClient>) =>
    new Promise<Error | undefined>((resolve) =>
      middleware(client as unknown as Socket, resolve),
    );

  it('joins only the JWT account room and reports readiness after joining', async () => {
    const client = createClient();
    expect(await authenticate(client)).toBeUndefined();
    expect(jwt.verifyAsync).toHaveBeenCalledWith('token', {
      secret: 'test-secret',
    });
    await gateway.handleConnection(client as unknown as Socket);
    expect(client.join).toHaveBeenCalledWith('user:buyer-a');
    expect(client.join).toHaveBeenCalledTimes(1);
    expect(client.emit).toHaveBeenCalledWith('inbox_ready');
    expect(client.join.mock.invocationCallOrder[0]).toBeLessThan(
      client.emit.mock.invocationCallOrder[0],
    );
  });

  it.each([null, '', 123])(
    'rejects absent or non-string token %s',
    async (token) => {
      const client = createClient(token);
      expect(await authenticate(client)).toBeInstanceOf(Error);
      expect(jwt.verifyAsync).not.toHaveBeenCalled();
      expect(client.join).not.toHaveBeenCalled();
    },
  );

  it('rejects invalid or expired JWT before querying the database', async () => {
    jwt.verifyAsync.mockRejectedValueOnce(new Error('Expired token'));
    expect(await authenticate(createClient())).toBeInstanceOf(Error);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('rejects a missing account', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    expect(await authenticate(createClient())).toBeInstanceOf(Error);
  });

  it('rejects changed role and ADMIN accounts', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'buyer-a',
      role: Role.SELLER,
    });
    expect(await authenticate(createClient())).toBeInstanceOf(Error);
    jwt.verifyAsync.mockResolvedValueOnce({ sub: 'admin-a', role: Role.ADMIN });
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'admin-a',
      role: Role.ADMIN,
    });
    expect(await authenticate(createClient())).toBeInstanceOf(Error);
  });

  it('allows a Seller with a matching database role', async () => {
    jwt.verifyAsync.mockResolvedValueOnce({
      sub: 'seller-a',
      role: Role.SELLER,
    });
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'seller-a',
      role: Role.SELLER,
    });
    const client = createClient();
    expect(await authenticate(client)).toBeUndefined();
    await gateway.handleConnection(client as unknown as Socket);
    expect(client.join).toHaveBeenCalledWith('user:seller-a');
  });

  it('disconnects instead of joining when authenticated identity is missing', async () => {
    const client = createClient();
    await gateway.handleConnection(client as unknown as Socket);
    expect(client.disconnect).toHaveBeenCalled();
    expect(client.join).not.toHaveBeenCalled();
  });
});

describe('DirectMessageEvents delivery', () => {
  it('publishes mode and version only to the Buyer and Seller rooms', () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    const events = new DirectMessageEvents();
    events.setServer({ to } as unknown as Namespace);
    const status = {
      buyerId: 'buyer-a',
      sellerId: 'shop-a',
      mode: ChatMode.HUMAN,
      version: 4,
    };
    events.publishConversationMode(status);
    expect(to).toHaveBeenCalledWith(['user:buyer-a', 'user:shop-a']);
    expect(emit).toHaveBeenCalledWith('conversation_mode_changed', status);
  });

  it('targets only the sender and receiver rooms', () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    const events = new DirectMessageEvents();
    events.setServer({ to } as unknown as Namespace);
    const message = {
      id: 'message-a',
      senderId: 'buyer-a',
      receiverId: 'shop-a',
    } as InboxMessage;
    events.publishMessage(message);
    expect(to).toHaveBeenCalledWith(['user:buyer-a', 'user:shop-a']);
    expect(emit).toHaveBeenCalledWith('new_message', message);
  });

  it('does not throw when Socket publishing fails', () => {
    const warn = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => {});
    try {
      const events = new DirectMessageEvents();
      events.setServer({
        to: () => {
          throw new Error('Socket failure');
        },
      } as unknown as Namespace);
      expect(() =>
        events.publishMessage({ id: 'message-a' } as InboxMessage),
      ).not.toThrow();
      expect(warn).toHaveBeenCalled();
      expect(() =>
        events.publishConversationMode({
          buyerId: 'buyer-a',
          sellerId: 'shop-a',
          mode: ChatMode.HUMAN,
          version: 2,
        }),
      ).not.toThrow();
    } finally {
      warn.mockRestore();
    }
  });
});
