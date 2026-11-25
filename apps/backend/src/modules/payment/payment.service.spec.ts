import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { DirectMessageService } from '../direct-message/direct-message.service';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  const createMocks = () => {
    const prisma = {
      order: {
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof prisma) => Promise<unknown>) => callback(prisma),
    );

    const configService = {
      get: jest.fn((key: string) => {
        const env: Record<string, string> = {
          PAYOS_CLIENT_ID: 'test-client-id',
          PAYOS_API_KEY: 'test-api-key',
          PAYOS_CHECKSUM_KEY: 'test-checksum-key',
          PAYOS_RETURN_URL: 'https://liveorder-six.vercel.app/inbox',
          PAYOS_CANCEL_URL: 'https://liveorder-six.vercel.app/inbox',
        };
        return env[key];
      }),
    };

    const directMessageService = {
      sendPaymentConfirmedMessage: jest.fn().mockResolvedValue({ id: 'msg-1' }),
    };

    const payos = {
      paymentRequests: {
        create: jest.fn(),
        get: jest.fn(),
        cancel: jest.fn(),
      },
      webhooks: {
        verify: jest.fn(),
      },
    };

    const service = new PaymentService(
      prisma as unknown as PrismaService,
      configService as unknown as ConfigService,
      directMessageService as unknown as DirectMessageService,
    );
    (service as unknown as { payosClient: unknown }).payosClient = payos;

    return { service, prisma, configService, directMessageService, payos };
  };

  it('creates a payOS payment link, saves metadata, and returns VietQR image URL', async () => {
    const { service, prisma, payos } = createMocks();
    payos.paymentRequests.create.mockResolvedValue({
      bin: '970422',
      accountNumber: '0912345678',
      accountName: 'SHOP LIVEORDER',
      amount: 200000,
      description: 'DH ORD-1234',
      orderCode: 179561730812345,
      currency: 'VND',
      paymentLinkId: 'plink-1',
      status: 'PENDING',
      checkoutUrl: 'https://pay.payos.vn/web/plink-1',
      qrCode: '000201010212...',
    });
    prisma.order.update.mockResolvedValue({});

    const summary = await service.createPaymentLinkForOrder({
      id: 'ord-1234-5678',
      totalAmount: 200000,
      recipientName: 'Nguyen Van A',
      shippingPhone: '0912345678',
      items: [{ quantity: 1, unitPrice: 200000, product: { name: 'Áo thun', sku: 'SP01' } }],
    });

    expect(payos.paymentRequests.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 200000,
        description: 'DH ORD-1234',
        returnUrl: 'https://liveorder-six.vercel.app/inbox?orderId=ord-1234-5678',
      }),
    );
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'ord-1234-5678' },
      data: {
        payosOrderCode: '179561730812345',
        paymentLinkId: 'plink-1',
        checkoutUrl: 'https://pay.payos.vn/web/plink-1',
        qrCode: '000201010212...',
      },
    });
    expect(summary?.checkoutUrl).toBe('https://pay.payos.vn/web/plink-1');
    expect(summary?.qrUrl).toContain('https://img.vietqr.io/image/970422-0912345678-compact.png');
  });

  it('rejects webhook with invalid payOS signature (400 BadRequest)', async () => {
    const { service, payos } = createMocks();
    payos.webhooks.verify.mockRejectedValue(new Error('Invalid signature'));

    await expect(
      service.handlePayosWebhook({
        code: '00',
        desc: 'success',
        success: true,
        data: { orderCode: 12345 },
        signature: 'forged',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns 200 IGNORED on payOS URL test ping when orderCode does not exist', async () => {
    const { service, prisma, payos } = createMocks();
    payos.webhooks.verify.mockResolvedValue({
      orderCode: 123,
      amount: 3000,
      description: 'Ma giao dich thu nghiem',
      reference: 'TF230204212323',
      code: '00',
    });
    prisma.order.findUnique.mockResolvedValue(null);

    const res = await service.handlePayosWebhook({
      code: '00',
      desc: 'success',
      success: true,
      data: { orderCode: 123 },
      signature: 'valid',
    });

    expect(res).toEqual({
      received: true,
      status: 'IGNORED',
      reason: 'order_not_found',
    });
  });

  it('atomically marks PENDING order PAID and sends SYSTEM Inbox notification on valid webhook', async () => {
    const { service, prisma, payos, directMessageService } = createMocks();
    payos.webhooks.verify.mockResolvedValue({
      orderCode: 179561730812345,
      amount: 200000,
      description: 'DH ORD-1234',
      reference: 'FT263290001',
      code: '00',
    });
    prisma.order.findUnique.mockResolvedValue({
      id: 'ord-1234',
      buyerId: 'buyer-1',
      totalAmount: 200000,
      status: OrderStatus.PENDING,
      payosOrderCode: '179561730812345',
      livestream: { sellerId: 'seller-1' },
      items: [{ product: { name: 'Áo thun', sku: 'SP01' } }],
    });
    prisma.order.updateMany.mockResolvedValue({ count: 1 });

    const res = await service.handlePayosWebhook({
      code: '00',
      desc: 'success',
      success: true,
      data: { orderCode: 179561730812345 },
      signature: 'valid',
    });

    expect(res).toEqual({ received: true, status: 'PAID', orderId: 'ord-1234' });
    expect(prisma.order.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ord-1234', status: OrderStatus.PENDING },
        data: expect.objectContaining({
          status: OrderStatus.PAID,
          paymentRef: 'FT263290001',
        }),
      }),
    );
    expect(directMessageService.sendPaymentConfirmedMessage).toHaveBeenCalledWith(
      'seller-1',
      'buyer-1',
      200000,
      'ord-1234',
      'FT263290001',
      'Áo thun',
      'SP01',
    );
  });

  it('does NOT mark PAID when transfer amount is less than order total (UNDERPAID)', async () => {
    const { service, prisma, payos, directMessageService } = createMocks();
    payos.webhooks.verify.mockResolvedValue({
      orderCode: 179561730812345,
      amount: 100000,
      description: 'DH ORD-1234',
      reference: 'FT263290002',
      code: '00',
    });
    prisma.order.findUnique.mockResolvedValue({
      id: 'ord-1234',
      buyerId: 'buyer-1',
      totalAmount: 200000,
      status: OrderStatus.PENDING,
      payosOrderCode: '179561730812345',
      livestream: { sellerId: 'seller-1' },
      items: [],
    });

    const res = await service.handlePayosWebhook({
      code: '00',
      desc: 'success',
      success: true,
      data: { orderCode: 179561730812345 },
      signature: 'valid',
    });

    expect(res).toEqual({ received: true, status: 'UNDERPAID', orderId: 'ord-1234' });
    expect(prisma.order.updateMany).not.toHaveBeenCalled();
    expect(directMessageService.sendPaymentConfirmedMessage).not.toHaveBeenCalled();
  });

  it('ignores duplicate webhook or CANCELLED order without duplicate notifications', async () => {
    const { service, prisma, payos, directMessageService } = createMocks();
    payos.webhooks.verify.mockResolvedValue({
      orderCode: 179561730812345,
      amount: 200000,
      description: 'DH ORD-1234',
      reference: 'FT263290001',
      code: '00',
    });
    prisma.order.findUnique.mockResolvedValue({
      id: 'ord-1234',
      buyerId: 'buyer-1',
      totalAmount: 200000,
      status: OrderStatus.CANCELLED,
      payosOrderCode: '179561730812345',
      livestream: { sellerId: 'seller-1' },
      items: [],
    });

    const res = await service.handlePayosWebhook({
      code: '00',
      desc: 'success',
      success: true,
      data: { orderCode: 179561730812345 },
      signature: 'valid',
    });

    expect(res).toEqual({
      received: true,
      status: 'SKIPPED_NON_PENDING',
      orderId: 'ord-1234',
    });
    expect(prisma.order.updateMany).not.toHaveBeenCalled();
    expect(directMessageService.sendPaymentConfirmedMessage).not.toHaveBeenCalled();
  });

  it('reconciles a PAID order via payOS API and enforces buyer ownership', async () => {
    const { service, prisma, payos, directMessageService } = createMocks();
    prisma.order.findUnique.mockResolvedValue({
      id: 'ord-1234',
      buyerId: 'buyer-1',
      totalAmount: 200000,
      status: OrderStatus.PENDING,
      payosOrderCode: '179561730812345',
      livestream: { sellerId: 'seller-1' },
      items: [{ product: { name: 'Áo thun', sku: 'SP01' } }],
    });

    await expect(
      service.reconcileOrderPayment('ord-1234', { userId: 'buyer-2', role: 'BUYER' }),
    ).rejects.toThrow(ForbiddenException);

    payos.paymentRequests.get.mockResolvedValue({
      id: 'plink-1',
      orderCode: 179561730812345,
      amount: 200000,
      amountPaid: 200000,
      amountRemaining: 0,
      status: 'PAID',
      transactions: [{ reference: 'FT-SYNC-1' }],
    });
    prisma.order.updateMany.mockResolvedValue({ count: 1 });

    const synced = await service.reconcileOrderPayment('ord-1234', {
      userId: 'buyer-1',
      role: 'BUYER',
    });

    expect(synced).toEqual({
      orderId: 'ord-1234',
      status: OrderStatus.PAID,
      payosStatus: 'PAID',
      synced: true,
    });
    expect(directMessageService.sendPaymentConfirmedMessage).toHaveBeenCalledTimes(1);
  });
});
