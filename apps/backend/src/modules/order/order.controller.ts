import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('orders')
export class OrderController {
    constructor(private readonly orderService: OrderService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
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
