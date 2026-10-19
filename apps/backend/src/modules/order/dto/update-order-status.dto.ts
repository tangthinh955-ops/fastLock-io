import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
    @IsNotEmpty({ message: 'Trạng thái đơn hàng không được để trống' })
    @IsEnum(OrderStatus, {
        message: 'Trạng thái không hợp lệ. Chỉ chấp nhận PENDING, PAID, CANCELLED',
    })
    status: OrderStatus;
}
