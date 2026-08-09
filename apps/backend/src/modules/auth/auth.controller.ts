import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth') // Tạo đường dẫn API bắt đầu bằng /auth
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login') // Kết hợp lại thành đường dẫn: POST /auth/login
  signIn(@Body() signInDto: Record<string, any>) {
    // Gọi hàm login bên service và truyền email, password khách gửi lên
    return this.authService.login(signInDto.email, signInDto.password);
  }
}
