import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../core/prisma/prisma.service';
import { LivestreamCommentProcessor } from './livestream-comment.processor';
import { LivestreamGateway } from './livestream.gateway';

describe('LivestreamGateway', () => {
  const processComment = jest.fn();
  const verify = jest.fn();
  const findUniqueUser = jest.fn();

  let gateway: LivestreamGateway;

  beforeEach(() => {
    processComment.mockReset().mockResolvedValue(undefined);
    verify.mockReset().mockReturnValue({
      sub: 'user-1',
      email: 'buyer@liveorder.com',
      role: Role.BUYER,
    });
    findUniqueUser.mockReset().mockResolvedValue({
      id: 'user-1',
      name: 'Trần Thị B',
      role: Role.BUYER,
    });

    gateway = new LivestreamGateway(
      { processComment } as unknown as LivestreamCommentProcessor,
      { verify } as unknown as JwtService,
      {
        user: { findUnique: findUniqueUser },
      } as unknown as PrismaService,
    );
    gateway.server = {} as Server;
  });

  it('xác thực JWT và nạp thông tin user mới nhất từ Prisma khi kết nối Socket', async () => {
    const emit = jest.fn();
    const disconnect = jest.fn();
    const client = {
      id: 'sock-1',
      handshake: { auth: { token: 'valid-jwt' } },
      data: {},
      emit,
      disconnect,
    } as unknown as Socket;

    await gateway.handleConnection(client);

    expect(findUniqueUser).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { id: true, name: true, role: true },
    });
    expect(client.data.user).toEqual({
      userId: 'user-1',
      email: 'buyer@liveorder.com',
      role: Role.BUYER,
      name: 'Trần Thị B',
    });
    expect(disconnect).not.toHaveBeenCalled();
  });

  it('ngắt kết nối và phát auth_error khi user không tồn tại trong DB', async () => {
    findUniqueUser.mockResolvedValueOnce(null);
    const emit = jest.fn();
    const disconnect = jest.fn();
    const client = {
      id: 'sock-2',
      handshake: { auth: { token: 'valid-jwt' } },
      data: {},
      emit,
      disconnect,
    } as unknown as Socket;

    await gateway.handleConnection(client);

    expect(emit).toHaveBeenCalledWith('auth_error', {
      message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
    });
    expect(disconnect).toHaveBeenCalledWith(true);
  });

  it('trim, giới hạn 500 ký tự, không tin buyerName từ client và truyền buyerRole + client', async () => {
    const emit = jest.fn();
    const client = {
      id: 'sock-3',
      data: {
        user: {
          userId: 'user-1',
          email: 'buyer@liveorder.com',
          role: Role.BUYER,
          name: 'Trần Thị B',
        },
      },
      emit,
    } as unknown as Socket;

    const longComment = `   ${'A'.repeat(550)}   `;
    await gateway.handleSendComment(client, {
      livestreamId: 'stream-1',
      buyerName: 'Tên Giả Mạo',
      commentText: longComment,
    });

    expect(processComment).toHaveBeenCalledWith(
      gateway.server,
      {
        livestreamId: 'stream-1',
        buyerId: 'user-1',
        buyerName: 'Trần Thị B',
        buyerRole: Role.BUYER,
        commentText: 'A'.repeat(500),
        phone: undefined,
      },
      client,
    );
  });

  it('bỏ qua send_comment khi dữ liệu không hợp lệ hoặc rỗng sau trim', async () => {
    const client = {
      id: 'sock-4',
      data: {
        user: {
          userId: 'user-1',
          email: 'buyer@liveorder.com',
          role: Role.BUYER,
          name: 'Trần Thị B',
        },
      },
      emit: jest.fn(),
    } as unknown as Socket;

    await gateway.handleSendComment(client, {
      livestreamId: 'stream-1',
      commentText: '    ',
    });
    await gateway.handleSendComment(client, undefined);

    expect(processComment).not.toHaveBeenCalled();
  });

  it('đếm mắt xem BUYER duy nhất và phát viewer_count khi vào/rời/ngắt kết nối phòng', async () => {
    const roomEmit = jest.fn();
    gateway.server = {
      to: jest.fn(() => ({ emit: roomEmit })),
    } as unknown as Server;

    const makeClient = (id: string, userId: string, role: Role) =>
      ({
        id,
        data: { user: { userId, role } },
        join: jest.fn().mockResolvedValue(undefined),
        leave: jest.fn().mockResolvedValue(undefined),
        emit: jest.fn(),
      }) as unknown as Socket;

    const seller = makeClient('sock-seller', 'seller-1', Role.SELLER);
    const buyer1TabA = makeClient('sock-b1-a', 'buyer-1', Role.BUYER);
    const buyer1TabB = makeClient('sock-b1-b', 'buyer-1', Role.BUYER);
    const buyer2 = makeClient('sock-b2', 'buyer-2', Role.BUYER);

    await gateway.handleJoinRoom(seller, { livestreamId: 'stream-1' });
    expect(roomEmit).toHaveBeenLastCalledWith('viewer_count', {
      livestreamId: 'stream-1',
      viewerCount: 0,
    });

    await gateway.handleJoinRoom(buyer1TabA, { livestreamId: 'stream-1' });
    expect(roomEmit).toHaveBeenLastCalledWith('viewer_count', {
      livestreamId: 'stream-1',
      viewerCount: 1,
    });

    await gateway.handleJoinRoom(buyer1TabB, { livestreamId: 'stream-1' });
    expect(roomEmit).toHaveBeenLastCalledWith('viewer_count', {
      livestreamId: 'stream-1',
      viewerCount: 1,
    });

    await gateway.handleJoinRoom(buyer2, { livestreamId: 'stream-1' });
    expect(roomEmit).toHaveBeenLastCalledWith('viewer_count', {
      livestreamId: 'stream-1',
      viewerCount: 2,
    });

    gateway.handleDisconnect(buyer2);
    expect(roomEmit).toHaveBeenLastCalledWith('viewer_count', {
      livestreamId: 'stream-1',
      viewerCount: 1,
    });

    await gateway.handleLeaveRoom(buyer1TabA, { livestreamId: 'stream-1' });
    expect(roomEmit).toHaveBeenLastCalledWith('viewer_count', {
      livestreamId: 'stream-1',
      viewerCount: 1,
    });

    gateway.handleDisconnect(buyer1TabB);
    expect(roomEmit).toHaveBeenLastCalledWith('viewer_count', {
      livestreamId: 'stream-1',
      viewerCount: 0,
    });
  });
});
