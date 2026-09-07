import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateKbEntryDto {
  @IsString()
  @IsNotEmpty({ message: 'Từ khóa (keyword) không được để trống' })
  @MaxLength(100, { message: 'Từ khóa không được vượt quá 100 ký tự' })
  keyword: string;

  @IsString()
  @IsNotEmpty({ message: 'Nội dung quy định (answer) không được để trống' })
  @MaxLength(1000, {
    message: 'Nội dung quy định không được vượt quá 1000 ký tự',
  })
  answer: string;
}
