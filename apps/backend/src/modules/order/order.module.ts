import { Module, forwardRef } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { DirectMessageModule } from '../direct-message/direct-message.module';
import { LivestreamModule } from '../livestream/livestream.module';

@Module({
    imports: [
        PrismaModule,
        DirectMessageModule,
        forwardRef(() => LivestreamModule),
    ],
    controllers: [OrderController],
    providers: [OrderService],
    exports: [OrderService],
})
export class OrderModule { }


