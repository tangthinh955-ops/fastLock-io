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
            const hasSku = parseResult.skus.length > 0;

            if (hasSku) {
                if (!buyerId) {
                    this.logger.warn(`Bình luận chứa SKU nhưng buyer chưa đăng nhập: livestreamId=${livestreamId}`);
                    server.to(livestreamId).emit('comment_received', {
                        id: `comment-${Date.now()}`,
                        livestreamId,
                        buyerName: buyerName || 'Khách vãng lai',
                        content: commentText,
                        isOrder: false,
                        createdAt: new Date(),
                    });
                    return;
                }

                const targetSku = parseResult.skus[0];
                const product = await this.prisma.product.findUnique({
                    where: { sku: targetSku },
                });

                if (product && product.sellerId === sellerId) {
                    if (product.stock > 0) {
                        // Lấy thông tin giao hàng đã lưu của Buyer để tự động điền sẵn
                        const buyer = await this.prisma.user.findUnique({
                            where: { id: buyerId },
                            select: {
                                defaultRecipientName: true,
                                defaultPhone: true,
                                defaultAddress: true,
                                name: true,
                            },
                        });

                        // 1. Phát bình luận lên phòng live (đánh dấu là bình luận hỏi mua SKU)
                        server.to(livestreamId).emit('comment_received', {
                            id: `comment-${Date.now()}`,
                            livestreamId,
                            buyerName: buyerName || 'Khách hàng',
                            content: commentText,
                            isOrder: true,
                            sku: product.sku,
                            createdAt: new Date(),
                        });

                        // 2. KHÔNG trừ kho ngay: Phát sự kiện 'draft_order_ready' để Buyer mở popup xác nhận
                        server.to(livestreamId).emit('draft_order_ready', {
                            buyerId,
                            livestreamId,
                            product: {
                                id: product.id,
                                sku: product.sku,
                                name: product.name,
                                price: product.price,
                                stock: product.stock,
                                imageUrl: product.imageUrl,
                            },
                            defaultShipping: {
                                recipientName: buyer?.defaultRecipientName || buyer?.name || buyerName || '',
                                shippingPhone: buyer?.defaultPhone || finalPhone || '',
                                shippingAddress: buyer?.defaultAddress || '',
                            },
                        });
                        return;
                    } else {
                        // Hết hàng: Thông báo lên phòng live
                        server.to(livestreamId).emit('comment_received', {
                            id: `comment-${Date.now()}`,
                            livestreamId,
                            buyerName: buyerName || 'Khách hàng',
                            content: commentText,
                            isOrder: true,
                            sku: product.sku,
                            outOfStock: true,
                            createdAt: new Date(),
                        });
                        server.to(livestreamId).emit('order_failed', {
                            buyerId,
                            sku: product.sku,
                            reason: 'OUT_OF_STOCK',
                            message: `Rất tiếc! Sản phẩm ${product.name} (SKU: ${product.sku}) hiện đã hết hàng.`,
                        });
                        return;
                    }
                }
            }

            server.to(livestreamId).emit('comment_received', {
                id: `comment-${Date.now()}`,
                livestreamId,
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
