import { NotFoundException } from '@nestjs/common';
import { ChatMode, MessageSource, Role } from '@prisma/client';
import { validateSync } from 'class-validator';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { DirectMessageService } from './direct-message.service';
import { DirectMessageController } from './direct-message.controller';
import { UpdateConversationModeDto } from './dto/update-conversation-mode.dto';

describe('DirectMessageService AI history', () => {
  const prisma = {
    user: { findFirst: jest.fn() },
    directMessage: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    conversation: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      updateMany: jest.fn(),
    },
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
    prisma.conversation.findUnique.mockResolvedValue({
      mode: ChatMode.HUMAN,
      version: 2,
    });
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

  it('returns default AI without creating data when Buyer opens a new conversation', async () => {
    prisma.conversation.findUnique.mockResolvedValueOnce(null);
    expect(await service.getBuyerConversationMode('buyer-a', 'shop-a')).toEqual(
      {
        mode: ChatMode.AI,
        version: 0,
      },
    );
    expect(prisma.conversation.findUnique).toHaveBeenCalledWith({
      where: { buyerId_sellerId: { buyerId: 'buyer-a', sellerId: 'shop-a' } },
      select: { mode: true, version: true },
    });
    expect(prisma.conversation.upsert).not.toHaveBeenCalled();
  });

  it('rejects mode lookup for a missing Shop', async () => {
    prisma.user.findFirst.mockResolvedValueOnce(null);
    await expect(
      service.getBuyerConversationMode('buyer-a', 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.conversation.findUnique).not.toHaveBeenCalled();
  });

  it('returns stored mode to the Seller only after checking the exact pair', async () => {
    expect(
      await service.getSellerConversationMode('shop-a', 'buyer-a'),
    ).toEqual({ mode: ChatMode.HUMAN, version: 2 });
    expect(prisma.directMessage.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          { senderId: 'shop-a', receiverId: 'buyer-a' },
          { senderId: 'buyer-a', receiverId: 'shop-a' },
        ],
      },
      select: { id: true },
    });
  });

  it.each([ChatMode.AI, ChatMode.HUMAN])(
    'changes mode to %s and invalidates old AI responses without sending messages',
    async (mode) => {
      await service.updateSellerConversationMode('shop-a', 'buyer-a', mode);
      expect(prisma.conversation.upsert).toHaveBeenCalledWith({
        where: { buyerId_sellerId: { buyerId: 'buyer-a', sellerId: 'shop-a' } },
        create: { buyerId: 'buyer-a', sellerId: 'shop-a', mode },
        update: { mode, version: { increment: 1 } },
        select: { mode: true, version: true },
      });
      expect(prisma.directMessage.create).not.toHaveBeenCalled();
      expect(ai.generateReply).not.toHaveBeenCalled();
    },
  );

  it('rejects Seller mode read and update for a Buyer with no conversation in this Shop', async () => {
    prisma.directMessage.findFirst.mockResolvedValue(null);
    await expect(
      service.getSellerConversationMode('other-shop', 'buyer-a'),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.updateSellerConversationMode(
        'other-shop',
        'buyer-a',
        ChatMode.HUMAN,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.conversation.findUnique).not.toHaveBeenCalled();
    expect(prisma.conversation.upsert).not.toHaveBeenCalled();
  });

  it('rejects a missing Buyer before changing mode', async () => {
    prisma.user.findFirst.mockResolvedValueOnce(null);
    await expect(
      service.updateSellerConversationMode('shop-a', 'missing', ChatMode.AI),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.conversation.upsert).not.toHaveBeenCalled();
  });

  it.each(['UNKNOWN', '', undefined, null])(
    'rejects invalid mode %s in the DTO',
    (mode) => {
      const dto = Object.assign(new UpdateConversationModeDto(), { mode });
      expect(validateSync(dto).length).toBeGreaterThan(0);
    },
  );

  it('restricts the mode update endpoint to Seller and the Buyer read endpoint to Buyer', () => {
    expect(
      Reflect.getMetadata(
        'roles',
        DirectMessageController.prototype.updateSellerConversationMode,
      ),
    ).toEqual([Role.SELLER]);
    expect(
      Reflect.getMetadata(
        'roles',
        DirectMessageController.prototype.getBuyerConversationMode,
      ),
    ).toEqual([Role.BUYER]);
  });
});
