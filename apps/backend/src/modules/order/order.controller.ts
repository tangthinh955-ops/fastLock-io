import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
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

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async findOne(
        @Param('id') id: string,
        @CurrentUser() user: { userId: string; role: string },
    ) {
        return this.orderService.getOrderById(id, user);
    }
}
