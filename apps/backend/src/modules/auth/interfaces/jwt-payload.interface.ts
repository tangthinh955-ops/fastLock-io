// File: auth/interfaces/jwt-payload.interface.ts
// Thay thế cho kiểu "any" trong validate() của JwtStrategy
// Đây là bản hợp đồng cho dữ liệu nằm bên trong JWT Token sau khi giải mã

import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string;   // ID của user (subject — theo chuẩn JWT)
  email: string; // Email của user
  role: Role;    // Vai trò: ADMIN | SELLER | BUYER (dùng enum của Prisma luôn cho nhất quán)
  iat?: number;  // Issued At — Thời điểm token được tạo (Prisma tự thêm)
  exp?: number;  // Expiration — Thời điểm token hết hạn (Prisma tự thêm)
}
