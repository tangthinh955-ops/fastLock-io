import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PayOS, type Webhook, type WebhookData } from '@payos/node';
import { OrderStatus } from '@prisma/client';
import { randomInt } from 'crypto';
import { PrismaService } from '../../core/prisma/prisma.service';
import { DirectMessageService } from '../direct-message/direct-message.service';

export interface PayosPaymentSummary {
  orderCode: number;
  paymentLinkId: string;
  checkoutUrl: string;
  qrCode: string;
  qrUrl: string;
  accountNumber: string;
  accountName: string;
  bin: string;
  description: string;
  amount: number;
}

export interface OrderForPaymentLink {
  id: string;
  sellerId?: string;
  totalAmount: number;
  expiresAt?: Date | null;
  recipientName?: string | null;
  shippingPhone?: string | null;
  shippingAddress?: string | null;
  items?: Array<{
    quantity: number;
    unitPrice: number;
    product?: {
      name: string;
      sku?: string;
    };
  }>;
}

interface OrderWithPaymentRelations {
  id: string;
  buyerId: string;
  totalAmount: number;
  status: OrderStatus;
  payosOrderCode: string | null;
  livestream?: { sellerId: string } | null;
  items?: Array<{
    product?: {
      name: string;
      sku: string;
    };
  }>;
}

