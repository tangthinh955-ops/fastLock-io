import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Đã kết nối thành công tới Database PostgreSQL!');
    } catch (error) {
      this.logger.warn(
        '⚠️ CHƯA BẬT DOCKER POSTGRES (localhost:5433). NestJS vẫn khởi chạy bình thường.',
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
