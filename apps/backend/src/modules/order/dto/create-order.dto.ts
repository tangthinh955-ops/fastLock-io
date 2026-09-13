import { IsNotEmpty, IsNumber, IsString, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
    @IsString()
    @IsNotEmpty()
    productId: string;

    @IsNumber()
    @Min(1)
    quantity: number;
}

export class CreateOrderDto {
    @IsString()
    @IsNotEmpty()
    buyerId: string;

    @IsString()
    @IsNotEmpty()
    livestreamId: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];
}
