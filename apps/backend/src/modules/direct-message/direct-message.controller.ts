import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { DirectMessageService } from './direct-message.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('messages')
// Bật cả 2 Khiên: Kiểm tra Đăng nhập & Kiểm tra Phân quyền
@UseGuards(JwtAuthGuard, RolesGuard)
export class DirectMessageController {
  constructor(private readonly messageService: DirectMessageService) {}

  // API 1: Tạo tin nhắn VietQR (Gửi cho Buyer)
  // [BẢO MẬT] Cấm ngặt BUYER gọi API này để fake bill lừa đảo người khác
  @Roles(Role.ADMIN, Role.SELLER)
  @Post()
  async createMessage(
    @Req() req: any, // Lấy thông tin người đang gọi API (System / Seller)
    @Body() body: CreateMessageDto // Sử dụng DTO đã được Validate
  ) {
    return this.messageService.sendOrderMessage(
      req.user.userId, // Người gửi (Seller)
      body.receiverId, // Người nhận (Buyer)
      body.amount, 
      body.orderId
    );
  }


  // API 2: Lấy Hộp thư đến của người đang đăng nhập
  @Get('my-inbox')
  async getMyInbox(@Req() req: any) {
    return this.messageService.getUserInbox(req.user.userId); // Chỉnh lại userId
  }
}
