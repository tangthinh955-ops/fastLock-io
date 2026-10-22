import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { EmbeddingService } from './embedding.service';
import { KnowledgeRetrievalService } from './knowledge-retrieval.service';
import { ProductRetrievalService } from './product-retrieval.service';

@Module({
  imports: [PrismaModule],
  providers: [
    AiService,
    EmbeddingService,
    KnowledgeRetrievalService,
    ProductRetrievalService,
  ],
  controllers: [AiController],
  exports: [AiService], // Xuất ra để sau này Socket Gateway có thể dùng
})
export class AiModule {}
