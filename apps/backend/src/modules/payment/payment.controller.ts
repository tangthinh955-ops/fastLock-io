import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Webhook công khai nhận thông báo biến động thanh toán từ payOS.
   * Không dùng JWT; bảo mật bằng chữ ký HMAC (PAYOS_CHECKSUM_KEY) trong PaymentService.
   * Đọc trực tiếp req.body để global ValidationPipe không strip/reject trường mở rộng của payOS.
   */
  @Post('payos/webhook')
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  async handlePayosWebhook(@Req() req: { body?: unknown }) {
    return this.paymentService.handlePayosWebhook(req.body);
  }

  /**
   * Đối soát chủ động trạng thái thanh toán payOS cho một đơn hàng cụ thể.
   */
  @Post('orders/:orderId/sync')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async syncOrderPayment(
    @Param('orderId') orderId: string,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    return this.paymentService.reconcileOrderPayment(orderId, user);
  }
}
