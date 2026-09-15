import { IsNotEmpty, IsString } from 'class-validator';

export class CreateLivestreamDto {
    @IsNotEmpty({ message: 'Tiêu đề buổi livestream không được để trống' })
    @IsString()
    title: string;

    @IsNotEmpty({ message: 'sellerId không được để trống' })
    @IsString()
    sellerId: string;
}
