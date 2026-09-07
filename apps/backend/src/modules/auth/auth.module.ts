import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    UserModule, // Mượn hàm tìm User của UserModule (dùng khi login)
    PrismaModule, // Cần để tạo User mới trong DB (dùng khi register)
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'DoAnKy-Thinh',
      signOptions: { expiresIn: '1d' }, // Token sống được 1 ngày
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
