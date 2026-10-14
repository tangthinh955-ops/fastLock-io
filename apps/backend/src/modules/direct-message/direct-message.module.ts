import { Module } from '@nestjs/common';
import { DirectMessageService } from './direct-message.service';
import { DirectMessageController } from './direct-message.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { DirectMessageGateway } from './direct-message.gateway';
import { DirectMessageEvents } from './direct-message.events';

@Module({
  imports: [PrismaModule, AiModule, AuthModule],
  controllers: [DirectMessageController],
  providers: [DirectMessageService, DirectMessageGateway, DirectMessageEvents],
  exports: [DirectMessageService],
})
export class DirectMessageModule {}
