import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateKbEntryDto {
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @MaxLength(100, { message: 'Tiêu đề không được vượt quá 100 ký tự' })
  keyword: string;

  @IsString()
  @IsNotEmpty({ message: 'Nội dung kiến thức không được để trống' })
  @MaxLength(1000, {
    message: 'Nội dung kiến thức không được vượt quá 1000 ký tự',
  })
  answer: string;
}
