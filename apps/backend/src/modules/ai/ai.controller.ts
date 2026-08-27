import { Controller, Post, Body, UseGuards, Req, Get, Delete, Param, BadRequestException } from '@nestjs/common';
import { AiService } from './ai.service';
import { CreateKbEntryDto } from './dto/create-kb.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // Mở API test: Bắt buộc đăng nhập với quyền SELLER mới được dùng
  @Post('chat')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER)
  async testChatAI(
    @Req() req: any,
    @Body() body: { message: string }
  ) {
    const sellerId = req.user.userId;
    const customerMessage = body.message;

    // Gọi hàm sinh câu trả lời từ não AI
    const reply = await this.aiService.generateReply(sellerId, customerMessage);
    
    return {
      status: 'success',
      reply: reply,
    };
  }

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
  async addKnowledgeBase(
    @Req() req: any,
    @Body() dto: CreateKbEntryDto
  ) {
    const sellerId = req.user.userId;
    try {
      return await this.aiService.addKnowledgeBase(sellerId, dto.keyword, dto.answer);
    } catch (error: any) {
      if (error.message === 'LIMIT_EXCEEDED') {
        throw new BadRequestException('Bạn đã đạt giới hạn tối đa 20 quy tắc. Vui lòng xóa bớt các quy tắc cũ để thêm mới.');
      }
      throw error;
    }
  }

  @Delete('knowledge/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER)
  async deleteKnowledgeBase(
    @Req() req: any,
    @Param('id') id: string
  ) {
    const sellerId = req.user.userId;
    return this.aiService.deleteKnowledgeBase(sellerId, id);
  }
}
