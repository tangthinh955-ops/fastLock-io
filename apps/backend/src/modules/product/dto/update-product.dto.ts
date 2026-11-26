import {
  IsOptional,
  IsString,
  IsNumber,
  IsInt,
  Min,
  Matches,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProductDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Matches(/^\S+$/, { message: 'Mã SKU không được chứa khoảng trắng' })
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
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Đường dẫn ảnh phải là chuỗi văn bản' })
  @MaxLength(2048, { message: 'Đường dẫn ảnh không được vượt quá 2048 ký tự' })
  @Matches(/^(|https?:\/\/\S+)$/i, {
    message: 'Đường dẫn ảnh phải là URL http(s) hợp lệ hoặc để trống',
  })
  imageUrl?: string;
}