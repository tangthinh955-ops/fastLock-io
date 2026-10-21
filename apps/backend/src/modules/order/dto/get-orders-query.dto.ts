import { IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '@prisma/client';

export class GetOrdersQueryDto {
    @IsOptional()
    @IsEnum(OrderStatus, {
        message: 'Lọc trạng thái chỉ chấp nhận PENDING, PAID, CANCELLED',
    })
    status?: OrderStatus;

    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'Trang phải là số' })
    @Min(1, { message: 'Trang tối thiểu là 1' })
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'Số lượng mục trên trang phải là số' })
    @Min(1, { message: 'Số lượng tối thiểu là 1' })
    limit?: number = 10;
}
