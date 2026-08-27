import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private prisma: PrismaService, // Cần để tạo user mới khi đăng ký
  ) { }

  // ── ĐĂNG NHẬP ─────────────────────────────────────────────────
  async login(email: string, password: string) {
    // [TỬ HUYỆT 1] Xem email client gửi lên có đúng không
    console.log('[AuthService] Login attempt for email:', email);

    // 1. Tìm User trong Database
    const user = await this.userService.findByEmail(email);

    // [TỬ HUYỆT 2] Xem DB trả về user hay null
    console.log('[AuthService] User found:', user ? user.email : 'NOT FOUND');

    // 2. Nếu không có User hoặc mật khẩu sai -> Đuổi ra
    // Luôn trả cùng 1 thông báo để hacker không đoán được "email này có tồn tại không"
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác!');
    }

    // 3. Nếu đúng -> Gói thông tin vào JWT (Payload)
    // QUAN TRỌNG: Không bao giờ cho password vào payload!
    const payload = { sub: user.id, email: user.email, role: user.role };

    // 4. Trả về Token cho Frontend
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        // ✅ Lấy createdAt thực tế từ Database, không dùng Date.now()
        createdAt: user.createdAt,
      }
    };
  }

  // ── ĐĂNG KÝ ───────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    // [TỬ HUYỆT 3] Xem email đăng ký là gì
    console.log('[AuthService] Register attempt for email:', dto.email);

    // 1. Kiểm tra email đã tồn tại chưa
    const existingUser = await this.userService.findByEmail(dto.email);
    if (existingUser) {
      // ConflictException = Lỗi 409, thông báo "tài nguyên đã tồn tại"
      throw new ConflictException('Email này đã được đăng ký!');
    }

    // 2. Mã hóa mật khẩu trước khi lưu vào DB (TUYỆT ĐỐI không lưu plain text)
    // saltRounds = 10 là chuẩn phổ biến (tốc độ vs bảo mật cân bằng)
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 3. Tạo user mới trong Database
    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name || dto.email.split('@')[0], // Nếu không điền tên → dùng phần trước @
        role: 'BUYER', // Mặc định tài khoản mới là BUYER
      },
    });

    // 4. Tự động đăng nhập luôn sau khi đăng ký (UX tốt hơn)
    const payload = { sub: newUser.id, email: newUser.email, role: newUser.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        createdAt: newUser.createdAt,
      }
    };
  }
}
