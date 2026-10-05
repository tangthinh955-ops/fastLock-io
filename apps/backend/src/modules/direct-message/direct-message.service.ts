import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  AiService,
  AI_HISTORY_MESSAGE_LIMIT,
  type ConversationMessage,
} from '../ai/ai.service';

@Injectable()
export class DirectMessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  // Chỉ trả thông tin cần thiết để hiển thị danh sách shop trong Inbox.
  async getShops(buyerId: string) {
    const shops = await this.prisma.user.findMany({
      where: { role: Role.SELLER },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            messagesSent: {
              where: { receiverId: buyerId, isRead: false },
            },
          },
        },
      },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });

    return shops.map(({ _count, ...shop }) => ({
      ...shop,
      unreadCount: _count.messagesSent,
    }));
  }

  // Lấy danh sách Buyer đã gửi hoặc nhận tin nhắn với Seller.
  async getSellerCustomers(sellerId: string) {
    const buyers = await this.prisma.user.findMany({
      where: {
        role: Role.BUYER,
        OR: [
          { messagesSent: { some: { receiverId: sellerId } } },
          { messagesRecv: { some: { senderId: sellerId } } },
        ],
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            messagesSent: {
              where: { receiverId: sellerId, isRead: false },
            },
          },
        },
      },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });

    return buyers.map(({ _count, ...buyer }) => ({
      ...buyer,
      unreadCount: _count.messagesSent,
    }));
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

  async markSellerConversationRead(sellerId: string, buyerId: string) {
    const buyer = await this.prisma.user.findFirst({
      where: { id: buyerId, role: Role.BUYER },
      select: { id: true },
    });

    if (!buyer) {
      throw new NotFoundException('Khách hàng không tồn tại.');
    }

    const result = await this.prisma.directMessage.updateMany({
      where: {
        senderId: buyerId,
        receiverId: sellerId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return { updatedCount: result.count };
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

  async markBuyerConversationRead(buyerId: string, sellerId: string) {
    const seller = await this.prisma.user.findFirst({
      where: { id: sellerId, role: Role.SELLER },
      select: { id: true },
    });

    if (!seller) {
      throw new NotFoundException('Shop không tồn tại.');
    }

    const result = await this.prisma.directMessage.updateMany({
      where: {
        senderId: sellerId,
        receiverId: buyerId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return { updatedCount: result.count };
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

    // Đọc trước khi lưu câu hỏi mới để không gửi câu hỏi hai lần cho AI.
    const previousMessages = await this.prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: buyerId, receiverId: sellerId },
          { senderId: sellerId, receiverId: buyerId },
        ],
        qrUrl: null,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: AI_HISTORY_MESSAGE_LIMIT,
      select: { senderId: true, content: true },
    });
    const history: ConversationMessage[] = previousMessages
      .reverse()
      .map((entry) => ({
        role: entry.senderId === buyerId ? 'user' : 'assistant',
        content: entry.content,
      }));

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

    const reply = await this.aiService.generateReply(
      sellerId,
      message,
      history,
    );

    const aiMessage = await this.prisma.directMessage.create({
      data: {
        senderId: sellerId,
        receiverId: buyerId,
        content: reply,
        isRead: true,
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
    productName?: string,
    productSku?: string,
  ) {
    const buyer = await this.prisma.user.findFirst({
      where: { id: receiverId, role: Role.BUYER },
      select: { id: true },
    });

    if (!buyer) {
      throw new NotFoundException('Khách hàng nhận VietQR không tồn tại.');
    }

    // Ngân hàng giả lập: Vietcombank, STK: 123456789
    const bank = 'BIDV';
    const account = '0334897940';
    const template = 'compact'; // Mẫu QR nhỏ gọn
    const description = `Thanh toan don hang ${orderId}`;

    // Tạo link ảnh VietQR
    const qrUrl = `https://img.vietqr.io/image/${bank}-${account}-${template}.png?amount=${amount}&addInfo=${description}`;
    const orderCode = orderId.slice(0, 8).toUpperCase();
    const formattedAmount = amount.toLocaleString('vi-VN');
    const productDetail = productName
      ? `sản phẩm ${productName}${productSku ? ` (SKU: ${productSku})` : ''}`
      : 'đơn hàng';
    const content = `🎉 Bạn đã chốt thành công ${productDetail}. Tổng thanh toán: ${formattedAmount}đ. Mã đơn: ${orderCode}. Vui lòng quét mã QR bên dưới để thanh toán nhé!`;

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
}
