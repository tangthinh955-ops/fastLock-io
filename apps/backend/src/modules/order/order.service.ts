import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrderService {
    constructor(private readonly prisma: PrismaService) { }

    async createOrder(dto: CreateOrderDto) {
        const { buyerId, livestreamId, items } = dto;

        // Transaction bảo đảm Atomic Update & Rollback nếu hết hàng
        return await this.prisma.$transaction(async (tx) => {
            let totalAmount = 0;
            const orderItemsData: {
                productId: string;
                quantity: number;
                unitPrice: number;
            }[] = [];

            for (const item of items) {
                // 1. Trừ kho Atomic: Chỉ update khi stock >= quantity
                const updatedProduct = await tx.product.updateMany({
                    where: {
                        id: item.productId,
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

                // Nếu count === 0 -> Sản phẩm không đủ số lượng tồn kho (Chống Oversell)
                if (updatedProduct.count === 0) {
                    const product = await tx.product.findUnique({ where: { id: item.productId } });
                    if (!product) {
                        throw new NotFoundException(`Sản phẩm ID ${item.productId} không tồn tại.`);
                    }
                    throw new BadRequestException(
                        `Sản phẩm "${product.name}" (SKU: ${product.sku}) đã hết hàng hoặc không đủ tồn kho!`
                    );
                }

                // 2. Tính tiền
                const product = await tx.product.findUnique({ where: { id: item.productId } });
                if (!product) {
                    throw new NotFoundException(`Sản phẩm ID ${item.productId} không tồn tại.`);
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

    async getOrderById(id: string) {
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
            },
        });

        if (!order) {
            throw new NotFoundException(`Không tìm thấy đơn hàng ID ${id}`);
        }

        return order;
    }
}
