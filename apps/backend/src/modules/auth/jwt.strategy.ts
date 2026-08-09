import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Lấy thẻ Token từ cục Header của request
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Chìa khóa để giải mã Token (Phải giống chìa khóa lúc tạo)
      secretOrKey: process.env.JWT_SECRET || 'DoAnKy-Thinh',
    });
  }

  // Nếu Token hợp lệ, tự động giải mã và ném thông tin user vào request.user
  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
