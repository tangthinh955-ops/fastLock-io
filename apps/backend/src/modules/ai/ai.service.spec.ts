import { Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AiService, type ConversationMessage } from './ai.service';

const mockCreate = jest.fn();
jest.mock('groq-sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  })),
}));

describe('AiService conversation context', () => {
  const findMany = jest.fn();
  let service: AiService;

  beforeEach(() => {
    findMany
      .mockReset()
      .mockResolvedValue([{ keyword: 'SP01', answer: 'Size M: 60–70 kg.' }]);
    mockCreate.mockReset().mockResolvedValue({
      choices: [{ message: { content: '  Shop gợi ý size M.  ' } }],
    });
    service = new AiService({
      kbEntry: { findMany },
    } as unknown as PrismaService);
  });

  const sentMessages = () =>
    mockCreate.mock.calls[0][0].messages as Array<{
      role: string;
      content: string;
    }>;

  it('sends shop knowledge, ordered history and the new question exactly once', async () => {
    const history: ConversationMessage[] = [
      { role: 'user', content: 'Mình hỏi SP01, nặng 65kg.' },
      { role: 'assistant', content: 'Mình thích mặc ôm hay rộng?' },
    ];

    await expect(
      service.generateReply('shop-a', 'Vậy chọn size nào?', history),
    ).resolves.toBe('Shop gợi ý size M.');

    expect(findMany).toHaveBeenCalledWith({ where: { sellerId: 'shop-a' } });
    expect(sentMessages()).toEqual([
      { role: 'system', content: expect.stringContaining('Size M: 60–70 kg.') },
      ...history,
      { role: 'user', content: 'Vậy chọn size nào?' },
    ]);
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
    expect(sentMessages().at(-1)?.content).toBe('Câu mới');
  });

  it('omits an oversized history message without truncating the new question', async () => {
    await service.generateReply('shop-a', 'Câu mới', [
      { role: 'assistant', content: 'a'.repeat(4001) },
    ]);
    expect(sentMessages()).toHaveLength(2);
    expect(sentMessages()[1]).toEqual({ role: 'user', content: 'Câu mới' });
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
});
