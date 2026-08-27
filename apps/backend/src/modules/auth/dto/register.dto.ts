// File: auth/dto/register.dto.ts
// DTO cho chức năng Đăng ký tài khoản mới
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @Transform(({ value }) => value?.trim().toLowerCase())
  @IsEmail({}, { message: 'Email không đúng định dạng!' })
  email: string;

  @Transform(({ value }) => value?.trim())
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự!' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự!' })
  password: string;

  @Transform(({ value }) => value?.trim())
  @IsString({ message: 'Tên phải là chuỗi ký tự!' })
  @IsOptional() // Không bắt buộc phải điền tên
  name?: string;
}
