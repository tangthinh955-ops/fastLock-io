import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { LivestreamController } from './livestream.controller';
import { LivestreamGateway } from './livestream.gateway';
import { LivestreamService } from './livestream.service';
import { LivekitTokenService } from './livekit-token.service';

describe('LivestreamController', () => {
  const createRoomToken = jest.fn();
  const getShopsWithLiveStatus = jest.fn();
  let controller: LivestreamController;

  beforeEach(() => {
    createRoomToken.mockReset().mockResolvedValue({
      token: 'lk-jwt',
      url: 'wss://liveorder-demo.livekit.cloud',
      roomName: 'stream-1',
      canPublish: false,
    });
    getShopsWithLiveStatus.mockReset().mockResolvedValue([
      {
        id: 'seller-1',
        name: 'Shop Live',
        email: 'seller1@liveorder.com',
        productCount: 3,
        isLive: true,
        activeStream: {
          id: 'stream-1',
          title: 'Flash Sale Tối Nay',
          sellerId: 'seller-1',
          startedAt: new Date('2026-11-18T14:00:00.000Z'),
          seller: { id: 'seller-1', name: 'Shop Live' },
        },
      },
      {
        id: 'seller-2',
        name: 'Shop Offline',
        email: 'seller2@liveorder.com',
        productCount: 1,
        isLive: false,
        activeStream: null,
      },
    ]);

    controller = new (LivestreamController as unknown as new (
      livestreamService: LivestreamService,
      livestreamGateway: LivestreamGateway,
      livekitTokenService: LivekitTokenService,
    ) => LivestreamController)(
      { getShopsWithLiveStatus } as unknown as LivestreamService,
      {} as LivestreamGateway,
      { createRoomToken } as unknown as LivekitTokenService,
    );
  });

  it('ủy quyền getShopsWithLiveStatus sang LivestreamService', async () => {
    const result = await controller.getShopsWithLiveStatus();

    expect(getShopsWithLiveStatus).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: 'seller-1', isLive: true });
    expect(result[1]).toMatchObject({ id: 'seller-2', isLive: false, activeStream: null });
  });

  it('ủy quyền createLivekitToken sang LivekitTokenService với user hiện tại', async () => {
    const user = {
      userId: 'buyer-1',
      email: 'buyer@liveorder.com',
      role: Role.BUYER,
    };

    const result = await (
      controller as unknown as {
        createLivekitToken: (id: string, u: typeof user) => Promise<unknown>;
      }
    ).createLivekitToken('stream-1', user);

    expect(createRoomToken).toHaveBeenCalledWith('stream-1', user);
    expect(result).toEqual({
      token: 'lk-jwt',
      url: 'wss://liveorder-demo.livekit.cloud',
      roomName: 'stream-1',
      canPublish: false,
    });
  });

  it('gắn đủ JwtAuthGuard, RolesGuard và @Roles(SELLER, BUYER) cho endpoint token', () => {
    const handler = (
      LivestreamController.prototype as unknown as Record<string, object>
    ).createLivekitToken;

    const roles = Reflect.getMetadata(ROLES_KEY, handler);
    const guards = Reflect.getMetadata(GUARDS_METADATA, handler);

    expect(roles).toEqual([Role.SELLER, Role.BUYER]);
    expect(guards).toEqual([JwtAuthGuard, RolesGuard]);
  });
});

