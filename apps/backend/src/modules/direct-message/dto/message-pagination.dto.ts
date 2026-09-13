import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class MessagePaginationDto {
  @Type(() => Number)
  @IsInt({ message: 'limit phải là số nguyên.' })
  @Min(1, { message: 'limit phải lớn hơn hoặc bằng 1.' })
  @Max(50, { message: 'limit không được vượt quá 50.' })
  limit: number = 5;

  @Type(() => Number)
  @IsInt({ message: 'skip phải là số nguyên.' })
  @Min(0, { message: 'skip phải lớn hơn hoặc bằng 0.' })
  skip: number = 0;
}
