import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../../core/prisma/prisma.service';

describe('ProductService & Product DTOs (imageUrl validation & normalization)', () => {
  let service: ProductService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ProductService(mockPrisma as unknown as PrismaService);
  });

  describe('ProductService.create', () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'seller-1',
        role: 'SELLER',
      });
      mockPrisma.product.findUnique.mockResolvedValue(null);
      mockPrisma.product.create.mockImplementation(
        async ({ data }: { data: Record<string, unknown> }) => ({
          id: 'prod-1',
          ...data,
        }),
      );
    });

    it('nên lưu imageUrl đã trim khi URL hợp lệ', async () => {
      const validUrl =
        'https://res.cloudinary.com/demo/image/upload/v1/sample.webp';

      await service.create('seller-1', {
        sku: ' sp01 ',
        name: 'Áo thun',
        price: 150000,
        stock: 10,
        imageUrl: `  ${validUrl}  `,
      });

      expect(mockPrisma.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sku: 'SP01',
          name: 'Áo thun',
          price: 150000,
          stock: 10,
          sellerId: 'seller-1',
          imageUrl: validUrl,
        }),
      });
    });

    it('nên chuyển imageUrl rỗng ("") thành null khi tạo sản phẩm', async () => {
      await service.create('seller-1', {
        sku: 'SP02',
        name: 'Quần jean',
        price: 250000,
        stock: 5,
        imageUrl: '',
      });

      expect(mockPrisma.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sku: 'SP02',
          sellerId: 'seller-1',
          imageUrl: null,
        }),
      });
    });

    it('nên chuyển imageUrl chỉ có khoảng trắng ("   ") thành null khi tạo sản phẩm', async () => {
      await service.create('seller-1', {
        sku: 'SP03',
        name: 'Áo khoác',
        price: 350000,
        stock: 8,
        imageUrl: '   ',
      });

      expect(mockPrisma.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sku: 'SP03',
          sellerId: 'seller-1',
          imageUrl: null,
        }),
      });
    });
  });

  describe('ProductService.update', () => {
    beforeEach(() => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'prod-1',
        sku: 'SP01',
        name: 'Áo thun',
        price: 150000,
        stock: 10,
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/old.webp',
        sellerId: 'seller-1',
      });
      mockPrisma.product.update.mockImplementation(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Record<string, unknown>;
        }) => ({
          id: where.id,
          ...data,
        }),
      );
    });

    it('nên lưu imageUrl đã trim khi cập nhật URL hợp lệ', async () => {
      const nextUrl =
        'https://res.cloudinary.com/demo/image/upload/v2/updated.webp';

      await service.update('prod-1', 'seller-1', {
        imageUrl: `  ${nextUrl}  `,
      });

      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { imageUrl: nextUrl },
      });
    });

    it('nên chuyển imageUrl rỗng ("") thành null khi xóa ảnh sản phẩm', async () => {
      await service.update('prod-1', 'seller-1', {
        imageUrl: '',
      });

      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { imageUrl: null },
      });
    });

    it('nên chuyển imageUrl chỉ có khoảng trắng ("   ") thành null khi xóa ảnh sản phẩm', async () => {
      await service.update('prod-1', 'seller-1', {
        imageUrl: '   ',
      });

      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { imageUrl: null },
      });
    });

    it('nên bỏ qua trường imageUrl trong payload update khi dto.imageUrl là undefined', async () => {
      await service.update('prod-1', 'seller-1', {
        name: 'Áo thun bản mới',
      });

      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { name: 'Áo thun bản mới' },
      });
      const callArg = mockPrisma.product.update.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect('imageUrl' in callArg.data).toBe(false);
    });

    it('nên không đưa khóa imageUrl vào payload update ngay cả khi object truyền imageUrl: undefined', async () => {
      await service.update('prod-1', 'seller-1', {
        price: 199000,
        imageUrl: undefined,
      });

      const callArg = mockPrisma.product.update.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect(callArg.data).toEqual({ price: 199000 });
      expect('imageUrl' in callArg.data).toBe(false);
    });
  });

  describe('CreateProductDto validation (imageUrl)', () => {
    const basePayload = {
      sku: 'SP01',
      name: 'Sản phẩm mẫu',
      price: 100000,
      stock: 10,
    };

    it.each([
      ['chuỗi rỗng', ''],
      ['chỉ có khoảng trắng', '   '],
      [
        'URL HTTPS Cloudinary',
        'https://res.cloudinary.com/demo/image/upload/v1/sample.webp',
      ],
      ['URL HTTP hợp lệ', 'http://example.com/a.jpg'],
      ['URL hợp lệ có khoảng trắng ở hai đầu', '  https://example.com/a.png  '],
    ])('nên chấp nhận imageUrl hợp lệ: %s', async (_label, imageUrl) => {
      const dto = plainToInstance(CreateProductDto, {
        ...basePayload,
        imageUrl,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.imageUrl).toBe(imageUrl.trim());
    });

    it.each([
      ['javascript scheme', 'javascript:alert(1)'],
      ['data URI', 'data:image/svg+xml;base64,PHN2Zz4='],
      ['ftp protocol', 'ftp://example.com/a.jpg'],
      ['không phải URL', 'not-a-url'],
      ['URL chứa khoảng trắng bên trong', 'https://example.com/a b.jpg'],
    ])('nên từ chối imageUrl không hợp lệ: %s', async (_label, imageUrl) => {
      const dto = plainToInstance(CreateProductDto, {
        ...basePayload,
        imageUrl,
      });

      const errors = await validate(dto);
      const imageUrlError = errors.find((e) => e.property === 'imageUrl');
      expect(imageUrlError).toBeDefined();
      expect(imageUrlError?.constraints?.matches).toBe(
        'Đường dẫn ảnh phải là URL http(s) hợp lệ hoặc để trống',
      );
    });

    it('nên từ chối imageUrl vượt quá 2048 ký tự', async () => {
      const tooLongUrl = `https://example.com/${'a'.repeat(2029)}`;
      expect(tooLongUrl.length).toBe(2049);

      const dto = plainToInstance(CreateProductDto, {
        ...basePayload,
        imageUrl: tooLongUrl,
      });

      const errors = await validate(dto);
      const imageUrlError = errors.find((e) => e.property === 'imageUrl');
      expect(imageUrlError).toBeDefined();
      expect(imageUrlError?.constraints?.maxLength).toBe(
        'Đường dẫn ảnh không được vượt quá 2048 ký tự',
      );
    });

    it('nên từ chối imageUrl không phải chuỗi văn bản', async () => {
      const dto = plainToInstance(CreateProductDto, {
        ...basePayload,
        imageUrl: 12345 as unknown as string,
      });

      const errors = await validate(dto);
      const imageUrlError = errors.find((e) => e.property === 'imageUrl');
      expect(imageUrlError).toBeDefined();
      expect(imageUrlError?.constraints?.isString).toBe(
        'Đường dẫn ảnh phải là chuỗi văn bản',
      );
    });
  });

  describe('UpdateProductDto validation (imageUrl)', () => {
    it.each([
      ['chuỗi rỗng', ''],
      ['chỉ có khoảng trắng', '   '],
      [
        'URL HTTPS Cloudinary',
        'https://res.cloudinary.com/demo/image/upload/v1/sample.webp',
      ],
      ['URL HTTP hợp lệ', 'http://example.com/a.jpg'],
      ['URL hợp lệ có khoảng trắng ở hai đầu', '  https://example.com/a.png  '],
    ])('nên chấp nhận imageUrl hợp lệ: %s', async (_label, imageUrl) => {
      const dto = plainToInstance(UpdateProductDto, { imageUrl });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.imageUrl).toBe(imageUrl.trim());
    });

    it.each([
      ['javascript scheme', 'javascript:alert(1)'],
      ['data URI', 'data:image/svg+xml;base64,PHN2Zz4='],
      ['ftp protocol', 'ftp://example.com/a.jpg'],
      ['không phải URL', 'not-a-url'],
      ['URL chứa khoảng trắng bên trong', 'https://example.com/a b.jpg'],
    ])('nên từ chối imageUrl không hợp lệ: %s', async (_label, imageUrl) => {
      const dto = plainToInstance(UpdateProductDto, { imageUrl });

      const errors = await validate(dto);
      const imageUrlError = errors.find((e) => e.property === 'imageUrl');
      expect(imageUrlError).toBeDefined();
      expect(imageUrlError?.constraints?.matches).toBe(
        'Đường dẫn ảnh phải là URL http(s) hợp lệ hoặc để trống',
      );
    });

    it('nên từ chối imageUrl vượt quá 2048 ký tự', async () => {
      const tooLongUrl = `https://example.com/${'a'.repeat(2029)}`;
      expect(tooLongUrl.length).toBe(2049);

      const dto = plainToInstance(UpdateProductDto, { imageUrl: tooLongUrl });

      const errors = await validate(dto);
      const imageUrlError = errors.find((e) => e.property === 'imageUrl');
      expect(imageUrlError).toBeDefined();
      expect(imageUrlError?.constraints?.maxLength).toBe(
        'Đường dẫn ảnh không được vượt quá 2048 ký tự',
      );
    });

    it('nên từ chối imageUrl không phải chuỗi văn bản', async () => {
      const dto = plainToInstance(UpdateProductDto, {
        imageUrl: 12345 as unknown as string,
      });

      const errors = await validate(dto);
      const imageUrlError = errors.find((e) => e.property === 'imageUrl');
      expect(imageUrlError).toBeDefined();
      expect(imageUrlError?.constraints?.isString).toBe(
        'Đường dẫn ảnh phải là chuỗi văn bản',
      );
    });
  });
});
