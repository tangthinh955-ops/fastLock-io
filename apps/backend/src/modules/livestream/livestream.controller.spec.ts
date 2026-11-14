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
  let controller: LivestreamController;

  beforeEach(() => {
    createRoomToken.mockReset().mockResolvedValue({
      token: 'lk-jwt',
      url: 'wss://liveorder-demo.livekit.cloud',
      roomName: 'stream-1',
      canPublish: false,
    });

    controller = new (LivestreamController as unknown as new (
      livestreamService: LivestreamService,
      livestreamGateway: LivestreamGateway,
      livekitTokenService: LivekitTokenService,
    ) => LivestreamController)(
      {} as LivestreamService,
      {} as LivestreamGateway,
      { createRoomToken } as unknown as LivekitTokenService,
    );
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

