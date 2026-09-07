import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  // Bật ValidationPipe toàn cục — Tự động kiểm tra DTO trước khi vào Controller
  // whitelist: true → Tự xóa bỏ các field lạ client gửi lên (bảo mật)
  // forbidNonWhitelisted: true → Trả lỗi 400 nếu client gửi field không được khai báo
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true, // Tự động convert kiểu dữ liệu (VD: string → number)
    }),
  );

  await app.listen(3001);
}
void bootstrap();
