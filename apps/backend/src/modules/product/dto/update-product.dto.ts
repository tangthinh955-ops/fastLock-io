import { IsOptional, IsString, IsNumber, IsInt, Min } from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Giá bán phải là số hợp lệ' })
  @Min(0, { message: 'Giá bán phải lớn hơn hoặc bằng 0' })
  price?: number;

  @IsOptional()
  @IsInt({ message: 'Tồn kho phải là số nguyên' })
  @Min(0, { message: 'Tồn kho phải lớn hơn hoặc bằng 0' })
  stock?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
