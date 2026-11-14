import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { TokenVerifier } from 'livekit-server-sdk';
import { PrismaService } from '../../core/prisma/prisma.service';
import { LivekitTokenService } from './livekit-token.service';

const TEST_URL = 'wss://liveorder-demo.livekit.cloud';
const TEST_KEY = 'APITestKeyForLivekitUnitTests';
const TEST_SECRET = 'SuperSecretTestKeyForLivekitTokenSigning12345';

describe('LivekitTokenService', () => {
  const findUnique = jest.fn();
  const originalEnv = { ...process.env };
  let service: LivekitTokenService;

  beforeEach(() => {
    process.env.LIVEKIT_URL = `${TEST_URL}/`;
    process.env.LIVEKIT_API_KEY = TEST_KEY;
    process.env.LIVEKIT_API_SECRET = TEST_SECRET;

    findUnique.mockReset().mockResolvedValue({
      id: 'stream-1',
      sellerId: 'seller-1',
      status: 'LIVE',
    });

    service = new LivekitTokenService({
      livestream: { findUnique },
    } as unknown as PrismaService);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('ném ServiceUnavailableException khi thiếu cấu hình LIVEKIT_* trên server', async () => {
    process.env.LIVEKIT_API_SECRET = '   ';

    await expect(
      service.createRoomToken('stream-1', {
        userId: 'buyer-1',
        email: 'buyer@liveorder.com',
        role: Role.BUYER,
      }),
    ).rejects.toThrow(ServiceUnavailableException);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('ném NotFoundException khi không tìm thấy livestream', async () => {
    findUnique.mockResolvedValueOnce(null);

    await expect(
      service.createRoomToken('missing-stream', {
        userId: 'buyer-1',
        email: 'buyer@liveorder.com',
        role: Role.BUYER,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('ném BadRequestException khi phiên livestream không ở trạng thái LIVE', async () => {
    findUnique.mockResolvedValueOnce({
      id: 'stream-1',
      sellerId: 'seller-1',
      status: 'ENDED',
    });

    await expect(
      service.createRoomToken('stream-1', {
        userId: 'buyer-1',
        email: 'buyer@liveorder.com',
        role: Role.BUYER,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('ném ForbiddenException khi SELLER khác chủ phòng xin token', async () => {
    await expect(
      service.createRoomToken('stream-1', {
        userId: 'seller-2',
        email: 'other-seller@liveorder.com',
        role: Role.SELLER,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('cấp token canPublish=true cho SELLER chủ phiên livestream đang LIVE', async () => {
    const result = await service.createRoomToken('stream-1', {
      userId: 'seller-1',
      email: 'seller@liveorder.com',
      role: Role.SELLER,
    });

    expect(result.url).toBe(TEST_URL);
    expect(result.roomName).toBe('stream-1');
    expect(result.canPublish).toBe(true);

    const claims = await new TokenVerifier(TEST_KEY, TEST_SECRET).verify(
      result.token,
    );
    expect(claims.sub).toBe('seller-seller-1');
    expect(claims.video).toMatchObject({
      room: 'stream-1',
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: false,
    });
  });

  it('cấp token canPublish=false và identity riêng mỗi phiên cho BUYER', async () => {
    const first = await service.createRoomToken('stream-1', {
      userId: 'buyer-1',
      email: 'buyer@liveorder.com',
      role: Role.BUYER,
    });
    const second = await service.createRoomToken('stream-1', {
      userId: 'buyer-1',
      email: 'buyer@liveorder.com',
      role: Role.BUYER,
    });

    expect(first.canPublish).toBe(false);
    expect(first.url).toBe(TEST_URL);
    expect(first.roomName).toBe('stream-1');

    const verifier = new TokenVerifier(TEST_KEY, TEST_SECRET);
    const firstClaims = await verifier.verify(first.token);
    const secondClaims = await verifier.verify(second.token);

    expect(firstClaims.sub).toMatch(/^buyer-buyer-1-/);
    expect(secondClaims.sub).toMatch(/^buyer-buyer-1-/);
    expect(firstClaims.sub).not.toBe(secondClaims.sub);
    expect(firstClaims.video).toMatchObject({
      room: 'stream-1',
      roomJoin: true,
      canPublish: false,
      canSubscribe: true,
      canPublishData: false,
    });
  });
});

