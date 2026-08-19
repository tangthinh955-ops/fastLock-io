import { Module } from '@nestjs/common';
import { PrismaModule } from './core/prisma/prisma.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { DirectMessageModule } from './modules/direct-message/direct-message.module';
import { ProductModule } from './modules/product/product.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    AuthModule,
    DirectMessageModule,
    ProductModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
