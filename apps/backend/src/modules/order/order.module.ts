import { Module, forwardRef } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderExpirationService } from './order-expiration.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { DirectMessageModule } from '../direct-message/direct-message.module';
import { LivestreamModule } from '../livestream/livestream.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
    imports: [
        PrismaModule,
        DirectMessageModule,
        PaymentModule,
        forwardRef(() => LivestreamModule),
    ],
    controllers: [OrderController],
    providers: [OrderService, OrderExpirationService],
    exports: [OrderService],
})
export class OrderModule { }


