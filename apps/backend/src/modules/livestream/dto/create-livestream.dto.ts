import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateLivestreamDto {
    @IsNotEmpty({ message: 'Tiêu đề buổi livestream không được để trống' })
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    sellerId?: string;
}
