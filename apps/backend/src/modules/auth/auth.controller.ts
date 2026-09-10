import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // POST /auth/login
  // @Throttle ghi đè giới hạn toàn cục: chỉ cho 5 lần/phút thay vì 100
  // Lý do: Chặn kẻ tấn công thử brute force mật khẩu hàng loạt
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  // POST /auth/register
  // Tương tự: Chặn tạo hàng loạt tài khoản rác (spam accounts)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
}
