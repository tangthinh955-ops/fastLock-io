import { createHash } from 'node:crypto';
import { PrismaService } from '../../core/prisma/prisma.service';
import { EmbeddingService, EMBEDDING_MODEL_KEY } from './embedding.service';
import { ProductRetrievalService } from './product-retrieval.service';

describe('ProductRetrievalService', () => {
  const prisma = {
    product: { findMany: jest.fn(), findFirst: jest.fn() },
    productEmbedding: { upsert: jest.fn() },
  };
  const embedding = { embed: jest.fn() };
  const hash = (name: string, sku: string) =>
    createHash('sha256')
      .update(JSON.stringify([name, sku]))
      .digest('hex');
  const makeProduct = (id = 'p-a', sku = 'SP01', name = 'Áo sơ mi nam') => ({
    id,
    sku,
    name,
    sellerId: 'shop-a',
    price: 100000,
    stock: 5,
    imageUrl: null,
    createdAt: new Date(),
    aiEmbedding: {
      productId: id,
      embedding: [1, 0],
      embeddingModel: EMBEDDING_MODEL_KEY,
      embeddingHash: hash(name, sku),
    },
  });
  let rows: ReturnType<typeof makeProduct>[];
  let service: ProductRetrievalService;

  beforeEach(() => {
    jest.resetAllMocks();
    rows = [makeProduct()];
    prisma.product.findMany.mockImplementation(async () =>
      rows.map((row) => ({ ...row })),
    );
    prisma.product.findFirst.mockImplementation(
      async ({ where }) =>
        rows.find(
          (row) => row.id === where.id && row.sellerId === where.sellerId,
        ) ?? null,
    );
    prisma.productEmbedding.upsert.mockImplementation(
      async ({ where, update }) => {
        const row = rows.find((row) => row.id === where.productId);
        if (row) row.aiEmbedding = { productId: row.id, ...update };
        return row?.aiEmbedding;
      },
    );
    embedding.embed.mockResolvedValue([1, 0]);
    service = new ProductRetrievalService(
      prisma as unknown as PrismaService,
      embedding as unknown as EmbeddingService,
    );
  });

  it('matches exact SKU boundaries and skips semantic work for exact lookup', async () => {
    rows.push(makeProduct('p-b', 'SP010'));
    const result = await service.retrieve('shop-a', 'SP01 bao nhiêu tiền?');
    expect(result.sources.map((source) => source.id)).toEqual(['p-a']);
    expect(result.missingSkus).toEqual([]);
    expect(embedding.embed).not.toHaveBeenCalled();
    expect(prisma.productEmbedding.upsert).not.toHaveBeenCalled();
  });

  it('reports unknown SKU instead of replacing it with a similar product', async () => {
    const result = await service.retrieve('shop-a', 'SP99 còn không?');
    expect(result.sources).toEqual([]);
    expect(result.missingSkus).toEqual(['SP99']);
    expect(embedding.embed).not.toHaveBeenCalled();
  });

  it('supports a known SKU with hyphens and an unknown explicitly labelled code', async () => {
    rows = [makeProduct('p-a', 'AO-SOMI')];
    expect(
      (await service.retrieve('shop-a', 'ao-somi giá bao nhiêu?')).sources[0]
        .id,
    ).toBe('p-a');
    expect(
      (await service.retrieve('shop-a', 'SKU: UNKNOWN')).missingSkus,
    ).toEqual(['UNKNOWN']);
  });

  it('does not split SP01 into an extra missing code after the word mã', async () => {
    const result = await service.retrieve('shop-a', 'Mã SP01 giá bao nhiêu?');
    expect(result.missingSkus).toEqual([]);
    expect(result.sources[0].id).toBe('p-a');
  });

  it('does not split or shorten hyphenated SKUs', async () => {
    rows = [makeProduct('p-a', 'AO-SP01'), makeProduct('p-b', 'SP01')];
    const result = await service.retrieve('shop-a', 'AO-SP01 giá bao nhiêu?');
    expect(result.missingSkus).toEqual([]);
    expect(result.sources.map((source) => source.id)).toEqual(['p-a']);
    expect(
      (await service.retrieve('shop-a', 'SP01-RED còn không?')).missingSkus,
    ).toEqual(['SP01-RED']);
    rows.push(makeProduct('p-c', 'SP01-RED'));
    expect(
      (await service.retrieve('shop-a', 'SP01-RED còn không?')).sources.map(
        (source) => source.id,
      ),
    ).toEqual(['p-c']);
  });

  it('rejects unknown alphabetic compound codes without substituting another item', async () => {
    rows = [makeProduct('p-a', 'AO-SOMI')];
    const result = await service.retrieve('shop-a', 'AO-KHAC còn không?');
    expect(result.missingSkus).toEqual(['AO-KHAC']);
    expect(result.sources).toEqual([]);
    expect(embedding.embed).not.toHaveBeenCalled();
  });

  it('treats a natural mixed-case clothing name as semantic text rather than a code', async () => {
    const result = await service.retrieve(
      'shop-a',
      'Shop có áo T-shirt không?',
    );
    expect(result.missingSkus).toEqual([]);
    expect(embedding.embed).toHaveBeenCalledWith(
      'Shop có áo T-shirt không?',
      'query',
    );
  });

  it('asks for a smaller selection rather than calling an existing third SKU missing', async () => {
    rows.push(makeProduct('p-b', 'SP02'), makeProduct('p-c', 'SP03'));
    const result = await service.retrieve('shop-a', 'SP01 SP02 SP03');
    expect(result.missingSkus).toEqual([]);
    expect(result.needsSelection).toBe(true);
  });

  it('uses the latest contextual SKU without mixing an older product', async () => {
    rows.push(makeProduct('p-b', 'SP02'));
    const result = await service.retrieve('shop-a', 'Áo đó còn hàng không?', [
      'Mình hỏi SP02',
      'Mình hỏi SP01',
    ]);
    expect(result.sources.map((source) => source.id)).toEqual(['p-b']);
  });

  it('reads current price and stock without rebuilding the name/SKU vector', async () => {
    prisma.product.findFirst.mockResolvedValue({
      ...rows[0],
      price: 125000,
      stock: 2,
    });
    const result = await service.retrieve(
      'shop-a',
      'Shop có áo sơ mi nam không?',
    );
    expect(result.sources[0].text).toContain('125000');
    expect(result.sources[0].text).toContain('2');
    expect(embedding.embed).toHaveBeenCalledTimes(1);
    expect(embedding.embed.mock.calls[0][1]).toBe('query');
    expect(prisma.productEmbedding.upsert).not.toHaveBeenCalled();
  });

  it('persists missing vectors and reuses them in another service instance', async () => {
    rows[0].aiEmbedding.embedding = [];
    await service.retrieve('shop-a', 'Áo sơ mi nam');
    expect(prisma.productEmbedding.upsert).toHaveBeenCalledTimes(1);
    expect(
      embedding.embed.mock.calls.filter(([, kind]) => kind === 'passage'),
    ).toHaveLength(1);
    service = new ProductRetrievalService(
      prisma as unknown as PrismaService,
      embedding as unknown as EmbeddingService,
    );
    await service.retrieve('shop-a', 'Áo sơ mi nam');
    expect(
      embedding.embed.mock.calls.filter(([, kind]) => kind === 'passage'),
    ).toHaveLength(1);
  });

  it('re-embeds a renamed product but does not embed price or stock', async () => {
    rows[0].name = 'Áo sơ mi trắng nam';
    await service.retrieve('shop-a', 'Áo sơ mi');
    expect(embedding.embed).toHaveBeenCalledWith(
      'Tên sản phẩm: Áo sơ mi trắng nam\nSKU: SP01',
      'passage',
    );
    expect(prisma.productEmbedding.upsert).toHaveBeenCalled();
  });

  it('excludes a deleted or renamed source before returning a snapshot', async () => {
    prisma.product.findFirst.mockResolvedValueOnce(null);
    expect((await service.retrieve('shop-a', 'SP01')).sources).toEqual([]);
    prisma.product.findFirst.mockResolvedValueOnce({
      ...rows[0],
      name: 'Changed',
    });
    expect((await service.retrieve('shop-a', 'Áo sơ mi')).sources).toEqual([]);
  });

  it('never returns another Shop product', async () => {
    rows[0].sellerId = 'shop-b';
    const result = await service.retrieve('shop-a', 'Áo sơ mi');
    expect(result.sources).toEqual([]);
    expect(prisma.product.findMany.mock.calls[0][0].where).toEqual({
      sellerId: 'shop-a',
    });
  });

  it('filters unrelated vectors, caps semantic candidates at two and shares a supplied query vector', async () => {
    rows.push(makeProduct('p-b', 'SP02'), makeProduct('p-c', 'SP03'));
    const query = jest.fn().mockResolvedValue([1, 0]);
    expect(
      (await service.retrieve('shop-a', 'Áo nam', [], query)).sources,
    ).toHaveLength(2);
    expect(query).toHaveBeenCalledTimes(1);
    expect(embedding.embed).not.toHaveBeenCalled();
    query.mockResolvedValue([-1, 0]);
    expect(
      (await service.retrieve('shop-a', 'Thời tiết', [], query)).sources,
    ).toEqual([]);
  });
});
