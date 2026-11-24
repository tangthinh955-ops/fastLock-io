import {
    IsNotEmpty,
    IsInt,
    IsString,
    IsArray,
    ArrayMinSize,
    ValidateNested,
    Min,
    IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
    @IsString()
    @IsNotEmpty()
    productId: string;

    @IsInt()
    @Min(1)
    quantity: number;
}

export class CreateOrderDto {
    @IsOptional()
    @IsString()
    buyerId?: string;

    @IsString()
    @IsNotEmpty()
    livestreamId: string;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];
}
