import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards, Inject, forwardRef, Logger } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ConfirmOrderDto } from './dto/confirm-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrderStatus, Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DirectMessageService } from '../direct-message/direct-message.service';
import { LivestreamGateway } from '../livestream/livestream.gateway';
import { PaymentService, type PayosPaymentSummary } from '../payment/payment.service';

@Controller('orders')
export class OrderController {
    private readonly logger = new Logger(OrderController.name);

    constructor(
        private readonly orderService: OrderService,
        private readonly directMessageService: DirectMessageService,
        private readonly paymentService: PaymentService,
        @Inject(forwardRef(() => LivestreamGateway))
        private readonly livestreamGateway: LivestreamGateway,
    ) { }

    @Get('shipping-profile')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.BUYER)
    async getShippingProfile(@CurrentUser('userId') buyerId: string) {
        return this.orderService.getShippingProfile(buyerId);
    }

    @Post('confirm')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.BUYER)
    async confirm(
        @CurrentUser('userId') buyerId: string,
        @Body() confirmOrderDto: ConfirmOrderDto,
    ) {
        const order = await this.orderService.confirmOrder(buyerId, confirmOrderDto);
        const firstItem = order.items[0];
        const product = firstItem?.product;

        const rawPhone = confirmOrderDto.shippingPhone || '';
        const maskedPhone = rawPhone.length >= 7
            ? `${rawPhone.slice(0, 4)}***${rawPhone.slice(-3)}`
            : rawPhone;

        // Tạo link thanh toán payOS thật (bọc try/catch để không ảnh hưởng đơn hàng đã commit)
        let paymentSummary: PayosPaymentSummary | null = null;
        try {
            paymentSummary = await this.paymentService.createPaymentLinkForOrder({
                ...order,
                sellerId: order.livestream?.sellerId,
            });
        } catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Không thể tạo link thanh toán payOS cho đơn ${order.id}: ${detail}`);
        }

        // Phát thông báo nổ đơn lên màn hình Streamer
        if (product) {
            this.livestreamGateway.notifyNewOrder(confirmOrderDto.livestreamId, {
                orderId: order.id,
                productName: product.name,
                sku: product.sku,
                price: product.price,
                totalAmount: order.totalAmount,
                buyerName: confirmOrderDto.recipientName || 'Khách hàng',
                phone: maskedPhone,
                createdAt: order.createdAt,
            });

            // Tự động gửi tin nhắn VietQR (ưu tiên payOS thật) vào Inbox của Buyer
            try {
                const sellerId = order.livestream?.sellerId;
                if (sellerId) {
                    await this.directMessageService.sendOrderMessage(
                        sellerId,
                        buyerId,
                        order.totalAmount,
                        order.id,
                        product.name,
                        product.sku,
                        {
                            qrUrl: paymentSummary?.qrUrl,
                            checkoutUrl: paymentSummary?.checkoutUrl,
                            orderCode: paymentSummary?.orderCode,
                            expiresAt: order.expiresAt,
                        },
                    );
                }
            } catch {
                // Không cản trở luồng xác nhận đơn nếu gửi tin nhắn gặp lỗi
            }
        }

        return {
            ...order,
            payment: paymentSummary
                ? {
                      orderCode: paymentSummary.orderCode,
                      checkoutUrl: paymentSummary.checkoutUrl,
                      qrUrl: paymentSummary.qrUrl,
                  }
                : null,
        };
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.BUYER)
    async create(
        @CurrentUser('userId') buyerId: string,
        @Body() createOrderDto: CreateOrderDto,
    ) {
        return this.orderService.createOrder({
            ...createOrderDto,
            buyerId,
        });
    }

    @Get('seller')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SELLER)
    async getSellerOrders(
        @CurrentUser('userId') sellerId: string,
        @Query() query: GetOrdersQueryDto,
    ) {
        return this.orderService.getOrdersForSeller(sellerId, query);
    }

    @Get('buyer')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.BUYER)
    async getBuyerOrders(
        @CurrentUser('userId') buyerId: string,
        @Query() query: GetOrdersQueryDto,
    ) {
        return this.orderService.getOrdersForBuyer(buyerId, query);
    }

    @Patch(':id/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SELLER)
    async updateStatus(
        @Param('id') id: string,
        @CurrentUser('userId') sellerId: string,
        @Body() dto: UpdateOrderStatusDto,
    ) {
        const previous = await this.orderService.getOrderById(id, {
            userId: sellerId,
            role: Role.SELLER,
        });
        const updated = await this.orderService.updateOrderStatus(id, sellerId, dto.status);
        if (dto.status === OrderStatus.CANCELLED) {
            void this.paymentService.cancelPaymentLinkSafely(id);
        } else if (
            dto.status === OrderStatus.PAID &&
            previous.status === OrderStatus.PENDING
        ) {
            const firstProduct = previous.items?.[0]?.product;
            try {
                await this.directMessageService.sendPaymentConfirmedMessage(
                    sellerId,
                    previous.buyerId,
                    previous.totalAmount,
                    previous.id,
                    undefined,
                    firstProduct?.name,
                    firstProduct?.sku,
                );
            } catch (error) {
                const detail = error instanceof Error ? error.message : String(error);
                this.logger.warn(`Không thể gửi thông báo xác nhận thanh toán cho đơn ${id}: ${detail}`);
            }
        }
        return updated;
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async findOne(
        @Param('id') id: string,
        @CurrentUser() user: { userId: string; role: string },
    ) {
        return this.orderService.getOrderById(id, user);
    }
}
