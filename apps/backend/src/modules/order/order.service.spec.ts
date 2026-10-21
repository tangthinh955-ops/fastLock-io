import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { OrderService } from './order.service';
import { PrismaService } from '../../core/prisma/prisma.service';

describe('OrderService (S08 Lifecycle & Atomic Stock)', () => {
    let service: OrderService;

    const mockPrisma = {
        order: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        product: {
            findUnique: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
        },
        $transaction: jest.fn(),
    };

    beforeEach(() => {
        jest.resetAllMocks();
        mockPrisma.$transaction.mockImplementation(
            async (callback: (tx: typeof mockPrisma) => Promise<unknown>) => callback(mockPrisma),
        );
        service = new OrderService(mockPrisma as unknown as PrismaService);
    });

    describe('createOrder', () => {
        it('nên ném lỗi BadRequestException nếu thiếu buyerId', async () => {
            await expect(
                service.createOrder({
                    buyerId: '',
                    livestreamId: 'live-1',
                    items: [{ productId: 'prod-1', quantity: 1 }],
                }),
            ).rejects.toThrow(BadRequestException);
        });

        it('nên trừ kho thành công và tạo đơn hàng PENDING', async () => {
            mockPrisma.product.updateMany.mockResolvedValue({ count: 1 });
            mockPrisma.product.findUnique.mockResolvedValue({ id: 'prod-1', price: 150000, stock: 10 });
            mockPrisma.order.create.mockResolvedValue({
                id: 'order-1',
                buyerId: 'buyer-1',
                totalAmount: 150000,
                status: 'PENDING',
            });

            const result = await service.createOrder({
                buyerId: 'buyer-1',
                livestreamId: 'live-1',
                items: [{ productId: 'prod-1', quantity: 1 }],
            });

            expect(result.id).toBe('order-1');
            expect(mockPrisma.product.updateMany).toHaveBeenCalledWith({
                where: { id: 'prod-1', stock: { gte: 1 } },
                data: { stock: { decrement: 1 } },
            });
        });
    });

    describe('getOrdersForSeller', () => {
        it('nên lấy danh sách đơn của shop kèm phân trang', async () => {
            mockPrisma.order.findMany.mockResolvedValue([
                { id: 'order-1', totalAmount: 200000, status: 'PENDING' },
            ]);
            mockPrisma.order.count.mockResolvedValue(1);

            const result = await service.getOrdersForSeller('seller-uuid-001', {
                status: OrderStatus.PENDING,
                page: 1,
                limit: 10,
            });

            expect(result.data).toHaveLength(1);
            expect(result.total).toBe(1);
            expect(result.totalPages).toBe(1);
            expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        livestream: { sellerId: 'seller-uuid-001' },
                        status: 'PENDING',
                    },
                }),
            );
        });
    });

    describe('updateOrderStatus', () => {
        it('nên chặn người bán của shop khác can thiệp đơn', async () => {
            mockPrisma.order.findUnique.mockResolvedValue({
                id: 'order-1',
                status: 'PENDING',
                items: [],
                livestream: { sellerId: 'seller-A' },
            });

            await expect(
                service.updateOrderStatus('order-1', 'seller-B', OrderStatus.PAID),
            ).rejects.toThrow(ForbiddenException);
        });

        it('nên cập nhật đơn sang PAID thành công', async () => {
            mockPrisma.order.findUnique.mockResolvedValue({
                id: 'order-1',
                status: 'PENDING',
                items: [{ productId: 'prod-1', quantity: 2 }],
                livestream: { sellerId: 'seller-A' },
            });
            mockPrisma.order.update.mockResolvedValue({
                id: 'order-1',
                status: 'PAID',
            });

            const result = await service.updateOrderStatus('order-1', 'seller-A', OrderStatus.PAID);
            expect(result.status).toBe('PAID');
            expect(mockPrisma.product.update).not.toHaveBeenCalled();
        });

        it('nên hoàn kho Atomic khi đơn hàng chuyển sang CANCELLED', async () => {
            mockPrisma.order.findUnique.mockResolvedValue({
                id: 'order-1',
                status: 'PENDING',
                items: [{ productId: 'prod-1', quantity: 2 }],
                livestream: { sellerId: 'seller-A' },
            });
            mockPrisma.product.update.mockResolvedValue({ id: 'prod-1', stock: 12 });
            mockPrisma.order.update.mockResolvedValue({
                id: 'order-1',
                status: 'CANCELLED',
            });

            const result = await service.updateOrderStatus('order-1', 'seller-A', OrderStatus.CANCELLED);
            expect(result.status).toBe('CANCELLED');

            // Kiểm tra lệnh hoàn kho nguyên tử
            expect(mockPrisma.product.update).toHaveBeenCalledWith({
                where: { id: 'prod-1' },
                data: { stock: { increment: 2 } },
            });
        });

        it('nên chặn chuyển ngược từ PAID về PENDING', async () => {
            mockPrisma.order.findUnique.mockResolvedValue({
                id: 'order-1',
                status: 'PAID',
                items: [],
                livestream: { sellerId: 'seller-A' },
            });

            await expect(
                service.updateOrderStatus('order-1', 'seller-A', OrderStatus.PENDING),
            ).rejects.toThrow(BadRequestException);
        });

        it('nên chặn cập nhật khi đơn đã bị hủy (CANCELLED)', async () => {
            mockPrisma.order.findUnique.mockResolvedValue({
                id: 'order-1',
                status: 'CANCELLED',
                items: [],
                livestream: { sellerId: 'seller-A' },
            });

            await expect(
                service.updateOrderStatus('order-1', 'seller-A', OrderStatus.PAID),
            ).rejects.toThrow(BadRequestException);
        });
    });
});
