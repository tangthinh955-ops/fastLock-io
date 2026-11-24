import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
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
  ) {}

  // ── ĐĂNG NHẬP ─────────────────────────────────────────────────
  async login(email: string, password: string) {
    // 1. Tìm User trong Database
    const user = await this.userService.findByEmail(email);

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
      },
    };
  }

  // ── ĐĂNG KÝ ───────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    // 1. Kiểm tra email đã tồn tại chưa
    const existingUser = await this.userService.findByEmail(dto.email);
    if (existingUser) {
      // ConflictException = Lỗi 409, thông báo "tài nguyên đã tồn tại"
      throw new ConflictException('Email này đã được đăng ký!');
    }

    // 2. Mã hóa mật khẩu trước khi lưu vào DB (TUYỆT ĐỐI không lưu plain text)
    // saltRounds = 10 là chuẩn phổ biến (tốc độ vs bảo mật cân bằng)
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 3. Tạo user mới trong Database (không bao giờ cho phép tự đăng ký ADMIN)
    let newUser: Awaited<ReturnType<typeof this.prisma.user.create>>;
    try {
      newUser = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          name: dto.name || dto.email.split('@')[0], // Nếu không điền tên → dùng phần trước @
          role: dto.role === 'SELLER' ? 'SELLER' : 'BUYER', // Chỉ cho phép BUYER hoặc SELLER (mặc định BUYER)
        },
      });
    } catch (error) {
      if (
        (error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002') ||
        (typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          (error as { code?: unknown }).code === 'P2002')
      ) {
        throw new ConflictException('Email này đã được đăng ký!');
      }
      throw error;
    }

    // 4. Tự động đăng nhập luôn sau khi đăng ký (UX tốt hơn)
    const payload = {
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    };
  }
}
