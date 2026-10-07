import { Injectable, NotFoundException } from '@nestjs/common';
import { ChatMode, MessageSource, Role } from '@prisma/client';
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

  private async requireSellerConversation(sellerId: string, buyerId: string) {
    const buyer = await this.prisma.user.findFirst({
      where: { id: buyerId, role: Role.BUYER },
      select: { id: true },
    });
    if (!buyer) throw new NotFoundException('Khách hàng không tồn tại.');

    const message = await this.prisma.directMessage.findFirst({
      where: {
        OR: [
          { senderId: sellerId, receiverId: buyerId },
          { senderId: buyerId, receiverId: sellerId },
        ],
      },
      select: { id: true },
    });
    if (!message) throw new NotFoundException('Cuộc trò chuyện không tồn tại.');
  }

  private async readConversationMode(buyerId: string, sellerId: string) {
    const status = await this.prisma.conversation.findUnique({
      where: { buyerId_sellerId: { buyerId, sellerId } },
      select: { mode: true, version: true },
    });
    // GET không tạo dữ liệu: cặp chưa có bản ghi sử dụng chế độ AI mặc định.
    return status ?? { mode: ChatMode.AI, version: 0 };
  }

  async getBuyerConversationMode(buyerId: string, sellerId: string) {
    const seller = await this.prisma.user.findFirst({
      where: { id: sellerId, role: Role.SELLER },
      select: { id: true },
    });
    if (!seller) throw new NotFoundException('Shop không tồn tại.');
    return this.readConversationMode(buyerId, sellerId);
  }

  async getSellerConversationMode(sellerId: string, buyerId: string) {
    await this.requireSellerConversation(sellerId, buyerId);
    return this.readConversationMode(buyerId, sellerId);
  }

  async updateSellerConversationMode(
    sellerId: string,
    buyerId: string,
    mode: ChatMode,
  ) {
    await this.requireSellerConversation(sellerId, buyerId);
    return this.prisma.conversation.upsert({
      where: { buyerId_sellerId: { buyerId, sellerId } },
      create: { buyerId, sellerId, mode },
      update: { mode, version: { increment: 1 } },
      select: { mode: true, version: true },
    });
  }

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

    return this.prisma.$transaction(async (tx) => {
      await tx.conversation.upsert({
        where: { buyerId_sellerId: { buyerId, sellerId } },
        create: { buyerId, sellerId, mode: ChatMode.HUMAN },
        update: { mode: ChatMode.HUMAN, version: { increment: 1 } },
      });

      return tx.directMessage.create({
        data: {
          senderId: sellerId,
          receiverId: buyerId,
          content: message,
          source: MessageSource.SELLER,
        },
        include: {
          sender: {
            select: { id: true, name: true, role: true },
          },
        },
      });
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

    const conversation = await this.prisma.conversation.upsert({
      where: { buyerId_sellerId: { buyerId, sellerId } },
      create: { buyerId, sellerId },
      // Không đặt lại mode: hội thoại HUMAN phải giữ nguyên sau khi tải lại.
      update: { buyerId },
    });

    // Đọc trước khi lưu câu hỏi mới để không gửi câu hỏi hai lần cho AI.
    const previousMessages =
      conversation.mode === ChatMode.AI
        ? await this.prisma.directMessage.findMany({
            where: {
              OR: [
                { senderId: buyerId, receiverId: sellerId },
                { senderId: sellerId, receiverId: buyerId },
              ],
              qrUrl: null,
              source: { not: MessageSource.SYSTEM },
            },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: AI_HISTORY_MESSAGE_LIMIT,
            select: { senderId: true, content: true },
          })
        : [];
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
        source: MessageSource.BUYER,
      },
      include: {
        sender: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    if (conversation.mode === ChatMode.HUMAN) {
      return { buyerMessage, aiMessage: null };
    }

    const reply = await this.aiService.generateReply(
      sellerId,
      message,
      history,
    );

    // Không giữ transaction trong lúc chờ Groq. UPDATE có điều kiện khóa dòng
    // đến khi lưu xong tin AI, tránh Seller tiếp quản giữa kiểm tra và CREATE.
    const aiMessage = await this.prisma.$transaction(async (tx) => {
      const allowed = await tx.conversation.updateMany({
        where: {
          id: conversation.id,
          mode: ChatMode.AI,
          version: conversation.version,
        },
        data: { mode: ChatMode.AI },
      });

      if (allowed.count === 0) return null;

      return tx.directMessage.create({
        data: {
          senderId: sellerId,
          receiverId: buyerId,
          content: reply,
          source: MessageSource.AI,
          isRead: true,
        },
        include: {
          sender: {
            select: { id: true, name: true, role: true },
          },
        },
      });
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
        source: MessageSource.SYSTEM,
      },
    });
  }
}
