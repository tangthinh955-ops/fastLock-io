import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PrismaService } from '../../core/prisma/prisma.service';
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
        kbHighlights: [
          { id: 'kb-1', keyword: 'ship', answer: 'Freeship đơn từ 299k' },
        ],
        activeStream: {
          id: 'stream-1',
          title: 'Flash Sale Tối Nay',
          description: 'Săn deal giảm 50% trong khung giờ vàng',
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
        kbHighlights: [],
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
    expect(result[0]).toMatchObject({
      id: 'seller-1',
      isLive: true,
      kbHighlights: [
        { id: 'kb-1', keyword: 'ship', answer: 'Freeship đơn từ 299k' },
      ],
      activeStream: {
        description: 'Săn deal giảm 50% trong khung giờ vàng',
      },
    });
    expect(result[1]).toMatchObject({
      id: 'seller-2',
      isLive: false,
      kbHighlights: [],
      activeStream: null,
    });
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

  it('gắn JwtAuthGuard cho tất cả 5 endpoint GET', () => {
    const proto = LivestreamController.prototype as unknown as Record<
      string,
      object
    >;

    for (const method of [
      'getAllActiveStreams',
      'getShopsWithLiveStatus',
      'getActiveStreamBySeller',
      'getLiveProducts',
      'getStreamById',
    ]) {
      const guards = Reflect.getMetadata(GUARDS_METADATA, proto[method]);
      expect(guards).toEqual([JwtAuthGuard]);
    }
  });
});

describe('LivestreamService.getShopsWithLiveStatus', () => {
  it('truy vấn description và tối đa 3 kbEntries, trả về đúng dữ liệu cho shop LIVE và OFFLINE', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 'seller-offline',
        name: 'Shop Offline',
        email: 'offline@liveorder.com',
        _count: { products: 2 },
        kbEntries: [
          { id: 'kb-off-1', keyword: 'đổi trả', answer: 'Đổi trả trong 7 ngày' },
        ],
        livestreams: [],
      },
      {
        id: 'seller-live',
        name: 'Shop Live',
        email: 'live@liveorder.com',
        _count: { products: 5 },
        kbEntries: [
          { id: 'kb-1', keyword: 'ship', answer: 'Freeship toàn quốc' },
          { id: 'kb-2', keyword: 'size', answer: 'Đủ size S-XL' },
        ],
        livestreams: [
          {
            id: 'stream-1',
            title: 'Live Tối Nay',
            description: 'Giảm giá toàn bộ áo khoác',
            status: 'LIVE',
            sellerId: 'seller-live',
            startedAt: new Date('2026-11-18T14:00:00.000Z'),
          },
        ],
      },
    ]);

    const service = new LivestreamService({
      user: { findMany },
    } as unknown as PrismaService);

    const shops = await service.getShopsWithLiveStatus();

    expect(findMany).toHaveBeenCalledWith({
      where: { role: 'SELLER' },
      select: {
        id: true,
        name: true,
        email: true,
        _count: { select: { products: true } },
        kbEntries: {
          take: 3,
          orderBy: { id: 'asc' },
          select: {
            id: true,
            keyword: true,
            answer: true,
          },
        },
        livestreams: {
          where: { status: 'LIVE' },
          orderBy: { startedAt: 'desc' },
          take: 1,
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            sellerId: true,
            startedAt: true,
          },
        },
      },
    });

    expect(shops).toHaveLength(2);
    expect(shops[0]).toEqual({
      id: 'seller-live',
      name: 'Shop Live',
      email: 'live@liveorder.com',
      productCount: 5,
      isLive: true,
      kbHighlights: [
        { id: 'kb-1', keyword: 'ship', answer: 'Freeship toàn quốc' },
        { id: 'kb-2', keyword: 'size', answer: 'Đủ size S-XL' },
      ],
      activeStream: {
        id: 'stream-1',
        title: 'Live Tối Nay',
        description: 'Giảm giá toàn bộ áo khoác',
        sellerId: 'seller-live',
        startedAt: new Date('2026-11-18T14:00:00.000Z'),
        seller: {
          id: 'seller-live',
          name: 'Shop Live',
        },
      },
    });
    expect(shops[1]).toEqual({
      id: 'seller-offline',
      name: 'Shop Offline',
      email: 'offline@liveorder.com',
      productCount: 2,
      isLive: false,
      kbHighlights: [
        { id: 'kb-off-1', keyword: 'đổi trả', answer: 'Đổi trả trong 7 ngày' },
      ],
      activeStream: null,
    });
  });
});

