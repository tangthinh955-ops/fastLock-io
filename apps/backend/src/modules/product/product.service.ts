import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  private normalizeImageUrl(imageUrl?: string): string | null | undefined {
    if (imageUrl === undefined) {
      return undefined;
    }
    const trimmed = imageUrl.trim();
    return trimmed ? trimmed : null;
  }

  async create(sellerId: string, dto: CreateProductDto) {
    try {
      const sku = dto.sku.trim().toUpperCase();

      // 1. Kiểm tra tài khoản Seller có tồn tại không
      const seller = await this.prisma.user.findUnique({
        where: { id: sellerId },
      });
      if (!seller) {
        throw new BadRequestException(
          `Không tìm thấy tài khoản Seller ID '${sellerId}' trong CSDL! Vui lòng đăng nhập lại.`,
        );
      }

      // 2. Kiểm tra trùng SKU
      const existing = await this.prisma.product.findUnique({
        where: { sku },
      });
      if (existing) {
        throw new BadRequestException(`Mã SKU '${sku}' đã tồn tại!`);
      }

      const { imageUrl, ...rest } = dto;
      const normalizedImageUrl = this.normalizeImageUrl(imageUrl);

      return await this.prisma.product.create({
        data: {
          ...rest,
          sku,
          sellerId,
          ...(normalizedImageUrl !== undefined
            ? { imageUrl: normalizedImageUrl }
            : {}),
        },
      });
    } catch (err: any) {
      if (err instanceof BadRequestException || err instanceof NotFoundException || err instanceof ForbiddenException) {
        throw err;
      }
      if (err?.code === 'P2002') {
        throw new BadRequestException('Mã SKU đã tồn tại!');
      }
      if (err?.code === 'P1001') {
        throw new InternalServerErrorException(
          'Chưa kết nối được CSDL PostgreSQL. Vui lòng kiểm tra Docker Desktop!',
        );
      }
      throw new InternalServerErrorException(
        `Lỗi khi tạo sản phẩm: ${err.message || 'Không thể tương tác CSDL.'}`,
      );
    }
  }

  async findAllBySeller(sellerId: string) {
    const normalizedSellerId = sellerId?.trim();
    if (!normalizedSellerId) {
      throw new BadRequestException('Thiếu mã cửa hàng (sellerId)!');
    }

    return await this.prisma.product.findMany({
      where: { sellerId: normalizedSellerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm!');
    return product;
  }

  private handlePrismaWriteError(err: any): never {
    if (err?.code === 'P2002') {
      throw new BadRequestException('Mã SKU đã tồn tại!');
    }
    if (err?.code === 'P2003') {
      throw new BadRequestException(
        'Không thể xóa sản phẩm đã phát sinh đơn hàng!',
      );
    }
    if (err?.code === 'P2025') {
      throw new NotFoundException('Không tìm thấy sản phẩm!');
    }
    throw err;
  }

  async update(id: string, sellerId: string, dto: UpdateProductDto) {
    const product = await this.findOne(id);
    if (product.sellerId !== sellerId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa sản phẩm của Shop khác!');
    }

    const { sku, imageUrl, ...rest } = dto;
    const data: Prisma.ProductUpdateInput = {
      ...rest,
      ...(sku !== undefined ? { sku: sku.trim().toUpperCase() } : {}),
      ...(imageUrl !== undefined
        ? { imageUrl: this.normalizeImageUrl(imageUrl) }
        : {}),
    };

    try {
      return await this.prisma.product.update({
        where: { id },
        data,
      });
    } catch (err: any) {
      this.handlePrismaWriteError(err);
    }
  }

  async remove(id: string, sellerId: string) {
    const product = await this.findOne(id);
    if (product.sellerId !== sellerId) {
      throw new ForbiddenException('Bạn không có quyền xóa sản phẩm của Shop khác!');
    }

    try {
      return await this.prisma.product.delete({ where: { id } });
    } catch (err: any) {
      this.handlePrismaWriteError(err);
    }
  }
}
