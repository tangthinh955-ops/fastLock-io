import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import { AccessToken } from 'livekit-server-sdk';
import { PrismaService } from '../../core/prisma/prisma.service';

export interface LivekitTokenUser {
  userId: string;
  email: string;
  role: Role;
}

export interface LivekitTokenResult {
  token: string;
  url: string;
  roomName: string;
  canPublish: boolean;
}

interface LivekitServerConfig {
  url: string;
  apiKey: string;
  apiSecret: string;
}

function readLivekitConfig(): LivekitServerConfig {
  const url = (process.env.LIVEKIT_URL ?? '').trim().replace(/\/+$/, '');
  const apiKey = (process.env.LIVEKIT_API_KEY ?? '').trim();
  const apiSecret = (process.env.LIVEKIT_API_SECRET ?? '').trim();

  if (!url || !apiKey || !apiSecret) {
    throw new ServiceUnavailableException(
      'LiveKit chưa được cấu hình trên server (thiếu LIVEKIT_URL, LIVEKIT_API_KEY hoặc LIVEKIT_API_SECRET).',
    );
  }

  return { url, apiKey, apiSecret };
}

@Injectable()
export class LivekitTokenService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cấp JWT token vào phòng LiveKit gắn với phiên livestream đang phát.
   */
  async createRoomToken(
    livestreamId: string,
    user: LivekitTokenUser,
  ): Promise<LivekitTokenResult> {
    const config = readLivekitConfig();

    const stream = await this.prisma.livestream.findUnique({
      where: { id: livestreamId },
      select: {
        id: true,
        sellerId: true,
        status: true,
      },
    });

    if (!stream) {
      throw new NotFoundException(
        `Không tìm thấy phiên Livestream ID: ${livestreamId}`,
      );
    }

    if (stream.status !== 'LIVE') {
      throw new BadRequestException(
        'Phiên livestream hiện chưa phát sóng hoặc đã kết thúc.',
      );
    }

    if (user.role === Role.SELLER && stream.sellerId !== user.userId) {
      throw new ForbiddenException(
        'Chỉ chủ phiên livestream mới có quyền phát sóng trong phòng này.',
      );
    }

    const canPublish =
      user.role === Role.SELLER && stream.sellerId === user.userId;

    // Gắn hậu tố ngắn cho Buyer để test 1 tài khoản trên nhiều tab/thiết bị không đá nhau.
    const identity = canPublish
      ? `seller-${user.userId}`
      : `buyer-${user.userId}-${randomUUID().slice(0, 8)}`;

    const accessToken = new AccessToken(config.apiKey, config.apiSecret, {
      identity,
      name: user.email.split('@')[0] || user.role,
      ttl: '2h',
    });

    accessToken.addGrant({
      roomJoin: true,
      room: stream.id,
      canPublish,
      canSubscribe: true,
      canPublishData: false,
    });

    const token = await accessToken.toJwt();

    return {
      token,
      url: config.url,
      roomName: stream.id,
      canPublish,
    };
  }
}

