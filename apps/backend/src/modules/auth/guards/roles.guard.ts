import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  // Reflector là công cụ giúp NestJS đọc được cái nhãn @Roles(...) mà ta đã dán lên API
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Dùng Reflector để lấy danh sách các Quyền (Roles) được phép truy cập API này
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(), // Đọc nhãn gắn trên hàm (ví dụ: getAllUsers)
      context.getClass(),   // Đọc nhãn gắn trên cả class Controller
    ]);
    
    // 2. Nếu API không gắn tag @Roles() -> Ai đã login cũng có thể vào tự do
    if (!requiredRoles) {
      return true;
    }

    // 3. Lấy thông tin người dùng (user) đã được giải mã từ Token (nhờ JwtAuthGuard chạy trước đó)
    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('Bạn chưa đăng nhập!');
    }

    // 4. Kiểm tra xem Quyền của người dùng (user.role) có nằm trong danh sách cho phép (requiredRoles) không?
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      // Nếu không có quyền -> Báo lỗi 403 Forbidden chặn lại ngay lập tức
      throw new ForbiddenException(`Bạn không có quyền truy cập! Cần quyền: ${requiredRoles.join(' hoặc ')}`);
    }

    // Nếu lọt qua hết các ải trên -> Cho phép truy cập API
    return true;
  }
}
