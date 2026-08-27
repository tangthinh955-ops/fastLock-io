import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // Hàm tìm User bằng email để so sánh lúc đăng nhập
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  // Hàm lấy danh sách người dùng CÓ PHÂN TRANG (Dành cho Admin)
  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // Chạy song song 2 query: lấy data và đếm tổng số lượng (để Frontend tính tổng số trang)
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    };
  }
}
