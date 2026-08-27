// File: auth/dto/login.dto.ts
// @Transform chạy TRƯỚC @IsEmail — Tự động dọn dẹp input trước khi validate
import { IsEmail, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  // Trim khoảng trắng đầu/cuối, chuyển về chữ thường → chặn edge case "  Admin@Email.COM  "
  @Transform(({ value }) => value?.trim().toLowerCase())
  @IsEmail({}, { message: 'Email không đúng định dạng!' })
  email: string;

  // Chỉ trim password, KHÔNG toLowerCase (password phân biệt hoa/thường)
  @Transform(({ value }) => value?.trim())
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự!' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự!' })
  password: string;
}
