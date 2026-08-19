import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard) // Bật khiên bảo vệ (Phải đăng nhập + Xét quyền)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles(Role.ADMIN) // Đóng dấu: Chỉ ADMIN mới được phép gọi API này
  async getAllUsers() {
    return this.userService.findAll();
  }
}
