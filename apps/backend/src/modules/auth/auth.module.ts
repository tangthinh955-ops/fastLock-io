import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    UserModule, // Mượn hàm tìm User của UserModule
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'DoAnKy-Thinh',
      signOptions: { expiresIn: '1d' }, // Token sống được 1 ngày
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule { }
