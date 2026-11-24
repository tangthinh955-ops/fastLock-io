import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateLivestreamDto } from './dto/create-livestream.dto';

@Injectable()
export class LivestreamService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Kết thúc toàn bộ phiên Livestream đang LIVE của Seller và trả về danh sách ID đã đóng
     */
    async endActiveStreamsForSeller(sellerId: string): Promise<string[]> {
        const activeStreams = await this.prisma.livestream.findMany({
            where: {
                sellerId,
                status: 'LIVE',
            },
            select: { id: true },
        });

        if (activeStreams.length === 0) {
            return [];
        }

        const endedIds = activeStreams.map((stream) => stream.id);
        await this.prisma.livestream.updateMany({
            where: {
                id: { in: endedIds },
                status: 'LIVE',
            },
            data: {
                status: 'ENDED',
                endedAt: new Date(),
            },
        });

        return endedIds;
    }

    /**
     * Bắt đầu một phiên Livestream mới cho Seller
     */
    async createStream(sellerId: string, dto: CreateLivestreamDto) {
        // Tự động kết thúc các phiên live cũ đang bật của Seller này (nếu có)
        await this.endActiveStreamsForSeller(sellerId);

        // Tạo phiên live mới với status LIVE
        const connectProducts = dto.productIds && dto.productIds.length > 0
            ? { connect: dto.productIds.map((id) => ({ id })) }
            : undefined;

        return await this.prisma.livestream.create({
            data: {
                title: dto.title,
                description: dto.description,
                sellerId,
                status: 'LIVE',
                startedAt: new Date(),
                products: connectProducts,
            },
            include: {
                seller: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                products: {
                    select: {
                        id: true,
                        sku: true,
                        name: true,
                        price: true,
                        stock: true,
                        imageUrl: true,
                    },
                },
            },
        });
    }

    /**
     * Kết thúc phiên Livestream
     */
    async endStream(id: string, sellerId?: string) {
        const stream = await this.prisma.livestream.findUnique({ where: { id } });
        if (!stream) {
            throw new NotFoundException(`Không tìm thấy phiên Livestream ID: ${id}`);
        }

        if (sellerId && stream.sellerId !== sellerId) {
            throw new ForbiddenException('Bạn không có quyền kết thúc phiên Livestream của người khác!');
        }

        return await this.prisma.livestream.update({
            where: { id },
            data: {
                status: 'ENDED',
                endedAt: new Date(),
            },
        });
    }

    /**
     * Lấy phiên Livestream đang LIVE của Seller
     */
    async getActiveStreamBySeller(sellerId: string) {
        return await this.prisma.livestream.findFirst({
            where: {
                sellerId,
                status: 'LIVE',
            },
            include: {
                seller: {
                    select: { id: true, name: true, email: true },
                },
                orders: {
                    include: {
                        items: {
                            include: { product: true },
                        },
                        buyer: {
                            select: { id: true, name: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
    }

    /**
     * Lấy danh sách tất cả các phiên Livestream đang phát sóng
     */
    async getAllActiveStreams() {
        return await this.prisma.livestream.findMany({
            where: {
                status: 'LIVE',
            },
            include: {
                seller: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: { startedAt: 'desc' },
        });
    }

    /**
     * Lấy danh sách tất cả các Shop (SELLER) kèm trạng thái LIVE/OFFLINE
     */
    async getShopsWithLiveStatus() {
        const sellers = await this.prisma.user.findMany({
            where: { role: 'SELLER' },
            select: {
                id: true,
                name: true,
                email: true,
                _count: { select: { products: true } },
                livestreams: {
                    where: { status: 'LIVE' },
                    orderBy: { startedAt: 'desc' },
                    take: 1,
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        sellerId: true,
                        startedAt: true,
                    },
                },
            },
        });

        const shops = sellers.map((seller) => {
            const live = seller.livestreams[0] ?? null;
            return {
                id: seller.id,
                name: seller.name,
                email: seller.email,
                productCount: seller._count.products,
                isLive: Boolean(live),
                activeStream: live
                    ? {
                          id: live.id,
                          title: live.title,
                          sellerId: seller.id,
                          startedAt: live.startedAt,
                          seller: {
                              id: seller.id,
                              name: seller.name,
                          },
                      }
                    : null,
            };
        });

        return shops.sort((a, b) => {
            if (a.isLive !== b.isLive) {
                return a.isLive ? -1 : 1;
            }
            if (a.isLive && b.isLive) {
                const aTime = a.activeStream?.startedAt
                    ? new Date(a.activeStream.startedAt).getTime()
                    : 0;
                const bTime = b.activeStream?.startedAt
                    ? new Date(b.activeStream.startedAt).getTime()
                    : 0;
                if (bTime !== aTime) {
                    return bTime - aTime;
                }
            }
            return a.name.localeCompare(b.name);
        });
    }

    /**
     * Lấy thông tin chi tiết của 1 phiên livestream theo ID
     */
    async getStreamById(id: string) {
        const stream = await this.prisma.livestream.findUnique({
            where: { id },
            include: {
                seller: {
                    select: { id: true, name: true, email: true },
                },
                orders: {
                    include: {
                        items: {
                            include: { product: true },
                        },
                        buyer: {
                            select: { id: true, name: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!stream) {
            throw new NotFoundException(`Không tìm thấy phiên livestream ID ${id}`);
        }

        return stream;
    }

    /**
     * Lấy danh sách sản phẩm được chọn mở bán trong phiên livestream
     */
    async getLiveProducts(livestreamId: string) {
        const stream = await this.prisma.livestream.findUnique({
            where: { id: livestreamId },
            select: {
                products: {
                    select: {
                        id: true,
                        sku: true,
                        name: true,
                        price: true,
                        stock: true,
                        imageUrl: true,
                    },
                    orderBy: { sku: 'asc' },
                },
            },
        });
        return stream?.products ?? [];
    }

    /**
     * Lấy danh sách SKU sản phẩm của Seller để nạp vào Aho-Corasick Automaton
     */
    async getSellerSkus(sellerId: string): Promise<string[]> {
        const products = await this.prisma.product.findMany({
            where: { sellerId },
            select: { sku: true },
        });
        return products.map((p) => p.sku);
    }
}
