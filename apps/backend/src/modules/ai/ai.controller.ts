import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Delete,
  Param,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { CreateKbEntryDto } from './dto/create-kb.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // --- API QUẢN LÝ KNOWLEDGE BASE DÀNH CHO SELLER ---

  @Get('knowledge')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER)
  async getKnowledgeBases(@Req() req: any) {
    const sellerId = req.user.userId;
    return this.aiService.getKnowledgeBases(sellerId);
  }

  @Post('knowledge')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER)
  async addKnowledgeBase(@Req() req: any, @Body() dto: CreateKbEntryDto) {
    const sellerId = req.user.userId;
    return this.aiService.addKnowledgeBase(sellerId, dto.keyword, dto.answer);
  }

  @Delete('knowledge/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER)
  async deleteKnowledgeBase(@Req() req: any, @Param('id') id: string) {
    const sellerId = req.user.userId;
    return this.aiService.deleteKnowledgeBase(sellerId, id);
  }
}
