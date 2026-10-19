import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateLivestreamDto } from './dto/create-livestream.dto';

@Injectable()
export class LivestreamService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Bắt đầu một phiên Livestream mới cho Seller
     */
    async createStream(sellerId: string, dto: CreateLivestreamDto) {
        // Tự động kết thúc các phiên live cũ đang bật của Seller này (nếu có)
        await this.prisma.livestream.updateMany({
            where: {
                sellerId,
                status: 'LIVE',
            },
            data: {
                status: 'ENDED',
                endedAt: new Date(),
            },
        });

        // Tạo phiên live mới với status LIVE
        return await this.prisma.livestream.create({
            data: {
                title: dto.title,
                sellerId,
                status: 'LIVE',
                startedAt: new Date(),
            },
            include: {
                seller: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
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
