import { Module } from '@nestjs/common';
import { LivestreamService } from './livestream.service';
import { LivestreamController } from './livestream.controller';
import { LivestreamGateway } from './livestream.gateway';
import { LivestreamCommentProcessor } from './livestream-comment.processor';
import { ParserModule } from '../parser/parser.module';
import { OrderModule } from '../order/order.module';
import { DirectMessageModule } from '../direct-message/direct-message.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [ParserModule, OrderModule, DirectMessageModule, AuthModule],
    controllers: [LivestreamController],
    providers: [LivestreamService, LivestreamGateway, LivestreamCommentProcessor],
    exports: [LivestreamService, LivestreamGateway],
})
export class LivestreamModule { }
