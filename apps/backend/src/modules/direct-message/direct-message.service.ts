import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class DirectMessageService {
  constructor(private prisma: PrismaService) {}

  // 1. Tạo tin nhắn chứa mã VietQR
  async sendOrderMessage(senderId: string, receiverId: string, amount: number, orderId: string) {
    // Ngân hàng giả lập: Vietcombank, STK: 123456789
    const bank = 'vietcombank';
    const account = '123456789';
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

  // 2. Lấy toàn bộ Hộp thư của 1 người dùng (Người nhận)
  async getUserInbox(userId: string) {
    return this.prisma.directMessage.findMany({
      where: { receiverId: userId },
      orderBy: { createdAt: 'desc' }, // Mới nhất xếp trên cùng
      include: {
        sender: {
          select: { id: true, name: true, role: true } // Lấy thêm tên người gửi
        }
      }
    });
  }
}
