import { IsString, IsNumber, Min, IsUUID } from 'class-validator';

export class CreateMessageDto {
  @IsUUID('4', { message: 'ID người nhận phải là chuỗi UUID hợp lệ' })
  receiverId: string;

  @IsNumber({}, { message: 'Số tiền phải là số' })
  @Min(1000, { message: 'Số tiền tối thiểu là 1000 VNĐ' })
  amount: number;

  @IsString({ message: 'Mã đơn hàng phải là chuỗi' })
  orderId: string;
}
