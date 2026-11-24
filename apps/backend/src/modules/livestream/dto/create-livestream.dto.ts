import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';

export class CreateLivestreamDto {
    @IsNotEmpty({ message: 'Tiêu đề buổi livestream không được để trống' })
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true, message: 'Danh sách ID sản phẩm phải là mảng chuỗi' })
    productIds?: string[];

    @IsOptional()
    @IsString()
    sellerId?: string;
}
