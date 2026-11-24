import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // POST /auth/login
  // @Throttle ghi đè giới hạn toàn cục: cho phép 60 lần/phút (đủ cho nhiều máy demo dùng chung Wi-Fi)
  @Throttle({ global: { ttl: 60000, limit: 60 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  // POST /auth/register
  // Cho phép 60 lần/phút để nhiều user demo cùng đăng ký trên một mạng
  @Throttle({ global: { ttl: 60000, limit: 60 } })
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
}
