import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Tạo một Guard ("Bác bảo vệ") tên là JwtAuthGuard dựa trên cấu hình JwtStrategy
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
