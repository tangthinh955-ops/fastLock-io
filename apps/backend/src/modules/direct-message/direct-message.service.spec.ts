import { NotFoundException } from '@nestjs/common';
import { ChatMode, MessageSource } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { DirectMessageService } from './direct-message.service';

describe('DirectMessageService AI history', () => {
  const prisma = {
    user: { findFirst: jest.fn() },
    directMessage: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    conversation: { upsert: jest.fn(), updateMany: jest.fn() },
    $transaction: jest.fn(),
  };
  const ai = { generateReply: jest.fn() };
  let service: DirectMessageService;

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.user.findFirst.mockResolvedValue({ id: 'shop-a' });
    prisma.directMessage.findMany.mockResolvedValue([]);
    prisma.directMessage.findFirst.mockResolvedValue({
      id: 'existing-message',
    });
    prisma.directMessage.create.mockImplementation(async ({ data }) => data);
    prisma.conversation.upsert.mockResolvedValue({
      id: 'conversation-a',
      mode: ChatMode.AI,
      version: 1,
    });
    prisma.conversation.updateMany.mockResolvedValue({ count: 1 });
    prisma.$transaction.mockImplementation(
      async (callback: (tx: typeof prisma) => Promise<unknown>) =>
        callback(prisma),
    );
    ai.generateReply.mockResolvedValue('Shop gợi ý size M.');
    service = new DirectMessageService(
      prisma as unknown as PrismaService,
      ai as unknown as AiService,
    );
  });

  it.each([
    ['buyer-a', 'shop-a'],
    ['buyer-a', 'shop-b'],
    ['buyer-b', 'shop-a'],
  ])(
    'scopes history to %s and %s, excluding QR messages',
    async (buyerId, sellerId) => {
      await service.sendChatMessage(buyerId, sellerId, 'Vậy size nào?');

      // Kiểm tra toàn bộ điều kiện để tránh lấy nhầm hội thoại hoặc tin VietQR.
      expect(prisma.directMessage.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { senderId: buyerId, receiverId: sellerId },
            { senderId: sellerId, receiverId: buyerId },
          ],
          qrUrl: null,
          source: { not: MessageSource.SYSTEM },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 10,
        select: { senderId: true, content: true },
      });
      expect(ai.generateReply).toHaveBeenCalledWith(
        sellerId,
        'Vậy size nào?',
        [],
      );
      expect(prisma.conversation.upsert).toHaveBeenCalledWith({
        where: { buyerId_sellerId: { buyerId, sellerId } },
        create: { buyerId, sellerId },
        update: { buyerId },
      });
    },
  );

  it('reads history before saving, restores chronological roles and saves both new messages', async () => {
    prisma.directMessage.findMany.mockResolvedValue([
      { senderId: 'shop-a', content: 'Shop có bảng size SP01.' },
      { senderId: 'buyer-a', content: 'SP01, mình nặng 65kg.' },
    ]);
    const result = await service.sendChatMessage(
      'buyer-a',
      'shop-a',
      'Vậy size nào?',
    );

    expect(
      prisma.directMessage.findMany.mock.invocationCallOrder[0],
    ).toBeLessThan(prisma.directMessage.create.mock.invocationCallOrder[0]);
    expect(ai.generateReply).toHaveBeenCalledWith('shop-a', 'Vậy size nào?', [
      { role: 'user', content: 'SP01, mình nặng 65kg.' },
      { role: 'assistant', content: 'Shop có bảng size SP01.' },
    ]);
    expect(prisma.directMessage.create).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      buyerMessage: {
        senderId: 'buyer-a',
        receiverId: 'shop-a',
        content: 'Vậy size nào?',
        source: MessageSource.BUYER,
      },
      aiMessage: {
        senderId: 'shop-a',
        receiverId: 'buyer-a',
        content: 'Shop gợi ý size M.',
        source: MessageSource.AI,
        isRead: true,
      },
    });
  });

  it('rejects a missing seller before reading history or storing messages', async () => {
    prisma.user.findFirst.mockResolvedValueOnce(null);
    await expect(
      service.sendChatMessage('buyer-a', 'missing-shop', 'Câu mới'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.directMessage.findMany).not.toHaveBeenCalled();
    expect(prisma.directMessage.create).not.toHaveBeenCalled();
    expect(ai.generateReply).not.toHaveBeenCalled();
    expect(prisma.conversation.upsert).not.toHaveBeenCalled();
  });

  it('keeps Buyer messages but skips Groq and history in HUMAN mode', async () => {
    prisma.conversation.upsert.mockResolvedValueOnce({
      id: 'conversation-a',
      mode: ChatMode.HUMAN,
      version: 2,
    });

    const result = await service.sendChatMessage(
      'buyer-a',
      'shop-a',
      'Cảm ơn Shop',
    );

    expect(result.aiMessage).toBeNull();
    expect(result.buyerMessage.source).toBe(MessageSource.BUYER);
    expect(prisma.directMessage.create).toHaveBeenCalledTimes(1);
    expect(prisma.directMessage.findMany).not.toHaveBeenCalled();
    expect(ai.generateReply).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('discards a pending AI reply when the mode or version changed', async () => {
    prisma.conversation.updateMany.mockResolvedValueOnce({ count: 0 });

    const result = await service.sendChatMessage(
      'buyer-a',
      'shop-a',
      'Size nào?',
    );

    expect(ai.generateReply).toHaveBeenCalledTimes(1);
    expect(result.aiMessage).toBeNull();
    expect(prisma.directMessage.create).toHaveBeenCalledTimes(1);
    expect(prisma.conversation.updateMany).toHaveBeenCalledWith({
      where: { id: 'conversation-a', mode: ChatMode.AI, version: 1 },
      data: { mode: ChatMode.AI },
    });
  });

  it('saves an AI reply only inside the transaction after the conditional update', async () => {
    await service.sendChatMessage('buyer-a', 'shop-a', 'Size nào?');

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(
      prisma.conversation.updateMany.mock.invocationCallOrder[0],
    ).toBeLessThan(prisma.directMessage.create.mock.invocationCallOrder[1]);
  });

  it('takes over the exact Buyer–Seller pair and saves the Seller reply in one transaction', async () => {
    const result = await service.sendSellerMessage(
      'shop-a',
      'buyer-a',
      'Shop hỗ trợ nhé',
    );

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.conversation.upsert).toHaveBeenCalledWith({
      where: { buyerId_sellerId: { buyerId: 'buyer-a', sellerId: 'shop-a' } },
      create: { buyerId: 'buyer-a', sellerId: 'shop-a', mode: ChatMode.HUMAN },
      update: { mode: ChatMode.HUMAN, version: { increment: 1 } },
    });
    expect(prisma.conversation.upsert.mock.invocationCallOrder[0]).toBeLessThan(
      prisma.directMessage.create.mock.invocationCallOrder[0],
    );
    expect(result.source).toBe(MessageSource.SELLER);
    expect(ai.generateReply).not.toHaveBeenCalled();
  });

  it('does not take over when the Seller has no existing conversation with that Buyer', async () => {
    prisma.directMessage.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.sendSellerMessage('shop-a', 'buyer-a', 'Xin chào'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.conversation.upsert).not.toHaveBeenCalled();
    expect(prisma.directMessage.create).not.toHaveBeenCalled();
  });
});
