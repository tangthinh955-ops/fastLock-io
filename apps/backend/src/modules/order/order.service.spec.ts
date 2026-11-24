import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { LiveStatus, OrderStatus } from '@prisma/client';
import { OrderService } from './order.service';
import { PrismaService } from '../../core/prisma/prisma.service';

describe('OrderService (S08 Lifecycle & Atomic Stock)', () => {
    let service: OrderService;

    const mockPrisma = {
        livestream: {
            findUnique: jest.fn(),
        },
        order: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
        },
        product: {
            findUnique: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
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

        it('nên ném lỗi BadRequestException nếu livestream không tồn tại hoặc đã kết thúc', async () => {
            mockPrisma.livestream.findUnique.mockResolvedValue({
                id: 'live-1',
                sellerId: 'seller-1',
                status: LiveStatus.ENDED,
            });

            await expect(
                service.createOrder({
                    buyerId: 'buyer-1',
                    livestreamId: 'live-1',
                    items: [{ productId: 'prod-1', quantity: 1 }],
                }),
            ).rejects.toThrow(BadRequestException);
            expect(mockPrisma.product.updateMany).not.toHaveBeenCalled();
            expect(mockPrisma.order.create).not.toHaveBeenCalled();
        });

        it('nên trừ kho thành công và tạo đơn hàng PENDING', async () => {
            mockPrisma.livestream.findUnique.mockResolvedValue({
                id: 'live-1',
                sellerId: 'seller-1',
                status: LiveStatus.LIVE,
            });
            mockPrisma.product.updateMany.mockResolvedValue({ count: 1 });
            mockPrisma.product.findUnique.mockResolvedValue({
                id: 'prod-1',
                sellerId: 'seller-1',
                price: 150000,
                stock: 10,
            });
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
                where: { id: 'prod-1', sellerId: 'seller-1', stock: { gte: 1 } },
                data: { stock: { decrement: 1 } },
            });
        });

        it('nên gộp các dòng trùng productId trước khi trừ kho', async () => {
            mockPrisma.livestream.findUnique.mockResolvedValue({
                id: 'live-1',
                sellerId: 'seller-1',
                status: LiveStatus.LIVE,
            });
            mockPrisma.product.updateMany.mockResolvedValue({ count: 1 });
            mockPrisma.product.findUnique.mockResolvedValue({
                id: 'prod-1',
                sellerId: 'seller-1',
                price: 150000,
                stock: 10,
            });
            mockPrisma.order.create.mockResolvedValue({
                id: 'order-1',
                buyerId: 'buyer-1',
                totalAmount: 450000,
                status: 'PENDING',
            });

            await service.createOrder({
                buyerId: 'buyer-1',
                livestreamId: 'live-1',
                items: [
                    { productId: 'prod-1', quantity: 1 },
                    { productId: 'prod-1', quantity: 2 },
                ],
            });

            expect(mockPrisma.product.updateMany).toHaveBeenCalledTimes(1);
            expect(mockPrisma.product.updateMany).toHaveBeenCalledWith({
                where: { id: 'prod-1', sellerId: 'seller-1', stock: { gte: 3 } },
                data: { stock: { decrement: 3 } },
            });
            expect(mockPrisma.order.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        totalAmount: 450000,
                        items: {
                            create: [{ productId: 'prod-1', quantity: 3, unitPrice: 150000 }],
                        },
                    }),
                }),
            );
        });

        it('nên từ chối sản phẩm thuộc shop khác phiên livestream', async () => {
            mockPrisma.livestream.findUnique.mockResolvedValue({
                id: 'live-1',
                sellerId: 'seller-1',
                status: LiveStatus.LIVE,
            });
            mockPrisma.product.updateMany.mockResolvedValue({ count: 0 });
            mockPrisma.product.findUnique.mockResolvedValue({
                id: 'prod-other',
                name: 'Áo Shop Khác',
                sku: 'SP99',
                sellerId: 'seller-2',
                price: 200000,
                stock: 10,
            });

            await expect(
                service.createOrder({
                    buyerId: 'buyer-1',
                    livestreamId: 'live-1',
                    items: [{ productId: 'prod-other', quantity: 1 }],
                }),
            ).rejects.toThrow(BadRequestException);
            expect(mockPrisma.order.create).not.toHaveBeenCalled();
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
            mockPrisma.order.findUnique
                .mockResolvedValueOnce({
                    id: 'order-1',
                    status: 'PENDING',
                    items: [{ productId: 'prod-1', quantity: 2 }],
                    livestream: { sellerId: 'seller-A' },
                })
                .mockResolvedValueOnce({
                    id: 'order-1',
                    status: 'PAID',
                });
            mockPrisma.order.updateMany.mockResolvedValue({ count: 1 });

            const result = await service.updateOrderStatus('order-1', 'seller-A', OrderStatus.PAID);
            expect(result.status).toBe('PAID');
            expect(mockPrisma.order.updateMany).toHaveBeenCalledWith({
                where: { id: 'order-1', status: { in: [OrderStatus.PENDING] } },
                data: { status: OrderStatus.PAID },
            });
            expect(mockPrisma.product.update).not.toHaveBeenCalled();
        });

        it('nên hoàn kho Atomic khi đơn hàng chuyển sang CANCELLED sau khi claim thành công', async () => {
            mockPrisma.order.findUnique
                .mockResolvedValueOnce({
                    id: 'order-1',
                    status: 'PENDING',
                    items: [{ productId: 'prod-1', quantity: 2 }],
                    livestream: { sellerId: 'seller-A' },
                })
                .mockResolvedValueOnce({
                    id: 'order-1',
                    status: 'CANCELLED',
                });
            mockPrisma.order.updateMany.mockResolvedValue({ count: 1 });
            mockPrisma.product.update.mockResolvedValue({ id: 'prod-1', stock: 12 });

            const result = await service.updateOrderStatus('order-1', 'seller-A', OrderStatus.CANCELLED);
            expect(result.status).toBe('CANCELLED');
            expect(mockPrisma.order.updateMany).toHaveBeenCalledWith({
                where: { id: 'order-1', status: { in: [OrderStatus.PENDING, OrderStatus.PAID] } },
                data: { status: OrderStatus.CANCELLED },
            });
            expect(mockPrisma.order.updateMany.mock.invocationCallOrder[0]).toBeLessThan(
                mockPrisma.product.update.mock.invocationCallOrder[0],
            );

            // Kiểm tra lệnh hoàn kho nguyên tử
            expect(mockPrisma.product.update).toHaveBeenCalledWith({
                where: { id: 'prod-1' },
                data: { stock: { increment: 2 } },
            });
        });

        it('nên chống hoàn kho 2 lần khi có race condition hủy đơn đồng thời', async () => {
            mockPrisma.order.findUnique.mockResolvedValueOnce({
                id: 'order-1',
                status: 'PENDING',
                items: [{ productId: 'prod-1', quantity: 2 }],
                livestream: { sellerId: 'seller-A' },
            });
            // Mô phỏng request thứ 2 không claim được do request thứ 1 đã đổi trạng thái
            mockPrisma.order.updateMany.mockResolvedValue({ count: 0 });

            await expect(
                service.updateOrderStatus('order-1', 'seller-A', OrderStatus.CANCELLED),
            ).rejects.toThrow(BadRequestException);
            expect(mockPrisma.product.update).not.toHaveBeenCalled();
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

    describe('confirmOrder', () => {
        it('nên ném lỗi BadRequestException nếu thiếu buyerId', async () => {
            await expect(
                service.confirmOrder('', {
                    livestreamId: 'live-1',
                    productId: 'prod-1',
                    recipientName: 'Nguyen Van A',
                    shippingPhone: '0912345678',
                    shippingAddress: '123 Đường ABC, Q1, TP.HCM',
                }),
            ).rejects.toThrow(BadRequestException);
        });

        it('nên ném lỗi BadRequestException nếu livestream không còn LIVE', async () => {
            mockPrisma.livestream.findUnique.mockResolvedValue({
                id: 'live-1',
                sellerId: 'seller-1',
                status: LiveStatus.ENDED,
            });

            await expect(
                service.confirmOrder('buyer-1', {
                    livestreamId: 'live-1',
                    productId: 'prod-1',
                    quantity: 1,
                    recipientName: 'Nguyen Van A',
                    shippingPhone: '0912345678',
                    shippingAddress: '123 Đường ABC, Q1, TP.HCM',
                }),
            ).rejects.toThrow(BadRequestException);
            expect(mockPrisma.product.updateMany).not.toHaveBeenCalled();
            expect(mockPrisma.order.create).not.toHaveBeenCalled();
        });

        it('nên trừ kho nguyên tử thành công, tạo đơn có thông tin giao hàng và lưu vào user', async () => {
            mockPrisma.livestream.findUnique.mockResolvedValue({
                id: 'live-1',
                sellerId: 'seller-1',
                status: LiveStatus.LIVE,
            });
            mockPrisma.product.updateMany.mockResolvedValue({ count: 1 });
            mockPrisma.product.findUnique.mockResolvedValue({
                id: 'prod-1',
                sellerId: 'seller-1',
                name: 'Áo Khoác',
                sku: 'AK01',
                price: 200000,
                stock: 5,
            });
            mockPrisma.order.create.mockResolvedValue({
                id: 'order-confirm-1',
                buyerId: 'buyer-1',
                totalAmount: 200000,
                status: 'PENDING',
                recipientName: 'Nguyen Van A',
                shippingPhone: '0912345678',
                shippingAddress: '123 Đường ABC, Q1, TP.HCM',
            });
            mockPrisma.user.update.mockResolvedValue({});

            const result = await service.confirmOrder('buyer-1', {
                livestreamId: 'live-1',
                productId: 'prod-1',
                quantity: 1,
                recipientName: 'Nguyen Van A',
                shippingPhone: '0912345678',
                shippingAddress: '123 Đường ABC, Q1, TP.HCM',
                saveAsDefault: true,
            });

            expect(result.id).toBe('order-confirm-1');
            expect(mockPrisma.product.updateMany).toHaveBeenCalledWith({
                where: { id: 'prod-1', sellerId: 'seller-1', stock: { gte: 1 } },
                data: { stock: { decrement: 1 } },
            });
            expect(mockPrisma.user.update).toHaveBeenCalledWith({
                where: { id: 'buyer-1' },
                data: {
                    defaultRecipientName: 'Nguyen Van A',
                    defaultPhone: '0912345678',
                    defaultAddress: '123 Đường ABC, Q1, TP.HCM',
                },
            });
        });

        it('nên từ chối xác nhận đơn cho sản phẩm thuộc shop khác phiên livestream', async () => {
            mockPrisma.livestream.findUnique.mockResolvedValue({
                id: 'live-1',
                sellerId: 'seller-1',
                status: LiveStatus.LIVE,
            });
            mockPrisma.product.updateMany.mockResolvedValue({ count: 0 });
            mockPrisma.product.findUnique.mockResolvedValue({
                id: 'prod-other',
                sellerId: 'seller-2',
                name: 'Áo Shop Khác',
                sku: 'SP99',
                price: 200000,
                stock: 5,
            });

            await expect(
                service.confirmOrder('buyer-1', {
                    livestreamId: 'live-1',
                    productId: 'prod-other',
                    quantity: 1,
                    recipientName: 'Nguyen Van A',
                    shippingPhone: '0912345678',
                    shippingAddress: '123 Đường ABC, Q1, TP.HCM',
                }),
            ).rejects.toThrow('không thuộc shop của phiên livestream này');
            expect(mockPrisma.order.create).not.toHaveBeenCalled();
        });

        it('nên ném lỗi BadRequestException nếu sản phẩm vừa hết hàng (count === 0)', async () => {
            mockPrisma.livestream.findUnique.mockResolvedValue({
                id: 'live-1',
                sellerId: 'seller-1',
                status: LiveStatus.LIVE,
            });
            mockPrisma.product.updateMany.mockResolvedValue({ count: 0 });
            mockPrisma.product.findUnique.mockResolvedValue({
                id: 'prod-1',
                sellerId: 'seller-1',
                name: 'Áo Khoác',
                sku: 'AK01',
                price: 200000,
                stock: 0,
            });

            await expect(
                service.confirmOrder('buyer-1', {
                    livestreamId: 'live-1',
                    productId: 'prod-1',
                    quantity: 1,
                    recipientName: 'Nguyen Van A',
                    shippingPhone: '0912345678',
                    shippingAddress: '123 Đường ABC, Q1, TP.HCM',
                }),
            ).rejects.toThrow('vừa hết hàng');
        });
    });

    describe('getShippingProfile', () => {
        it('nên trả về thông tin giao hàng mặc định đã lưu của buyer', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'buyer-1',
                name: 'Buyer Default',
                defaultRecipientName: 'Nguyen Van A',
                defaultPhone: '0912345678',
                defaultAddress: '123 Đường ABC, Q1, TP.HCM',
            });

            const profile = await service.getShippingProfile('buyer-1');
            expect(profile).toEqual({
                recipientName: 'Nguyen Van A',
                phone: '0912345678',
                address: '123 Đường ABC, Q1, TP.HCM',
            });
        });
    });
});
