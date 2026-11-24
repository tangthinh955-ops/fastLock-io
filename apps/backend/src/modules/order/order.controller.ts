import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards, Inject, forwardRef } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ConfirmOrderDto } from './dto/confirm-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DirectMessageService } from '../direct-message/direct-message.service';
import { LivestreamGateway } from '../livestream/livestream.gateway';

@Controller('orders')
export class OrderController {
    constructor(
        private readonly orderService: OrderService,
        private readonly directMessageService: DirectMessageService,
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

            // Tự động gửi tin nhắn VietQR vào Inbox của Buyer
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
                    );
                }
            } catch {
                // Không cản trở luồng xác nhận đơn nếu gửi tin nhắn gặp lỗi
            }
        }

        return order;
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
        return this.orderService.updateOrderStatus(id, sellerId, dto.status);
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
