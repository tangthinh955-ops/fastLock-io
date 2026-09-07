import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class SendSellerMessageDto {
  @IsUUID('4', { message: 'ID khách hàng không hợp lệ.' })
  buyerId: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Tin nhắn phải là chuỗi.' })
  @IsNotEmpty({ message: 'Tin nhắn không được để trống.' })
  @MaxLength(1000, { message: 'Tin nhắn không được vượt quá 1000 ký tự.' })
  message: string;
}
