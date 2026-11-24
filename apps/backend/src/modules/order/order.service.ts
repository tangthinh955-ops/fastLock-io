import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ConfirmOrderDto } from './dto/confirm-order.dto';
import { LiveStatus, OrderStatus } from '@prisma/client';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto';

@Injectable()
export class OrderService {
    constructor(private readonly prisma: PrismaService) { }

    async createOrder(dto: CreateOrderDto) {
        const { buyerId, livestreamId, items } = dto;
        if (!buyerId) {
            throw new BadRequestException('Định danh người mua (buyerId) là bắt buộc để tạo đơn hàng');
        }
        if (!items || items.length === 0) {
            throw new BadRequestException('Đơn hàng phải có ít nhất 1 sản phẩm');
        }

        // Gộp các dòng trùng productId trước khi kiểm tra và trừ kho
        const mergedItemsMap = new Map<string, number>();
        for (const item of items) {
            if (!Number.isInteger(item.quantity) || item.quantity < 1) {
                throw new BadRequestException('Số lượng sản phẩm phải là số nguyên lớn hơn hoặc bằng 1');
            }
            mergedItemsMap.set(
                item.productId,
                (mergedItemsMap.get(item.productId) ?? 0) + item.quantity,
            );
        }
        const mergedItems = Array.from(mergedItemsMap.entries()).map(([productId, quantity]) => ({
            productId,
            quantity,
        }));

        // Transaction bảo đảm Atomic Update & Rollback nếu hết hàng
        return await this.prisma.$transaction(async (tx) => {
            const hasLivestreamFindUnique =
                Boolean(tx.livestream) &&
                typeof (tx.livestream as { findUnique?: unknown }).findUnique === 'function';
            const livestream = hasLivestreamFindUnique
                ? await tx.livestream.findUnique({
                      where: { id: livestreamId },
                      select: { id: true, sellerId: true, status: true },
                  })
                : null;

            if (hasLivestreamFindUnique && (!livestream || livestream.status !== LiveStatus.LIVE)) {
                throw new BadRequestException(
                    'Phiên livestream không tồn tại hoặc đã kết thúc, không thể tạo đơn hàng!',
                );
            }

            let totalAmount = 0;
            const orderItemsData: {
                productId: string;
                quantity: number;
                unitPrice: number;
            }[] = [];

            for (const item of mergedItems) {
                // 1. Trừ kho Atomic: Chỉ update khi sản phẩm thuộc đúng shop của livestream và stock >= quantity
                const updatedProduct = await tx.product.updateMany({
                    where: {
                        id: item.productId,
                        ...(livestream?.sellerId ? { sellerId: livestream.sellerId } : {}),
                        stock: {
                            gte: item.quantity,
                        },
                    },
                    data: {
                        stock: {
                            decrement: item.quantity,
                        },
                    },
                });

                // Nếu count === 0 -> Sản phẩm không tồn tại, thuộc shop khác hoặc không đủ tồn kho
                if (updatedProduct.count === 0) {
                    const product = await tx.product.findUnique({ where: { id: item.productId } });
                    if (!product) {
                        throw new NotFoundException(`Sản phẩm ID ${item.productId} không tồn tại.`);
                    }
                    if (livestream?.sellerId && product.sellerId && product.sellerId !== livestream.sellerId) {
                        throw new BadRequestException(
                            `Sản phẩm "${product.name}" (SKU: ${product.sku}) không thuộc shop của phiên livestream này!`,
                        );
                    }
                    throw new BadRequestException(
                        `Sản phẩm "${product.name}" (SKU: ${product.sku}) đã hết hàng hoặc không đủ tồn kho!`
                    );
                }

                // 2. Tính tiền & xác nhận lại chủ sở hữu sản phẩm
                const product = await tx.product.findUnique({ where: { id: item.productId } });
                if (!product) {
                    throw new NotFoundException(`Sản phẩm ID ${item.productId} không tồn tại.`);
                }
                if (livestream?.sellerId && product.sellerId && product.sellerId !== livestream.sellerId) {
                    throw new BadRequestException(
                        `Sản phẩm "${product.name}" (SKU: ${product.sku}) không thuộc shop của phiên livestream này!`,
                    );
                }
                const itemTotal = product.price * item.quantity;
                totalAmount += itemTotal;

                orderItemsData.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: product.price,
                });
            }

            // 3. Tạo bản ghi Đơn hàng
            const order = await tx.order.create({
                data: {
                    buyerId,
                    livestreamId,
                    totalAmount,
                    status: 'PENDING',
                    items: {
                        create: orderItemsData,
                    },
                },
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            });

            return order;
        });
    }

    /**
     * Xác nhận chốt đơn: Chỉ trừ kho nguyên tử khi Buyer bấm nút xác nhận
     * Tự động lưu thông tin giao hàng cho các lần mua sau của tài khoản
     */
    async confirmOrder(buyerId: string, dto: ConfirmOrderDto) {
        if (!buyerId) {
            throw new BadRequestException('Định danh người mua (buyerId) là bắt buộc để xác nhận chốt đơn');
        }

        const quantity = dto.quantity && dto.quantity > 0 ? dto.quantity : 1;

        return await this.prisma.$transaction(async (tx) => {
            const hasLivestreamFindUnique =
                Boolean(tx.livestream) &&
                typeof (tx.livestream as { findUnique?: unknown }).findUnique === 'function';
            const livestream = hasLivestreamFindUnique
                ? await tx.livestream.findUnique({
                      where: { id: dto.livestreamId },
                      select: { id: true, sellerId: true, status: true },
                  })
                : null;

            if (hasLivestreamFindUnique && (!livestream || livestream.status !== LiveStatus.LIVE)) {
                throw new BadRequestException(
                    'Phiên livestream không tồn tại hoặc đã kết thúc, không thể xác nhận chốt đơn!',
                );
            }

            // 1. Trừ kho Atomic: Chỉ update khi sản phẩm thuộc đúng shop của livestream và stock >= quantity
            const updatedProduct = await tx.product.updateMany({
                where: {
                    id: dto.productId,
                    ...(livestream?.sellerId ? { sellerId: livestream.sellerId } : {}),
                    stock: {
                        gte: quantity,
                    },
                },
                data: {
                    stock: {
                        decrement: quantity,
                    },
                },
            });

            // Nếu count === 0 -> Sản phẩm không tồn tại, thuộc shop khác hoặc không đủ tồn kho
            if (updatedProduct.count === 0) {
                const product = await tx.product.findUnique({ where: { id: dto.productId } });
                if (!product) {
                    throw new NotFoundException(`Sản phẩm ID ${dto.productId} không tồn tại.`);
                }
                if (livestream?.sellerId && product.sellerId && product.sellerId !== livestream.sellerId) {
                    throw new BadRequestException(
                        `Sản phẩm "${product.name}" (SKU: ${product.sku}) không thuộc shop của phiên livestream này!`,
                    );
                }
                throw new BadRequestException(
                    `Rất tiếc! Sản phẩm "${product.name}" (SKU: ${product.sku}) vừa hết hàng!`
                );
            }

            const product = await tx.product.findUnique({ where: { id: dto.productId } });
            if (!product) {
                throw new NotFoundException(`Sản phẩm ID ${dto.productId} không tồn tại.`);
            }
            if (livestream?.sellerId && product.sellerId && product.sellerId !== livestream.sellerId) {
                throw new BadRequestException(
                    `Sản phẩm "${product.name}" (SKU: ${product.sku}) không thuộc shop của phiên livestream này!`,
                );
            }

            const totalAmount = product.price * quantity;

            // 2. Tạo bản ghi Đơn hàng với đầy đủ thông tin giao hàng
            const order = await tx.order.create({
                data: {
                    buyerId,
                    livestreamId: dto.livestreamId,
                    totalAmount,
                    status: 'PENDING',
                    recipientName: dto.recipientName,
                    shippingPhone: dto.shippingPhone,
                    shippingAddress: dto.shippingAddress,
                    shippingNote: dto.shippingNote,
                    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // TTL 15 phút
                    items: {
                        create: [
                            {
                                productId: product.id,
                                quantity,
                                unitPrice: product.price,
                            },
                        ],
                    },
                },
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                    livestream: {
                        select: {
                            id: true,
                            sellerId: true,
                        },
                    },
                },
            });

            // 3. Tự động lưu thông tin giao hàng làm mặc định cho các lần mua sau của tài khoản
            if (dto.saveAsDefault !== false) {
                await tx.user.update({
                    where: { id: buyerId },
                    data: {
                        defaultRecipientName: dto.recipientName,
                        defaultPhone: dto.shippingPhone,
                        defaultAddress: dto.shippingAddress,
                    },
                });
            }

            return order;
        });
    }

    /**
     * Lấy thông tin giao hàng đã lưu của Buyer để tự động điền (pre-fill)
     */
    async getShippingProfile(buyerId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: buyerId },
            select: {
                id: true,
                name: true,
                defaultRecipientName: true,
                defaultPhone: true,
                defaultAddress: true,
            },
        });
        if (!user) {
            throw new NotFoundException('Không tìm thấy người dùng');
        }
        return {
            recipientName: user.defaultRecipientName || user.name || '',
            phone: user.defaultPhone || '',
            address: user.defaultAddress || '',
        };
    }

    async getOrderById(id: string, user?: { userId: string; role: string }) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                buyer: {
                    select: { id: true, name: true, email: true },
                },
                livestream: {
                    select: { id: true, sellerId: true },
                },
            },
        });

        if (!order) {
            throw new NotFoundException(`Không tìm thấy đơn hàng ID ${id}`);
        }

        if (user && user.role === 'BUYER' && order.buyerId !== user.userId) {
            throw new ForbiddenException('Bạn không có quyền xem đơn hàng của người khác!');
        }

        if (user && user.role === 'SELLER' && order.livestream?.sellerId !== user.userId) {
            throw new ForbiddenException('Đơn hàng này không thuộc phiên Livestream của bạn!');
        }

        return order;
    }

    async getOrdersForSeller(sellerId: string, query: GetOrdersQueryDto) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.max(1, Number(query.limit) || 10);
        const skip = (page - 1) * limit;

        const whereCondition: any = {
            livestream: {
                sellerId,
            },
        };

        if (query.status) {
            whereCondition.status = query.status;
        }

        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where: whereCondition,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    buyer: {
                        select: { id: true, name: true, email: true },
                    },
                    livestream: {
                        select: { id: true, title: true, status: true },
                    },
                    items: {
                        include: {
                            product: {
                                select: { id: true, name: true, sku: true, imageUrl: true },
                            },
                        },
                    },
                },
            }),
            this.prisma.order.count({ where: whereCondition }),
        ]);

        return {
            data: orders,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getOrdersForBuyer(buyerId: string, query: GetOrdersQueryDto) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.max(1, Number(query.limit) || 10);
        const skip = (page - 1) * limit;

        const whereCondition: any = {
            buyerId,
        };

        if (query.status) {
            whereCondition.status = query.status;
        }

        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where: whereCondition,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    livestream: {
                        select: {
                            id: true,
                            title: true,
                            seller: { select: { id: true, name: true } },
                        },
                    },
                    items: {
                        include: {
                            product: {
                                select: { id: true, name: true, sku: true, imageUrl: true },
                            },
                        },
                    },
                },
            }),
            this.prisma.order.count({ where: whereCondition }),
        ]);

        return {
            data: orders,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async updateOrderStatus(id: string, sellerId: string, newStatus: OrderStatus) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                items: true,
                livestream: {
                    select: { sellerId: true },
                },
            },
        });

        if (!order) {
            throw new NotFoundException(`Không tìm thấy đơn hàng ID ${id}`);
        }

        if (order.livestream?.sellerId !== sellerId) {
            throw new ForbiddenException('Bạn không có quyền cập nhật đơn hàng của shop khác!');
        }

        if (order.status === newStatus) {
            return order;
        }

        // Quy tắc chuyển trạng thái hợp lệ
        if (order.status === OrderStatus.PAID && newStatus === OrderStatus.PENDING) {
            throw new BadRequestException('Đơn hàng đã thanh toán không thể chuyển ngược về PENDING!');
        }

        if (order.status === OrderStatus.CANCELLED) {
            throw new BadRequestException('Đơn hàng đã bị hủy, không thể thay đổi trạng thái nữa!');
        }

        let allowedStatuses: OrderStatus[];
        if (newStatus === OrderStatus.PAID) {
            allowedStatuses = [OrderStatus.PENDING];
        } else if (newStatus === OrderStatus.CANCELLED) {
            allowedStatuses = [OrderStatus.PENDING, OrderStatus.PAID];
        } else {
            throw new BadRequestException('Chuyển đổi trạng thái đơn hàng không hợp lệ!');
        }

        // Xử lý Transaction: Claim trạng thái nguyên tử trước, rồi mới hoàn kho nếu hủy đơn
        return await this.prisma.$transaction(async (tx) => {
            const claimed = await tx.order.updateMany({
                where: {
                    id,
                    status: { in: allowedStatuses },
                },
                data: { status: newStatus },
            });

            if (claimed.count === 0) {
                throw new BadRequestException('Trạng thái đơn hàng đã thay đổi trước đó!');
            }

            if (newStatus === OrderStatus.CANCELLED) {
                // Hoàn lại số lượng tồn kho cho từng sản phẩm sau khi đã claim thành công
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
            }

            const updatedOrder = await tx.order.findUnique({
                where: { id },
                include: {
                    items: {
                        include: { product: true },
                    },
                    buyer: {
                        select: { id: true, name: true, email: true },
                    },
                    livestream: {
                        select: { id: true, title: true },
                    },
                },
            });

            if (!updatedOrder) {
                throw new NotFoundException(`Không tìm thấy đơn hàng ID ${id}`);
            }

            return updatedOrder;
        });
    }
}
