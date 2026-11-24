import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Server, Socket } from 'socket.io';
import { LivestreamService } from './livestream.service';
import { ParserService } from '../parser/parser.service';
import { OrderService } from '../order/order.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { DirectMessageService } from '../direct-message/direct-message.service';

export class SendCommentDto {
    livestreamId: string;
    buyerId: string;
    buyerName: string;
    buyerRole?: string;
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

    private emitToClientOrRoom(
        server: Server,
        livestreamId: string,
        event: string,
        payload: unknown,
        client?: Pick<Socket, 'emit'>,
    ) {
        if (client) {
            client.emit(event, payload);
        } else {
            server.to(livestreamId).emit(event, payload);
        }
    }

    async processComment(
        server: Server,
        data: SendCommentDto,
        client?: Pick<Socket, 'emit'>,
    ) {
        const { livestreamId, buyerId, buyerName, buyerRole, commentText, phone } = data;
        if (!livestreamId || !commentText) return;

        try {
            const stream = await this.livestreamService.getStreamById(livestreamId);
            if (!stream) return;

            if (stream.status !== 'LIVE') {
                this.emitToClientOrRoom(
                    server,
                    livestreamId,
                    'comment_error',
                    { message: 'Phiên livestream đã kết thúc.' },
                    client,
                );
                return;
            }

            const sellerId = stream.sellerId;
            const maskedContent = this.parserService.maskPhoneInText(commentText);
            const sellerSkus = await this.livestreamService.getSellerSkus(sellerId);
            const parseResult = this.parserService.parseComment(commentText, sellerSkus);

            const validatedFallbackPhone = this.parserService.extractPhoneNumber(
                phone ?? '',
            );
            const finalPhone = parseResult.phone || validatedFallbackPhone || null;
            const canTriggerDraftOrder = !buyerRole || buyerRole === 'BUYER';
            const hasSku = canTriggerDraftOrder && parseResult.skus.length > 0;

            if (hasSku) {
                if (!buyerId) {
                    this.logger.warn(
                        `Bình luận chứa SKU nhưng buyer chưa đăng nhập: livestreamId=${livestreamId}`,
                    );
                    server.to(livestreamId).emit('comment_received', {
                        id: randomUUID(),
                        livestreamId,
                        buyerId: buyerId || undefined,
                        buyerName: buyerName || 'Khách vãng lai',
                        content: maskedContent,
                        isOrder: false,
                        createdAt: new Date(),
                    });
                    return;
                }

                const targetSku = parseResult.skus[0];
                const product =
                    typeof this.prisma.product.findFirst === 'function'
                        ? await this.prisma.product.findFirst({
                              where: {
                                  sellerId,
                                  sku: { equals: targetSku, mode: 'insensitive' },
                              },
                          })
                        : await this.prisma.product.findUnique({
                              where: { sku: targetSku },
                          });

                if (product && product.sellerId === sellerId) {
                    if (product.stock > 0) {
                        // Lấy thông tin giao hàng đã lưu của Buyer để tự động điền sẵn
                        const buyer =
                            typeof this.prisma.user?.findUnique === 'function'
                                ? await this.prisma.user.findUnique({
                                      where: { id: buyerId },
                                      select: {
                                          defaultRecipientName: true,
                                          defaultPhone: true,
                                          defaultAddress: true,
                                          name: true,
                                      },
                                  })
                                : null;

                        // 1. Phát bình luận lên phòng live (đánh dấu là bình luận hỏi mua SKU)
                        server.to(livestreamId).emit('comment_received', {
                            id: randomUUID(),
                            livestreamId,
                            buyerId: buyerId || undefined,
                            buyerName: buyerName || 'Khách hàng',
                            content: maskedContent,
                            isOrder: true,
                            sku: product.sku,
                            orderSuccess: true,
                            createdAt: new Date(),
                        });

                        // 2. KHÔNG trừ kho ngay: Phát sự kiện 'draft_order_ready' riêng cho Buyer mở popup xác nhận
                        this.emitToClientOrRoom(
                            server,
                            livestreamId,
                            'draft_order_ready',
                            {
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
                                    recipientName:
                                        buyer?.defaultRecipientName ||
                                        buyer?.name ||
                                        buyerName ||
                                        '',
                                    shippingPhone:
                                        buyer?.defaultPhone || finalPhone || '',
                                    shippingAddress: buyer?.defaultAddress || '',
                                },
                            },
                            client,
                        );
                        return;
                    } else {
                        // Hết hàng: Thông báo lên phòng live và gửi lỗi riêng cho Buyer
                        server.to(livestreamId).emit('comment_received', {
                            id: randomUUID(),
                            livestreamId,
                            buyerId: buyerId || undefined,
                            buyerName: buyerName || 'Khách hàng',
                            content: maskedContent,
                            isOrder: true,
                            sku: product.sku,
                            outOfStock: true,
                            orderSuccess: false,
                            createdAt: new Date(),
                        });
                        this.emitToClientOrRoom(
                            server,
                            livestreamId,
                            'order_failed',
                            {
                                buyerId,
                                sku: product.sku,
                                reason: 'OUT_OF_STOCK',
                                message: `Rất tiếc! Sản phẩm ${product.name} (SKU: ${product.sku}) hiện đã hết hàng.`,
                            },
                            client,
                        );
                        return;
                    }
                }
            }

            server.to(livestreamId).emit('comment_received', {
                id: randomUUID(),
                livestreamId,
                buyerId: buyerId || undefined,
                buyerName: buyerName || 'Khách hàng',
                content: maskedContent,
                isOrder: false,
                createdAt: new Date(),
            });
        } catch (error) {
            this.logger.error(
                `Lỗi xử lý comment livestream: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }
}
