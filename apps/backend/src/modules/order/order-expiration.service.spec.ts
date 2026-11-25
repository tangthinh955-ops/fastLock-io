import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { DirectMessageService } from '../direct-message/direct-message.service';
import { PaymentService } from '../payment/payment.service';
import { OrderExpirationService } from './order-expiration.service';

describe('OrderExpirationService', () => {
  const createMocks = () => {
    const prisma = {
      order: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      product: {
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof prisma) => Promise<unknown>) => callback(prisma),
    );

    const paymentService = {
      syncOrderIfPaidOnPayos: jest.fn().mockResolvedValue(false),
      cancelPaymentLinkSafely: jest.fn().mockResolvedValue(undefined),
    };

    const directMessageService = {
      sendOrderExpiredMessage: jest.fn().mockResolvedValue({ id: 'msg-exp-1' }),
    };

    const service = new OrderExpirationService(
      prisma as unknown as PrismaService,
      paymentService as unknown as PaymentService,
      directMessageService as unknown as DirectMessageService,
    );

    return { service, prisma, paymentService, directMessageService };
  };

  it('cancels overdue unpaid order, restores stock atomically, cancels payOS link, and notifies Inbox', async () => {
    const { service, prisma, paymentService, directMessageService } =
      createMocks();
    const now = new Date('2026-11-25T15:30:00.000Z');
    prisma.order.findMany.mockResolvedValue([
      {
        id: 'ord-overdue-1',
        buyerId: 'buyer-1',
        totalAmount: 2000,
        status: OrderStatus.PENDING,
        payosOrderCode: '179561730812345',
        livestream: { sellerId: 'seller-1' },
        items: [
          {
            productId: 'prod-1',
            quantity: 2,
            product: { name: 'Quần short nhung', sku: 'QS01' },
          },
        ],
      },
    ]);
    prisma.order.updateMany.mockResolvedValue({ count: 1 });
    prisma.product.update.mockResolvedValue({});

    const cancelled = await service.expireOverdueOrders(now);

    expect(cancelled).toBe(1);
    expect(prisma.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'ord-overdue-1',
        status: OrderStatus.PENDING,
        expiresAt: { lte: now },
      },
      data: { status: OrderStatus.CANCELLED },
    });
    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: 'prod-1' },
      data: { stock: { increment: 2 } },
    });
    expect(paymentService.cancelPaymentLinkSafely).toHaveBeenCalledWith(
      'ord-overdue-1',
      'Đơn hàng hết hạn thanh toán',
    );
    expect(directMessageService.sendOrderExpiredMessage).toHaveBeenCalledWith(
      'seller-1',
      'buyer-1',
      'ord-overdue-1',
      'Quần short nhung',
      'QS01',
    );
  });

  it('skips cancellation and stock restore when payOS confirms order is already PAID', async () => {
    const { service, prisma, paymentService, directMessageService } =
      createMocks();
    prisma.order.findMany.mockResolvedValue([
      {
        id: 'ord-paid-last-second',
        buyerId: 'buyer-1',
        totalAmount: 2000,
        status: OrderStatus.PENDING,
        payosOrderCode: '179561730899999',
        livestream: { sellerId: 'seller-1' },
        items: [{ productId: 'prod-1', quantity: 1, product: { name: 'A', sku: 'S1' } }],
      },
    ]);
    paymentService.syncOrderIfPaidOnPayos.mockResolvedValue(true);

    const cancelled = await service.expireOverdueOrders();

    expect(cancelled).toBe(0);
    expect(prisma.order.updateMany).not.toHaveBeenCalled();
    expect(prisma.product.update).not.toHaveBeenCalled();
    expect(directMessageService.sendOrderExpiredMessage).not.toHaveBeenCalled();
  });

  it('does NOT double-restore stock if another process already claimed the order', async () => {
    const { service, prisma, directMessageService } = createMocks();
    prisma.order.findMany.mockResolvedValue([
      {
        id: 'ord-race-1',
        buyerId: 'buyer-1',
        totalAmount: 2000,
        status: OrderStatus.PENDING,
        payosOrderCode: null,
        livestream: { sellerId: 'seller-1' },
        items: [{ productId: 'prod-1', quantity: 1 }],
      },
    ]);
    prisma.order.updateMany.mockResolvedValue({ count: 0 });

    const cancelled = await service.expireOverdueOrders();

    expect(cancelled).toBe(0);
    expect(prisma.product.update).not.toHaveBeenCalled();
    expect(directMessageService.sendOrderExpiredMessage).not.toHaveBeenCalled();
  });
});
