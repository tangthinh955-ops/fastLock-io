import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) { }

  // Hàm xử lý đăng nhập
  async login(email: string, pass: string) {
    // 1. Tìm User trong Database
    const user = await this.userService.findByEmail(email);

    // 2. Nếu không có User hoặc mật khẩu sai -> Đuổi ra
    if (!user || !(await bcrypt.compare(pass, user.password))) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác!');
    }

    // 3. Nếu đúng -> Gói thông tin vào JWT (Payload)
    const payload = { sub: user.id, email: user.email, role: user.role };

    // 4. Trả về Token cho Frontend
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createAt: Date.now(),
      }
    };
  }
}
