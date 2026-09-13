import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrderController {
    constructor(private readonly orderService: OrderService) { }

    @Post()
    async create(@Body() createOrderDto: CreateOrderDto) {
        return this.orderService.createOrder(createOrderDto);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.orderService.getOrderById(id);
    }
}
