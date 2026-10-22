import { createHash } from 'node:crypto';
import { PrismaService } from '../../core/prisma/prisma.service';
import { EmbeddingService, EMBEDDING_MODEL_KEY } from './embedding.service';
import { KnowledgeRetrievalService } from './knowledge-retrieval.service';

describe('KnowledgeRetrievalService persistent vectors', () => {
  const prisma = {
    kbEntry: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  const embedding = { embed: jest.fn() };
  let service: KnowledgeRetrievalService;
  const hash = (keyword: string, answer: string) =>
    createHash('sha256')
      .update(JSON.stringify([keyword, answer]))
      .digest('hex');
  const source = (
    id = 'shipping',
    keyword = 'Giao hàng',
    answer = 'Phí giao hàng 25000đ.',
  ) => ({
    id,
    sellerId: 'shop-a',
    keyword,
    answer,
    embedding: [1, 0],
    embeddingModel: EMBEDDING_MODEL_KEY,
    embeddingHash: hash(keyword, answer),
  });

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.kbEntry.findMany.mockResolvedValue([source()]);
    prisma.kbEntry.findFirst.mockResolvedValue(source());
    prisma.kbEntry.updateMany.mockResolvedValue({ count: 1 });
    embedding.embed.mockResolvedValue([1, 0]);
    service = new KnowledgeRetrievalService(
      prisma as unknown as PrismaService,
      embedding as unknown as EmbeddingService,
    );
  });

  it('reuses persisted vectors after recreating the service and only embeds the question', async () => {
    await service.retrieve('shop-a', 'Ship bao nhiêu?');
    service = new KnowledgeRetrievalService(
      prisma as unknown as PrismaService,
      embedding as unknown as EmbeddingService,
    );
    const result = await service.retrieve('shop-a', 'Phí vận chuyển?');
    expect(result.map((entry) => entry.id)).toEqual(['shipping']);
    expect(embedding.embed).toHaveBeenCalledTimes(2);
    expect(embedding.embed).toHaveBeenCalledWith('Ship bao nhiêu?', 'query');
    expect(prisma.kbEntry.updateMany).not.toHaveBeenCalled();
    expect(prisma.kbEntry.findMany.mock.calls[0][0].where).toEqual({
      sellerId: 'shop-a',
    });
  });

  it('backfills only missing or stale vectors and persists against the exact source content', async () => {
    const missing = {
      ...source(),
      embedding: [],
      embeddingHash: null,
      embeddingModel: null,
    };
    prisma.kbEntry.findMany.mockResolvedValue([missing]);
    prisma.kbEntry.findFirst.mockResolvedValue(missing);
    await service.retrieve('shop-a', 'Ship?');
    expect(embedding.embed).toHaveBeenCalledWith(
      'Giao hàng\nPhí giao hàng 25000đ.',
      'passage',
    );
    expect(prisma.kbEntry.updateMany).toHaveBeenCalledWith({
      where: {
        id: missing.id,
        sellerId: 'shop-a',
        keyword: missing.keyword,
        answer: missing.answer,
      },
      data: {
        embedding: [1, 0],
        embeddingHash: hash(missing.keyword, missing.answer),
        embeddingModel: EMBEDDING_MODEL_KEY,
      },
    });
  });

  it('does not return a source deleted while its vector was being created', async () => {
    prisma.kbEntry.findMany.mockResolvedValue([{ ...source(), embedding: [] }]);
    prisma.kbEntry.updateMany.mockResolvedValue({ count: 0 });
    prisma.kbEntry.findFirst.mockResolvedValue(null);
    expect(await service.retrieve('shop-a', 'Ship?')).toEqual([]);
  });

  it('rejects unrelated vectors and returns no more than three whole sources', async () => {
    const entries = Array.from({ length: 5 }, (_, i) => source(`source-${i}`));
    entries.push({ ...source('unrelated'), embedding: [-1, 0] });
    prisma.kbEntry.findMany.mockResolvedValue(entries);
    prisma.kbEntry.findFirst.mockImplementation(async ({ where }) =>
      entries.find((entry) => entry.id === where.id),
    );
    const result = await service.retrieve('shop-a', 'Ship?');
    expect(result).toHaveLength(3);
    expect(result.some((entry) => entry.id === 'unrelated')).toBe(false);
    expect(
      result.map((entry) => entry.text).join('\n').length,
    ).toBeLessThanOrEqual(4000);
  });

  it('never uses a source belonging to another Shop, even if it is returned unexpectedly', async () => {
    prisma.kbEntry.findMany.mockResolvedValue([
      { ...source(), sellerId: 'shop-b' },
    ]);
    expect(await service.retrieve('shop-a', 'Ship?')).toEqual([]);
  });

  it('does not invoke embedding for an empty knowledge base', async () => {
    prisma.kbEntry.findMany.mockResolvedValue([]);
    expect(await service.retrieve('shop-a', 'Ship?')).toEqual([]);
    expect(embedding.embed).not.toHaveBeenCalled();
  });

  it('shares in-flight passage embedding across concurrent requests', async () => {
    prisma.kbEntry.findMany.mockImplementation(async () => [
      { ...source(), embedding: [] },
    ]);
    await Promise.all([
      service.retrieve('shop-a', 'Ship?'),
      service.retrieve('shop-a', 'Ship?'),
    ]);
    expect(
      embedding.embed.mock.calls.filter(([, kind]) => kind === 'passage'),
    ).toHaveLength(1);
  });

  it('re-embeds only the entry with a changed model or content hash', async () => {
    prisma.kbEntry.findFirst.mockResolvedValueOnce({
      ...source(),
      embeddingModel: 'old-model',
    });
    await service.indexEntry('shop-a', 'shipping');
    expect(embedding.embed).toHaveBeenCalledTimes(1);
    expect(prisma.kbEntry.updateMany.mock.calls[0][0].data.embeddingModel).toBe(
      EMBEDDING_MODEL_KEY,
    );
  });

  it('does not return a source edited between retrieval and final verification', async () => {
    prisma.kbEntry.findFirst.mockResolvedValueOnce({
      ...source(),
      answer: 'Changed policy',
    });
    expect(await service.retrieve('shop-a', 'Ship?')).toEqual([]);
  });

  it('skips oversized legacy content instead of cutting a source mid-rule', async () => {
    const oversized = source('long', 'Long policy', 'x'.repeat(4100));
    prisma.kbEntry.findMany.mockResolvedValue([oversized]);
    prisma.kbEntry.findFirst.mockResolvedValue(oversized);
    expect(await service.retrieve('shop-a', 'Ship?')).toEqual([]);
  });

  it('backfills in bounded batches instead of embedding an unlimited import in one request', async () => {
    prisma.kbEntry.findMany.mockResolvedValue(
      Array.from({ length: 21 }, (_, i) => ({
        ...source(`old-${i}`),
        embedding: [],
      })),
    );
    await expect(service.retrieve('shop-a', 'Ship?')).rejects.toThrow(
      'indexing is in progress',
    );
    expect(
      embedding.embed.mock.calls.filter(([, kind]) => kind === 'passage'),
    ).toHaveLength(16);
  });
});
