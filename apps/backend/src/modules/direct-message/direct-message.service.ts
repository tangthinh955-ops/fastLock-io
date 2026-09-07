import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class DirectMessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  // Chỉ trả thông tin cần thiết để hiển thị danh sách shop trong Inbox.
  async getShops() {
    return this.prisma.user.findMany({
      where: { role: Role.SELLER },
      select: { id: true, name: true },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });
  }

  // Lấy danh sách Buyer đã gửi hoặc nhận tin nhắn với Seller.
  async getSellerCustomers(sellerId: string) {
    return this.prisma.user.findMany({
      where: {
        role: Role.BUYER,
        OR: [
          { messagesSent: { some: { receiverId: sellerId } } },
          { messagesRecv: { some: { senderId: sellerId } } },
        ],
      },
      select: { id: true, name: true },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });
  }

  // Seller lấy lịch sử hai chiều với đúng tài khoản Buyer được chọn (Mặc định 5 tin mới nhất).
  async getSellerConversation(
    sellerId: string,
    buyerId: string,
    limit: number = 5,
    skip: number = 0,
  ) {
    const buyer = await this.prisma.user.findFirst({
      where: { id: buyerId, role: Role.BUYER },
      select: { id: true },
    });

    if (!buyer) {
      throw new NotFoundException('Khách hàng không tồn tại.');
    }

    const messages = await this.prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: sellerId, receiverId: buyerId },
          { senderId: buyerId, receiverId: sellerId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: skip,
      include: {
        sender: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return messages.reverse();
  }

  // Seller chỉ được gửi trả lời cho Buyer đã có cuộc trò chuyện với shop này.
  async sendSellerMessage(sellerId: string, buyerId: string, message: string) {
    const buyer = await this.prisma.user.findFirst({
      where: { id: buyerId, role: Role.BUYER },
      select: { id: true },
    });

    if (!buyer) {
      throw new NotFoundException('Khách hàng không tồn tại.');
    }

    const conversation = await this.prisma.directMessage.findFirst({
      where: {
        OR: [
          { senderId: sellerId, receiverId: buyerId },
          { senderId: buyerId, receiverId: sellerId },
        ],
      },
      select: { id: true },
    });

    if (!conversation) {
      throw new NotFoundException('Cuộc trò chuyện không tồn tại.');
    }

    return this.prisma.directMessage.create({
      data: {
        senderId: sellerId,
        receiverId: buyerId,
        content: message,
      },
      include: {
        sender: {
          select: { id: true, name: true, role: true },
        },
      },
    });
  }

  // Lấy tin nhắn theo cả hai chiều giữa một Buyer và một Seller (Mặc định 5 tin mới nhất).
  async getConversation(
    buyerId: string,
    sellerId: string,
    limit: number = 5,
    skip: number = 0,
  ) {
    const seller = await this.prisma.user.findFirst({
      where: { id: sellerId, role: Role.SELLER },
      select: { id: true },
    });

    if (!seller) {
      throw new NotFoundException('Shop không tồn tại.');
    }

    const messages = await this.prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: buyerId, receiverId: sellerId },
          { senderId: sellerId, receiverId: buyerId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: skip,
      include: {
        sender: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return messages.reverse();
  }

  // Lưu tin nhắn Buyer gửi đến đúng tài khoản Seller.
  async sendChatMessage(buyerId: string, sellerId: string, message: string) {
    const seller = await this.prisma.user.findFirst({
      where: { id: sellerId, role: Role.SELLER },
      select: { id: true },
    });

    if (!seller) {
      throw new NotFoundException('Shop không tồn tại.');
    }

    const buyerMessage = await this.prisma.directMessage.create({
      data: {
        senderId: buyerId,
        receiverId: sellerId,
        content: message,
      },
      include: {
        sender: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    const reply = await this.aiService.generateReply(sellerId, message);

    const aiMessage = await this.prisma.directMessage.create({
      data: {
        senderId: sellerId,
        receiverId: buyerId,
        content: reply,
      },
      include: {
        sender: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return { buyerMessage, aiMessage };
  }

  // 1. Tạo tin nhắn chứa mã VietQR
  async sendOrderMessage(
    senderId: string,
    receiverId: string,
    amount: number,
    orderId: string,
  ) {
    // Ngân hàng giả lập: Vietcombank, STK: 123456789
    const bank = 'BIDV';
    const account = '0334897940';
    const template = 'compact'; // Mẫu QR nhỏ gọn
    const description = `Thanh toan don hang ${orderId}`;

    // Tạo link ảnh VietQR
    const qrUrl = `https://img.vietqr.io/image/${bank}-${account}-${template}.png?amount=${amount}&addInfo=${description}`;
    const content = `Chúc mừng bạn đã chốt thành công đơn hàng ${orderId} trị giá ${amount}đ. Vui lòng quét mã QR bên dưới để thanh toán nhé!`;

    // Lưu vào Database
    return this.prisma.directMessage.create({
      data: {
        senderId,
        receiverId,
        content,
        qrUrl,
      },
    });
  }

  // 2. Lấy Hộp thư của 1 người dùng (Phân trang bằng limit + skip)
  async getUserInbox(userId: string, limit: number = 10, skip: number = 0) {
    return this.prisma.directMessage.findMany({
      where: { receiverId: userId },
      orderBy: { createdAt: 'desc' }, // Mới nhất xếp trên cùng
      take: limit, // Số bản ghi cần lấy (VD: 10)
      skip: skip, // Bỏ qua bao nhiêu bản ghi (VD: skip=10 => trang 2)
      include: {
        sender: {
          select: { id: true, name: true, role: true },
        },
      },
    });
  }
}
