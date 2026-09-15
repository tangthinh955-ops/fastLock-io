import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { execSync } from 'child_process';

/**
 * Tự động giải phóng cổng (Port) nếu bị chiếm dụng bởi tiến trình Node rác chạy ngầm
 */
function killPort(port: number) {
  try {
    if (process.platform === 'win32') {
      execSync(`for /f "tokens=5" %a in ('netstat -aon ^| findstr :${port} ^| findstr LISTENING') do taskkill /f /pid %a`, {
        stdio: 'ignore',
      });
    } else {
      execSync(`lsof -t -i:${port} | xargs kill -9`, { stdio: 'ignore' });
    }
  } catch {
    // Cổng chưa bị chiếm dụng hoặc đã tự do
  }
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const PORT = Number(process.env.PORT) || 3001;

  // Giải phóng cổng 3001 trước khi khởi chạy ứng dụng
  killPort(PORT);

  const app = await NestFactory.create(AppModule);
  app.enableCors();

  // Bật ValidationPipe toàn cục — Tự động kiểm tra DTO trước khi vào Controller
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  try {
    await app.listen(PORT);
    logger.log(`🚀 NestJS Backend đang chạy thành công tại port: ${PORT}`);
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      logger.warn(`Cổng ${PORT} bị chiếm dụng. Đang tự động giải phóng...`);
      killPort(PORT);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await app.listen(PORT);
      logger.log(`🚀 NestJS Backend đã giải phóng và khởi chạy thành công tại port: ${PORT}`);
    } else {
      throw error;
    }
  }
}

void bootstrap();
