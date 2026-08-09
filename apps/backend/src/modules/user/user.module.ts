import { Module } from '@nestjs/common';
import { UserService } from './user.service';

@Module({
  providers: [UserService],
  exports: [UserService], // Export để AuthModule có thể mượn hàm findByEmail
})
export class UserModule {}
