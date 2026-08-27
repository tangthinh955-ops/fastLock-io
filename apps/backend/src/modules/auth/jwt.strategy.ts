import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    // Kiểm tra ngay lúc khởi động server — không để lọt vào runtime mới phát hiện
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      // Server sẽ CRASH ngay khi boot nếu thiếu biến này
      // Tốt hơn là để hệ thống chạy âm thầm với secret mặc định rồi bị hack
      throw new InternalServerErrorException(
        'FATAL: JWT_SECRET chưa được cấu hình trong file .env! Server không thể khởi động.'
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret, // ✅ Không còn fallback nguy hiểm
    });
  }

  // ✅ Thay thế "any" bằng JwtPayload interface — TypeScript sẽ cảnh báo nếu dùng sai field
  async validate(payload: JwtPayload) {
    // Kết quả hàm này sẽ được gắn vào request.user ở mọi Controller có @UseGuards(JwtAuthGuard)
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
