import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Query,
  Param,
} from '@nestjs/common';
import { DirectMessageService } from './direct-message.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CreateMessageDto } from './dto/create-message.dto';
import { SendChatMessageDto } from './dto/send-chat-message.dto';
import { SendSellerMessageDto } from './dto/send-seller-message.dto';

@Controller('messages')
// Bật cả 2 Khiên: Kiểm tra Đăng nhập & Kiểm tra Phân quyền
@UseGuards(JwtAuthGuard, RolesGuard)
export class DirectMessageController {
  constructor(private readonly messageService: DirectMessageService) {}

  // Danh sách shop để Buyer bắt đầu tư vấn, kể cả khi chưa có đơn hàng.
  @Get('shops')
  @Roles(Role.BUYER)
  async getShops() {
    return this.messageService.getShops();
  }

  // Danh sách Buyer đã từng trao đổi với Seller đang đăng nhập.
  @Get('seller/customers')
  @Roles(Role.SELLER)
  async getSellerCustomers(@Req() req: any) {
    return this.messageService.getSellerCustomers(req.user.userId);
  }

  // Seller xem lịch sử chat với một Buyer thuộc cuộc trò chuyện của mình (Mặc định 5 tin mới nhất).
  @Get('seller/conversations/:buyerId')
  @Roles(Role.SELLER)
  async getSellerConversation(
    @Req() req: any,
    @Param('buyerId') buyerId: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 5;
    const parsedSkip = skip ? parseInt(skip, 10) : 0;
    return this.messageService.getSellerConversation(
      req.user.userId,
      buyerId,
      parsedLimit,
      parsedSkip,
    );
  }

  // Seller trả lời thủ công trong cuộc trò chuyện đã có với Buyer.
  @Post('seller/conversations')
  @Roles(Role.SELLER)
  async sendSellerMessage(
    @Req() req: any,
    @Body() body: SendSellerMessageDto,
  ) {
    return this.messageService.sendSellerMessage(
      req.user.userId,
      body.buyerId,
      body.message,
    );
  }

  // Lấy lịch sử chat riêng giữa Buyer đang đăng nhập và shop được chọn (Mặc định 5 tin mới nhất).
  @Get('conversations/:sellerId')
  @Roles(Role.BUYER)
  async getConversation(
    @Req() req: any,
    @Param('sellerId') sellerId: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 5;
    const parsedSkip = skip ? parseInt(skip, 10) : 0;
    return this.messageService.getConversation(
      req.user.userId,
      sellerId,
      parsedLimit,
      parsedSkip,
    );
  }

  // Buyer gửi tin nhắn cho shop trong cuộc trò chuyện riêng.
  @Post('conversations')
  @Roles(Role.BUYER)
  async sendChatMessage(@Req() req: any, @Body() body: SendChatMessageDto) {
    return this.messageService.sendChatMessage(
      req.user.userId,
      body.sellerId,
      body.message,
    );
  }

  // API 1: Tạo tin nhắn VietQR (Gửi cho Buyer)
  // [BẢO MẬT] Cấm ngặt BUYER gọi API này để fake bill lừa đảo người khác
  @Roles(Role.ADMIN, Role.SELLER)
  @Post()
  async createMessage(
    @Req() req: any, // Lấy thông tin người đang gọi API (System / Seller)
    @Body() body: CreateMessageDto, // Sử dụng DTO đã được Validate
  ) {
    return this.messageService.sendOrderMessage(
      req.user.userId, // Người gửi (Seller)
      body.receiverId, // Người nhận (Buyer)
      body.amount,
      body.orderId,
    );
  }

  // API 2: Lấy Hộp thư đến của người đang đăng nhập (Có phân trang)
  @Get('my-inbox')
  async getMyInbox(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    const parsedSkip = skip ? parseInt(skip, 10) : 0;
    return this.messageService.getUserInbox(
      req.user.userId,
      parsedLimit,
      parsedSkip,
    );
  }
}
