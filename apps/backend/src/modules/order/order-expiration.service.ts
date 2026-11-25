import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { DirectMessageService } from '../direct-message/direct-message.service';
import { PaymentService } from '../payment/payment.service';

const SWEEP_INTERVAL_MS = 15_000;
const SWEEP_BATCH_LIMIT = 20;

@Injectable()
export class OrderExpirationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderExpirationService.name);
  private intervalHandle: NodeJS.Timeout | null = null;
  private isSweeping = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
    private readonly directMessageService: DirectMessageService,
  ) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    this.intervalHandle = setInterval(() => {
      void this.expireOverdueOrders();
    }, SWEEP_INTERVAL_MS);
    this.intervalHandle.unref?.();
    this.logger.log(
      `Đã bật tác vụ tự động hủy đơn quá hạn thanh toán (quét mỗi ${SWEEP_INTERVAL_MS / 1000}s).`,
    );
  }

  onModuleDestroy() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  async expireOverdueOrders(now = new Date()): Promise<number> {
    if (this.isSweeping) {
      return 0;
    }
    this.isSweeping = true;

    let cancelledCount = 0;
    try {
      const overdueOrders = await this.prisma.order.findMany({
        where: {
          status: OrderStatus.PENDING,
          expiresAt: { lte: now },
        },
        take: SWEEP_BATCH_LIMIT,
        include: {
          items: {
            include: {
              product: { select: { name: true, sku: true } },
            },
          },
          livestream: { select: { sellerId: true } },
        },
      });

      for (const order of overdueOrders) {
        // Kiểm tra lại với payOS trước khi hủy phòng trường hợp khách vừa thanh toán phút chót
        const paidOnPayos =
          await this.paymentService.syncOrderIfPaidOnPayos(order);
        if (paidOnPayos) {
          continue;
        }

        const claimed = await this.prisma.$transaction(async (tx) => {
          const updated = await tx.order.updateMany({
            where: {
              id: order.id,
              status: OrderStatus.PENDING,
              expiresAt: { lte: now },
            },
            data: { status: OrderStatus.CANCELLED },
          });

          if (updated.count === 0) {
            return false;
          }

          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });
          }

          return true;
        });

        if (!claimed) {
          continue;
        }

        cancelledCount += 1;
        this.logger.log(
          `Đã tự động hủy đơn hết hạn ${order.id} và hoàn kho cho ${order.items.length} sản phẩm.`,
        );

        await this.paymentService.cancelPaymentLinkSafely(
          order.id,
          'Đơn hàng hết hạn thanh toán',
        );

        const sellerId = order.livestream?.sellerId;
        const firstProduct = order.items[0]?.product;
        if (sellerId) {
          try {
            await this.directMessageService.sendOrderExpiredMessage(
              sellerId,
              order.buyerId,
              order.id,
              firstProduct?.name,
              firstProduct?.sku,
            );
          } catch (error) {
            const detail =
              error instanceof Error ? error.message : String(error);
            this.logger.warn(
              `Không thể gửi tin nhắn hết hạn cho đơn ${order.id}: ${detail}`,
            );
          }
        }
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Lỗi khi quét đơn hàng quá hạn thanh toán: ${detail}`);
    } finally {
      this.isSweeping = false;
    }

    return cancelledCount;
  }
}