const DEFAULT_PAYOS_RETURN_URL = 'http://localhost:5173/inbox';
const PAYOS_EXPIRY_FALLBACK_SECONDS = 2 * 60;

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private payosClient?: PayOS | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly directMessageService: DirectMessageService,
  ) {}

  isConfigured(): boolean {
    return this.getPayosClient() !== null;
  }

  private getPayosClient(): PayOS | null {
    if (this.payosClient !== undefined) {
      return this.payosClient;
    }

    const clientId = this.configService.get<string>('PAYOS_CLIENT_ID')?.trim();
    const apiKey = this.configService.get<string>('PAYOS_API_KEY')?.trim();
    const checksumKey = this.configService
      .get<string>('PAYOS_CHECKSUM_KEY')
      ?.trim();

    if (!clientId || !apiKey || !checksumKey) {
      this.payosClient = null;
      return null;
    }

    this.payosClient = new PayOS({
      clientId,
      apiKey,
      checksumKey,
    });
    return this.payosClient;
  }

  private generateOrderCode(): number {
    // 15-digit safe positive integer (<= Number.MAX_SAFE_INTEGER)
    return Date.now() * 100 + randomInt(0, 100);
  }

  private buildVietQrImageUrl(
    bin: string,
    accountNumber: string,
    amount: number,
    description: string,
    accountName: string,
  ): string {
    return (
      `https://img.vietqr.io/image/${encodeURIComponent(bin)}-${encodeURIComponent(accountNumber)}-compact.png` +
      `?amount=${amount}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(accountName)}`
    );
  }

  private appendQueryParams(
    baseUrl: string,
    params: Record<string, string | undefined>,
  ): string {
    try {
      const url = new URL(baseUrl);
      for (const [key, value] of Object.entries(params)) {
        if (value) {
          url.searchParams.set(key, value);
        }
      }
      return url.toString();
    } catch {
      return baseUrl;
    }
  }

  async createPaymentLinkForOrder(
    order: OrderForPaymentLink,
  ): Promise<PayosPaymentSummary | null> {
    const payos = this.getPayosClient();
    if (!payos) {
      this.logger.warn(
        'payOS chưa được cấu hình (thiếu PAYOS_CLIENT_ID/PAYOS_API_KEY/PAYOS_CHECKSUM_KEY); bỏ qua tạo link payOS.',
      );
      return null;
    }

    const amount = Math.round(order.totalAmount);
    if (!Number.isFinite(amount) || amount < 1) {
      throw new BadRequestException('Số tiền thanh toán không hợp lệ.');
    }

    const shortCode = order.id.slice(0, 8).toUpperCase();
    // Giới hạn <= 25 ký tự để tương thích mọi ngân hàng nội địa qua payOS
    const description = `DH ${shortCode}`;
    const rawReturnUrl =
      this.configService.get<string>('PAYOS_RETURN_URL')?.trim() ||
      DEFAULT_PAYOS_RETURN_URL;
    const rawCancelUrl =
      this.configService.get<string>('PAYOS_CANCEL_URL')?.trim() ||
      rawReturnUrl;
    const returnUrl = this.appendQueryParams(rawReturnUrl, {
      sellerId: order.sellerId,
      orderId: order.id,
    });
    const cancelUrl = this.appendQueryParams(rawCancelUrl, {
      sellerId: order.sellerId,
      orderId: order.id,
    });
    const nowSec = Math.floor(Date.now() / 1000);
    const expiresAtSec = order.expiresAt
      ? Math.floor(order.expiresAt.getTime() / 1000)
      : nowSec + PAYOS_EXPIRY_FALLBACK_SECONDS;
    const expiredAt = Math.max(expiresAtSec, nowSec + 60);

    const orderCode = this.generateOrderCode();
    const items = order.items?.map((item) => ({
      name: item.product?.name || 'San pham LiveOrder',
      quantity: item.quantity,
      price: Math.round(item.unitPrice),
    }));

    const paymentLink = await payos.paymentRequests.create({
      orderCode,
      amount,
      description,
      returnUrl,
      cancelUrl,
      expiredAt,
      items: items && items.length > 0 ? items : undefined,
      buyerName: order.recipientName || undefined,
      buyerPhone: order.shippingPhone || undefined,
      buyerAddress: order.shippingAddress || undefined,
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        payosOrderCode: String(paymentLink.orderCode),
        paymentLinkId: paymentLink.paymentLinkId,
        checkoutUrl: paymentLink.checkoutUrl,
        qrCode: paymentLink.qrCode,
      },
    });

    const qrUrl = this.buildVietQrImageUrl(
      paymentLink.bin,
      paymentLink.accountNumber,
      paymentLink.amount,
      paymentLink.description,
      paymentLink.accountName,
    );

    return {
      orderCode: paymentLink.orderCode,
      paymentLinkId: paymentLink.paymentLinkId,
      checkoutUrl: paymentLink.checkoutUrl,
      qrCode: paymentLink.qrCode,
      qrUrl,
      accountNumber: paymentLink.accountNumber,
      accountName: paymentLink.accountName,
      bin: paymentLink.bin,
      description: paymentLink.description,
      amount: paymentLink.amount,
    };
  }

  async handlePayosWebhook(rawBody: unknown) {
    const payos = this.getPayosClient();
    if (!payos) {
      throw new ServiceUnavailableException(
        'payOS chưa được cấu hình trên máy chủ.',
      );
    }

    if (!rawBody || typeof rawBody !== 'object') {
      throw new BadRequestException('Payload Webhook payOS không hợp lệ.');
    }

    const payload = rawBody as Webhook;
    let webhookData: WebhookData;
    try {
      webhookData = await payos.webhooks.verify(payload);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Từ chối Webhook payOS do sai chữ ký: ${detail}`);
      throw new BadRequestException('Chữ ký Webhook payOS không hợp lệ.');
    }

    const isSuccessCode =
      payload.success !== false &&
      payload.code === '00' &&
      (!webhookData.code || webhookData.code === '00');

    if (!isSuccessCode) {
      return {
        received: true,
        status: 'IGNORED',
        reason: 'payment_not_successful',
      };
    }

    const orderCodeStr = String(webhookData.orderCode);
    const order = await this.prisma.order.findUnique({
      where: { payosOrderCode: orderCodeStr },
      include: {
        livestream: { select: { sellerId: true } },
        items: {
          include: {
            product: { select: { name: true, sku: true } },
          },
        },
      },
    });

    if (!order) {
      this.logger.log(
        `Bỏ qua Webhook payOS cho orderCode=${orderCodeStr} (không khớp đơn hàng hoặc test ping xác minh URL).`,
      );
      return {
        received: true,
        status: 'IGNORED',
        reason: 'order_not_found',
      };
    }

    const paymentRef =
      webhookData.reference?.trim() || `PAYOS-${orderCodeStr}`;
    return this.markOrderPaidAtomically(order, webhookData.amount, paymentRef);
  }

  async reconcileOrderPayment(
    orderId: string,
    user: { userId: string; role: string },
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        livestream: { select: { sellerId: true } },
        items: {
          include: {
            product: { select: { name: true, sku: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng ID ${orderId}`);
    }

    if (user.role === 'BUYER' && order.buyerId !== user.userId) {
      throw new ForbiddenException(
        'Bạn không có quyền đối soát đơn hàng của người khác!',
      );
    }

    if (
      user.role === 'SELLER' &&
      order.livestream?.sellerId !== user.userId
    ) {
      throw new ForbiddenException(
        'Đơn hàng này không thuộc phiên Livestream của bạn!',
      );
    }

    if (order.status === OrderStatus.PAID) {
      return { orderId: order.id, status: OrderStatus.PAID, synced: false };
    }

    if (order.status !== OrderStatus.PENDING || !order.payosOrderCode) {
      return { orderId: order.id, status: order.status, synced: false };
    }

    const payos = this.getPayosClient();
    if (!payos) {
      throw new ServiceUnavailableException(
        'payOS chưa được cấu hình trên máy chủ.',
      );
    }

    const paymentLink = await payos.paymentRequests.get(
      Number(order.payosOrderCode),
    );

    if (paymentLink.status !== 'PAID') {
      return {
        orderId: order.id,
        status: order.status,
        payosStatus: paymentLink.status,
        synced: false,
      };
    }

    const paidAmount = paymentLink.amountPaid || paymentLink.amount;
    const paymentRef =
      paymentLink.transactions?.[0]?.reference?.trim() ||
      `PAYOS-${order.payosOrderCode}`;
    const result = await this.markOrderPaidAtomically(
      order,
      paidAmount,
      paymentRef,
    );

    return {
      orderId: order.id,
      status: result.status === 'PAID' || result.status === 'ALREADY_PAID'
        ? OrderStatus.PAID
        : order.status,
      payosStatus: paymentLink.status,
      synced: result.status === 'PAID',
    };
  }

  async syncOrderIfPaidOnPayos(
    order: OrderWithPaymentRelations,
  ): Promise<boolean> {
    if (!order.payosOrderCode) return false;
    const payos = this.getPayosClient();
    if (!payos) return false;

    try {
      const paymentLink = await payos.paymentRequests.get(
        Number(order.payosOrderCode),
      );
      if (paymentLink.status !== 'PAID') {
        return false;
      }

      const paidAmount = paymentLink.amountPaid || paymentLink.amount;
      const paymentRef =
        paymentLink.transactions?.[0]?.reference?.trim() ||
        `PAYOS-${order.payosOrderCode}`;
      const result = await this.markOrderPaidAtomically(
        order,
        paidAmount,
        paymentRef,
      );
      return result.status === 'PAID' || result.status === 'ALREADY_PAID';
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Không thể đối soát payOS trước khi hết hạn cho đơn ${order.id}: ${detail}`,
      );
      return false;
    }
  }

  async cancelPaymentLinkSafely(orderId: string, reason = 'Đơn hàng đã bị hủy') {
    const payos = this.getPayosClient();
    if (!payos) return;

    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { payosOrderCode: true },
      });
      if (!order?.payosOrderCode) return;

      await payos.paymentRequests.cancel(Number(order.payosOrderCode), reason);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Không thể hủy link payOS cho đơn ${orderId}: ${detail}`,
      );
    }
  }

  private async markOrderPaidAtomically(
    order: OrderWithPaymentRelations,
    paidAmount: number,
    paymentRef: string,
  ) {
    const expectedAmount = Math.round(order.totalAmount);
    if (!Number.isFinite(paidAmount) || paidAmount < expectedAmount) {
      this.logger.warn(
        `Bỏ qua xác nhận PAID cho đơn ${order.id}: số tiền nhận (${paidAmount}) nhỏ hơn giá trị đơn (${expectedAmount}).`,
      );
      return {
        received: true,
        status: 'UNDERPAID',
        orderId: order.id,
      };
    }

    if (order.status === OrderStatus.PAID) {
      return {
        received: true,
        status: 'ALREADY_PAID',
        orderId: order.id,
      };
    }

    if (order.status !== OrderStatus.PENDING) {
      this.logger.warn(
        `Bỏ qua xác nhận PAID cho đơn ${order.id} vì trạng thái hiện tại là ${order.status}.`,
      );
      return {
        received: true,
        status: 'SKIPPED_NON_PENDING',
        orderId: order.id,
      };
    }

    const claimed = await this.prisma.$transaction(async (tx) => {
      const result = await tx.order.updateMany({
        where: {
          id: order.id,
          status: OrderStatus.PENDING,
        },
        data: {
          status: OrderStatus.PAID,
          paidAt: new Date(),
          paymentRef,
        },
      });
      return result.count === 1;
    });

    if (!claimed) {
      return {
        received: true,
        status: 'ALREADY_PROCESSED',
        orderId: order.id,
      };
    }

    const sellerId = order.livestream?.sellerId;
    const firstProduct = order.items?.[0]?.product;
    if (sellerId) {
      try {
        await this.directMessageService.sendPaymentConfirmedMessage(
          sellerId,
          order.buyerId,
          order.totalAmount,
          order.id,
          paymentRef,
          firstProduct?.name,
          firstProduct?.sku,
        );
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Đơn ${order.id} đã PAID nhưng gửi thông báo Inbox thất bại: ${detail}`,
        );
      }
    }

    return {
      received: true,
      status: 'PAID',
      orderId: order.id,
    };
  }
}
