import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './core/prisma/prisma.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { DirectMessageModule } from './modules/direct-message/direct-message.module';
import { ProductModule } from './modules/product/product.module';
import { AiModule } from './modules/ai/ai.module';
import { ParserModule } from './modules/parser/parser.module';
import { OrderModule } from './modules/order/order.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Rate Limiting toàn cục — Áp dụng cho TẤT CẢ các API
    // ttl: 60000ms = 60 giây | limit: 100 lần tối đa trong 60 giây
    ThrottlerModule.forRoot([
      {
        name: 'global',   // Tên để dễ phân biệt khi log lỗi
        ttl: 60000,       // Cửa sổ thời gian: 60 giây (tính bằng milliseconds)
        limit: 100,       // Tối đa 100 request trong mỗi 60 giây
      },
    ]),

    PrismaModule,
    UserModule,
    AuthModule,
    DirectMessageModule,
    ProductModule,
    AiModule,
    ParserModule,
    OrderModule,
  ],
  controllers: [],
  providers: [
    // Kích hoạt ThrottlerGuard toàn cục — không cần @UseGuards ở từng Controller nữa
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }

