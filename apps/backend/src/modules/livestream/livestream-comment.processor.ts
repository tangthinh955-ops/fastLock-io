import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { LivestreamService } from './livestream.service';
import { ParserService } from '../parser/parser.service';
import { OrderService } from '../order/order.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { DirectMessageService } from '../direct-message/direct-message.service';

export class SendCommentDto {
    livestreamId: string;
    buyerId: string;
    buyerName: string;
    commentText: string;
    phone?: string;
}

@Injectable()
export class LivestreamCommentProcessor {
    private readonly logger = new Logger(LivestreamCommentProcessor.name);

    constructor(
        private readonly livestreamService: LivestreamService,
        private readonly parserService: ParserService,
        private readonly orderService: OrderService,
        private readonly prisma: PrismaService,
        private readonly directMessageService: DirectMessageService,
    ) { }

    async processComment(server: Server, data: SendCommentDto) {
        const { livestreamId, buyerId, buyerName, commentText, phone } = data;
        if (!livestreamId || !commentText) return;

        try {
            const stream = await this.livestreamService.getStreamById(livestreamId);
            if (!stream) return;

            if (stream.status !== 'LIVE') {
                server.to(livestreamId).emit('comment_error', {
                    message: 'Phiên livestream đã kết thúc.',
                });
                return;
            }

            const sellerId = stream.sellerId;
            const sellerSkus = await this.livestreamService.getSellerSkus(sellerId);
            const parseResult = this.parserService.parseComment(commentText, sellerSkus);

            const finalPhone = parseResult.phone || phone || null;
            const isOrder = Boolean(finalPhone && parseResult.skus.length > 0);

            if (isOrder && parseResult.skus.length > 0) {
                const targetSku = parseResult.skus[0];
                const product = await this.prisma.product.findUnique({
                    where: { sku: targetSku },
                });

                if (product && product.sellerId === sellerId && product.stock > 0) {
                    try {
                        const order = await this.orderService.createOrder({
                            buyerId: buyerId || 'buyer-uuid-001',
                            livestreamId,
                            items: [{ productId: product.id, quantity: 1 }],
                        });

                        server.to(livestreamId).emit('new_order', {
                            orderId: order.id,
                            productName: product.name,
                            sku: product.sku,
                            price: product.price,
                            totalAmount: order.totalAmount,
                            buyerName: buyerName || 'Khách hàng',
                            phone: finalPhone,
                            createdAt: order.createdAt,
                        });

                        server.to(livestreamId).emit('comment_received', {
                            id: `comment-${Date.now()}`,
                            buyerName: buyerName || 'Khách hàng',
                            content: commentText,
                            isOrder: true,
                            sku: product.sku,
                            orderSuccess: true,
                            createdAt: new Date(),
                        });

                        if (buyerId && buyerId !== 'buyer-uuid-001') {
                            await this.directMessageService.sendOrderMessage(
                                sellerId,
                                buyerId,
                                order.totalAmount,
                                order.id,
                                product.name,
                                product.sku,
                            );
                        }
                        return;
                    } catch (orderErr) {
                        this.logger.error(`Lỗi khi tạo đơn hàng: ${orderErr.message}`);
                    }
                }
            }

            server.to(livestreamId).emit('comment_received', {
                id: `comment-${Date.now()}`,
                buyerName: buyerName || 'Khách hàng',
                content: commentText,
                isOrder: false,
                createdAt: new Date(),
            });
        } catch (error) {
            this.logger.error(`Lỗi xử lý comment livestream: ${error.message}`);
        }
    }
}
