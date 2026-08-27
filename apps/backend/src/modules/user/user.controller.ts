import { Controller, Get, UseGuards, Query } from '@nestjs/common';
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
  async getAllUsers(
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    // Ép kiểu sang Number và truyền default nếu user không gửi
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    
    return this.userService.findAll(pageNumber, limitNumber);
  }
}
