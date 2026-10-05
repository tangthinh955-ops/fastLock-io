import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { DirectMessageService } from './direct-message.service';

describe('DirectMessageService AI history', () => {
  const prisma = {
    user: { findFirst: jest.fn() },
    directMessage: { findMany: jest.fn(), create: jest.fn() },
  };
  const ai = { generateReply: jest.fn() };
  let service: DirectMessageService;

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.user.findFirst.mockResolvedValue({ id: 'shop-a' });
    prisma.directMessage.findMany.mockResolvedValue([]);
    prisma.directMessage.create.mockImplementation(async ({ data }) => data);
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
      },
      aiMessage: {
        senderId: 'shop-a',
        receiverId: 'buyer-a',
        content: 'Shop gợi ý size M.',
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
  });
});
