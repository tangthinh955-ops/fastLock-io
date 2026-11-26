import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsInt,
  IsOptional,
  Min,
  Matches,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProductDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsNotEmpty({ message: 'Mã SKU không được để trống' })
  @IsString({ message: 'Mã SKU phải là chuỗi văn bản' })
  @Matches(/^\S+$/, { message: 'Mã SKU không được chứa khoảng trắng' })
  sku: string;

  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
  @IsString({ message: 'Tên sản phẩm phải là chuỗi văn bản' })
  name: string;

  @IsNotEmpty({ message: 'Giá sản phẩm không được để trống' })
  @IsNumber({}, { message: 'Giá sản phẩm phải là số hợp lệ' })
  @Min(0, { message: 'Giá sản phẩm không được nhỏ hơn 0' })
  price: number;

  @IsNotEmpty({ message: 'Số lượng tồn kho không được để trống' })
  @IsInt({ message: 'Số lượng tồn kho phải là số nguyên' })
  @Min(0, { message: 'Số lượng tồn kho không được nhỏ hơn 0' })
  stock: number;

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

  @IsOptional()
  @IsString()
  sellerId?: string;
}