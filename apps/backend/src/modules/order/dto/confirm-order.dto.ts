import { IsNotEmpty, IsString, IsOptional, IsInt, Min, IsBoolean } from 'class-validator';

export class ConfirmOrderDto {
    @IsNotEmpty({ message: 'livestreamId không được để trống' })
    @IsString()
    livestreamId: string;

    @IsNotEmpty({ message: 'productId không được để trống' })
    @IsString()
    productId: string;

    @IsOptional()
    @IsInt({ message: 'Số lượng phải là số nguyên' })
    @Min(1, { message: 'Số lượng tối thiểu là 1' })
    quantity?: number;

    @IsNotEmpty({ message: 'Vui lòng nhập họ tên người nhận' })
    @IsString()
    recipientName: string;

    @IsNotEmpty({ message: 'Vui lòng nhập số điện thoại nhận hàng' })
    @IsString()
    shippingPhone: string;

    @IsNotEmpty({ message: 'Vui lòng nhập địa chỉ nhận hàng' })
    @IsString()
    shippingAddress: string;

    @IsOptional()
    @IsString()
    shippingNote?: string;

    @IsOptional()
    @IsBoolean()
    saveAsDefault?: boolean;
}
