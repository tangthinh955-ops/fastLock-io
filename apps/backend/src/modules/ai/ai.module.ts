import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AiService],
  controllers: [AiController],
  exports: [AiService] // Xuất ra để sau này Socket Gateway có thể dùng
})
export class AiModule {}
