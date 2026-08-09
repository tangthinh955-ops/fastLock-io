import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Biến Module này thành Global để các chỗ khác không cần phải import đi import lại
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
