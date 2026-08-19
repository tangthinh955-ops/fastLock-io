import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { DirectMessageService } from './direct-message.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('messages')
@UseGuards(JwtAuthGuard) // Bắt buộc phải đăng nhập mới xài được
export class DirectMessageController {
  constructor(private readonly messageService: DirectMessageService) {}

  // API 1: Tạo tin nhắn VietQR (Gửi cho Buyer)
  @Post()
  async createMessage(
    @Req() req: any, // Lấy thông tin người đang gọi API (System / Seller)
    @Body() body: { receiverId: string; amount: number; orderId: string }
  ) {
    return this.messageService.sendOrderMessage(
      req.user.userId, // Sửa lại thành userId thay vì id
      body.receiverId, 
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
