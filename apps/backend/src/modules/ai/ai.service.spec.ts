import { Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AiService, type ConversationMessage } from './ai.service';
import { KnowledgeRetrievalService } from './knowledge-retrieval.service';
import { ProductRetrievalService } from './product-retrieval.service';
import { EmbeddingService } from './embedding.service';

const mockCreate = jest.fn();
jest.mock('groq-sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  })),
}));

describe('AiService conversation context', () => {
  const findMany = jest.fn();
  const create = jest.fn();
  const retrieval = { retrieve: jest.fn(), indexEntry: jest.fn() };
  const products = { retrieve: jest.fn() };
  const embedding = { embed: jest.fn() };
  let service: AiService;

  beforeEach(() => {
    products.retrieve
      .mockReset()
      .mockResolvedValue({ sources: [], missingSkus: [] });
    embedding.embed.mockReset().mockResolvedValue([1, 0]);
    retrieval.retrieve
      .mockReset()
      .mockResolvedValue([
        { id: 'size', text: 'Size M: 60–70 kg.', score: 0.9 },
      ]);
    retrieval.indexEntry.mockReset().mockResolvedValue(undefined);
    create.mockReset().mockResolvedValue({
      id: 'new-kb',
      sellerId: 'shop-a',
      keyword: 'Ship',
      answer: '25000đ',
    });
    findMany
      .mockReset()
      .mockResolvedValue([{ keyword: 'SP01', answer: 'Size M: 60–70 kg.' }]);
    mockCreate.mockReset().mockResolvedValue({
      choices: [{ message: { content: '  Shop gợi ý size M.  ' } }],
    });
    service = new AiService(
      {
        kbEntry: { findMany, create },
      } as unknown as PrismaService,
      retrieval as unknown as KnowledgeRetrievalService,
      products as unknown as ProductRetrievalService,
      embedding as unknown as EmbeddingService,
    );
  });

  const sentMessages = () =>
    mockCreate.mock.calls[0][0].messages as Array<{
      role: string;
      content: string;
    }>;

  it('places fresh Product data after repeated stale answers without deleting history', async () => {
    retrieval.retrieve.mockResolvedValueOnce([]);
    products.retrieve.mockResolvedValueOnce({
      sources: [
        {
          id: 'p-new',
          text: '[SẢN PHẨM p-new] {"sku":"SP04","name":"Áo sơ mi nam","priceVnd":300000,"stock":5}',
          score: 0.9,
        },
      ],
      missingSkus: [],
    });
    const history: ConversationMessage[] = Array.from({ length: 5 }).flatMap(
      () => [
        { role: 'user' as const, content: 'Shop đang bán áo nào?' },
        {
          role: 'assistant' as const,
          content: 'Shop có áo polo SP01 và quần jean SP02.',
        },
      ],
    );
    await service.generateReply('shop-a', 'Shop đang bán áo nào?', history);

    const messages = sentMessages();
    expect(messages.at(-1)).toEqual({
      role: 'user',
      content: expect.stringContaining('"sku":"SP04"'),
    });
    expect(messages.at(-1)?.content).toContain('300000');
    expect(messages.at(-1)?.content).not.toContain('SP01');
    expect(messages.slice(1, -1)).toEqual(history);
    expect(messages[0].content).not.toContain('"sku":"SP04"');
    expect(messages.at(-1)?.content.endsWith('Shop đang bán áo nào?')).toBe(
      true,
    );
  });

  it('sends shop knowledge, ordered history and the new question exactly once', async () => {
    const history: ConversationMessage[] = [
      { role: 'user', content: 'Mình hỏi SP01, nặng 65kg.' },
      { role: 'assistant', content: 'Mình thích mặc ôm hay rộng?' },
    ];

    await expect(
      service.generateReply('shop-a', 'Vậy chọn size nào?', history),
    ).resolves.toBe('Shop gợi ý size M.');

    expect(retrieval.retrieve).toHaveBeenCalledWith(
      'shop-a',
      expect.stringContaining('SP01'),
      expect.any(Function),
    );
    expect(findMany).not.toHaveBeenCalled();
    expect(sentMessages()).toEqual([
      { role: 'system', content: expect.any(String) },
      ...history,
      {
        role: 'user',
        content: expect.stringContaining('Size M: 60–70 kg.'),
      },
    ]);
    expect(sentMessages().at(-1)?.content.endsWith('Vậy chọn size nào?')).toBe(
      true,
    );
    expect(mockCreate.mock.calls[0][0]).toMatchObject({
      reasoning_effort: 'none',
      max_completion_tokens: 200,
    });
  });

  it('supports a first question without history', async () => {
    await service.generateReply('shop-a', 'Shop có bảng size không?');
    expect(sentMessages().map((entry) => entry.role)).toEqual([
      'system',
      'user',
    ]);
  });

  it('retains product context when Buyer answers a height/weight clarification', async () => {
    await service.generateReply('shop-a', 'Mình cao 170cm, nặng 65kg', [
      { role: 'user', content: 'Tư vấn size áo SP01' },
      { role: 'assistant', content: 'Anh/Chị cao và nặng bao nhiêu?' },
    ]);
    expect(retrieval.retrieve).toHaveBeenCalledWith(
      'shop-a',
      expect.stringContaining('SP01'),
      expect.any(Function),
    );
  });

  it('does not add old product context when Buyer explicitly names a new SKU', async () => {
    await service.generateReply('shop-a', 'Còn SP02 size gì?', [
      { role: 'user', content: 'Tư vấn áo SP01' },
    ]);
    expect(retrieval.retrieve).toHaveBeenCalledWith(
      'shop-a',
      'Còn SP02 size gì?',
      expect.any(Function),
    );
  });

  it('searches a newly named clothing item without pinning the previous SKU', async () => {
    await service.generateReply('shop-a', 'Còn áo polo thì sao?', [
      { role: 'user', content: 'Tư vấn áo SP01' },
    ]);
    expect(products.retrieve).toHaveBeenCalledWith(
      'shop-a',
      'Còn áo polo thì sao?',
      [],
      expect.any(Function),
    );
    expect(retrieval.retrieve).toHaveBeenCalledWith(
      'shop-a',
      'Còn áo polo thì sao?',
      expect.any(Function),
    );
  });

  it.each([
    'Vậy áo còn hàng không?',
    'Mình cao 170cm nặng 65kg, thích mặc áo rộng',
  ])('retains product context for the follow-up %s', async (question) => {
    await service.generateReply('shop-a', question, [
      { role: 'user', content: 'Tư vấn SP01' },
    ]);
    expect(products.retrieve).toHaveBeenCalledWith(
      'shop-a',
      question,
      ['Tư vấn SP01'],
      expect.any(Function),
    );
  });

  it('keeps only the newest 10 messages without mutating the supplied history', async () => {
    const history: ConversationMessage[] = Array.from(
      { length: 14 },
      (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Tin ${i}`,
      }),
    );
    const original = history.map((entry) => ({ ...entry }));
    await service.generateReply('shop-a', 'Câu mới', history);
    expect(sentMessages().slice(1, -1)).toEqual(original.slice(-10));
    expect(history).toEqual(original);
  });

  it('keeps recent history within 4000 characters, dropping whole old messages', async () => {
    const history: ConversationMessage[] = [
      { role: 'user', content: 'Tin cũ ngắn' },
      { role: 'assistant', content: 'x'.repeat(1001) },
      { role: 'user', content: 'a'.repeat(2000) },
      { role: 'assistant', content: 'b'.repeat(2000) },
    ];
    await service.generateReply('shop-a', 'Câu mới', history);
    expect(sentMessages().slice(1, -1)).toEqual(history.slice(-2));
    expect(sentMessages().at(-1)?.content.endsWith('Câu mới')).toBe(true);
  });

  it('omits an oversized history message without truncating the new question', async () => {
    await service.generateReply('shop-a', 'Câu mới', [
      { role: 'assistant', content: 'a'.repeat(4001) },
    ]);
    expect(sentMessages()).toHaveLength(2);
    expect(sentMessages().at(-1)?.role).toBe('user');
    expect(sentMessages().at(-1)?.content.endsWith('Câu mới')).toBe(true);
  });

  it('preserves the fallback if Groq rejects the request', async () => {
    const errorLog = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    try {
      mockCreate.mockRejectedValueOnce(new Error('Rate limit'));
      await expect(
        service.generateReply('shop-a', 'Câu mới'),
      ).resolves.toContain('hệ thống tư vấn đang quá tải');
    } finally {
      errorLog.mockRestore();
    }
  });

  it('does not call Groq when retrieval has no relevant knowledge', async () => {
    retrieval.retrieve.mockResolvedValueOnce([]);
    expect(await service.generateReply('shop-a', 'World Cup?')).toContain(
      'chưa có dữ liệu',
    );
    expect(mockCreate).not.toHaveBeenCalled();
    expect(findMany).not.toHaveBeenCalled();
  });

  it('does not send full KB to Groq if embedding fails', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    try {
      retrieval.retrieve.mockRejectedValueOnce(
        new Error('Embedding unavailable'),
      );
      expect(await service.generateReply('shop-a', 'Ship?')).toContain(
        'kiểm tra',
      );
      expect(findMany).not.toHaveBeenCalled();
      expect(mockCreate).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it('allows creating knowledge beyond twenty entries without a count query', async () => {
    await service.addKnowledgeBase('shop-a', 'Ship', '25000đ');
    expect(create).toHaveBeenCalled();
    expect(retrieval.indexEntry).toHaveBeenCalledWith('shop-a', 'new-kb');
  });

  it('keeps saved knowledge when indexing fails', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    try {
      retrieval.indexEntry.mockRejectedValueOnce(new Error('Embedding failed'));
      expect(
        await service.addKnowledgeBase('shop-a', 'Ship', '25000đ'),
      ).toHaveProperty('id', 'new-kb');
    } finally {
      warn.mockRestore();
    }
  });

  it('answers from Product when the Shop has no KB, using live price/stock instructions', async () => {
    retrieval.retrieve.mockResolvedValueOnce([]);
    products.retrieve.mockResolvedValueOnce({
      sources: [
        {
          id: 'p-a',
          text: '[SẢN PHẨM p-a] SP01 giá 125000 VND, tồn kho 2',
          score: 1,
        },
      ],
      missingSkus: [],
    });
    await service.generateReply('shop-a', 'SP01 giá bao nhiêu?');
    const prompt = sentMessages()
      .map((message) => message.content)
      .join('\n');
    expect(prompt).toContain('125000');
    expect(prompt).toContain('priceVnd');
    expect(prompt).toContain('không giữ hàng');
  });

  it('never substitutes another SKU or asks Groq for an explicitly missing code', async () => {
    products.retrieve.mockResolvedValueOnce({
      sources: [],
      missingSkus: ['SP99'],
    });
    expect(await service.generateReply('shop-a', 'SP99 có không?')).toContain(
      'SP99',
    );
    expect(mockCreate).not.toHaveBeenCalled();
    expect(retrieval.retrieve).not.toHaveBeenCalled();
  });

  it('shares one query embedding between Product and KB retrieval', async () => {
    products.retrieve.mockImplementationOnce(
      async (_seller, _question, _context, getVector) => {
        await getVector();
        return { sources: [], missingSkus: [] };
      },
    );
    retrieval.retrieve.mockImplementationOnce(
      async (_seller, _query, getVector) => {
        await getVector();
        return [{ id: 'kb-a', text: 'Phí ship 25000đ', score: 0.9 }];
      },
    );
    await service.generateReply('shop-a', 'Phí ship?');
    expect(embedding.embed).toHaveBeenCalledTimes(1);
    expect(embedding.embed).toHaveBeenCalledWith('Phí ship?', 'query');
  });

  it('keeps both source types under one three-source and 4000-character budget', async () => {
    products.retrieve.mockResolvedValueOnce({
      sources: [
        {
          id: 'product1',
          text: '[SẢN PHẨM product1] ' + 'p'.repeat(1200),
          score: 0.9,
        },
        {
          id: 'product2',
          text: '[SẢN PHẨM product2] ' + 'q'.repeat(1200),
          score: 0.85,
        },
      ],
      missingSkus: [],
    });
    retrieval.retrieve.mockResolvedValueOnce([
      { id: 'knowledge1', text: 'knowledge1 ' + 'k'.repeat(1200), score: 0.9 },
      { id: 'knowledge2', text: 'knowledge2 ' + 'l'.repeat(1200), score: 0.85 },
    ]);
    await service.generateReply('shop-a', 'Tư vấn sản phẩm và phí giao hàng');
    const prompt = sentMessages().at(-1)!.content;
    const context = prompt
      .split('[DỮ LIỆU KIẾN THỨC CỦA SHOP]')[1]
      .split('[HẾT DỮ LIỆU KIẾN THỨC]')[0]
      .trim();
    expect(context).toContain('product1');
    expect(context).toContain('knowledge1');
    expect(context).not.toContain('knowledge2');
    expect(context.length).toBeLessThanOrEqual(4000);
  });

  it('passes follow-up context newest first to Product retrieval', async () => {
    await service.generateReply('shop-a', 'Áo đó còn không?', [
      { role: 'user', content: 'SP01' },
      { role: 'assistant', content: 'Shop có áo SP01' },
      { role: 'user', content: 'Mình chuyển sang SP02' },
    ]);
    expect(products.retrieve).toHaveBeenCalledWith(
      'shop-a',
      'Áo đó còn không?',
      ['Mình chuyển sang SP02', 'SP01'],
      expect.any(Function),
    );
  });

  it('does not carry old KB context into a current hyphenated SKU question', async () => {
    products.retrieve.mockResolvedValueOnce({
      sources: [{ id: 'p-new', text: '[SẢN PHẨM] AO-SOMI', score: 1 }],
      missingSkus: [],
      usedCurrentSku: true,
    });
    await service.generateReply('shop-a', 'Còn AO-SOMI thì sao?', [
      { role: 'user', content: 'SP01' },
    ]);
    expect(retrieval.retrieve).toHaveBeenCalledWith(
      'shop-a',
      'Còn AO-SOMI thì sao?',
      expect.any(Function),
    );
  });
});
