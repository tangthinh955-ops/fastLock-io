import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    try {
      // 1. Kiểm tra tài khoản Seller có tồn tại không
      const seller = await this.prisma.user.findUnique({
        where: { id: dto.sellerId },
      });
      if (!seller) {
        throw new BadRequestException(
          `Không tìm thấy tài khoản Seller ID '${dto.sellerId}' trong CSDL! Vui lòng đăng nhập lại.`,
        );
      }

      // 2. Kiểm tra trùng SKU
      const existing = await this.prisma.product.findUnique({
        where: { sku: dto.sku },
      });
      if (existing) {
        throw new BadRequestException(`Mã SKU '${dto.sku}' đã tồn tại!`);
      }

      return await this.prisma.product.create({
        data: dto,
      });
    } catch (err: any) {
      if (err instanceof BadRequestException || err instanceof NotFoundException) {
        throw err;
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
    try {
      return await this.prisma.product.findMany({
        where: { sellerId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err: any) {
      if (err?.code === 'P1001') {
        return [];
      }
      return [];
    }
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm!');
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.delete({ where: { id } });
  }
}
