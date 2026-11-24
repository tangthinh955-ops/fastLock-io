import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../core/prisma/prisma.service';
import { DirectMessageService } from '../direct-message/direct-message.service';
import { OrderService } from '../order/order.service';
import { ParserService } from '../parser/parser.service';
import { LivestreamCommentProcessor } from './livestream-comment.processor';
import { LivestreamService } from './livestream.service';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('LivestreamCommentProcessor', () => {
  const getStreamById = jest.fn();
  const getSellerSkus = jest.fn();
  const createOrder = jest.fn();
  const findFirstProduct = jest.fn();
  const findUniqueUser = jest.fn();
  const sendOrderMessage = jest.fn();
  const roomEmit = jest.fn();
  const serverTo = jest.fn();
  const clientEmit = jest.fn();

  let parserService: ParserService;
  let processor: LivestreamCommentProcessor;
  let server: Server;
  let client: Pick<Socket, 'emit'>;

  beforeEach(() => {
    getStreamById.mockReset().mockResolvedValue({
      id: 'stream-1',
      sellerId: 'seller-1',
      status: 'LIVE',
    });
    getSellerSkus
      .mockReset()
      .mockResolvedValue(['SP01', 'SP010', 'AO', 'AO THUN']);
    createOrder.mockReset();
    findFirstProduct.mockReset().mockResolvedValue({
      id: 'prod-1',
      sku: 'SP01',
      name: 'Áo thun basic',
      price: 199000,
      stock: 5,
      imageUrl: 'https://cdn.example.com/sp01.jpg',
      sellerId: 'seller-1',
    });
    findUniqueUser.mockReset().mockResolvedValue({
      defaultRecipientName: 'Nguyễn Văn A',
      defaultPhone: '0987654321',
      defaultAddress: '123 Lê Lợi, Q1',
      name: 'Nguyễn Văn A',
    });
    sendOrderMessage.mockReset();
    roomEmit.mockReset();
    serverTo.mockReset().mockReturnValue({ emit: roomEmit });
    clientEmit.mockReset();

    parserService = new ParserService();
    processor = new LivestreamCommentProcessor(
      {
        getStreamById,
        getSellerSkus,
      } as unknown as LivestreamService,
      parserService,
      { createOrder } as unknown as OrderService,
      {
        product: { findFirst: findFirstProduct },
        user: { findUnique: findUniqueUser },
      } as unknown as PrismaService,
      { sendOrderMessage } as unknown as DirectMessageService,
    );

    server = { to: serverTo } as unknown as Server;
    client = { emit: clientEmit };
  });

  it('phát comment_received đã che SĐT + UUID + buyerId và gửi draft_order_ready riêng cho client khi còn hàng', async () => {
    await processor.processComment(
      server,
      {
        livestreamId: 'stream-1',
        buyerId: 'buyer-1',
        buyerName: 'Nguyễn Văn A',
        buyerRole: 'BUYER',
        commentText: 'chốt sp01 0912 345 678 nhé shop',
      },
      client,
    );

    expect(findFirstProduct).toHaveBeenCalledWith({
      where: {
        sellerId: 'seller-1',
        sku: { equals: 'SP01', mode: 'insensitive' },
      },
    });
    expect(findUniqueUser).toHaveBeenCalledWith({
      where: { id: 'buyer-1' },
      select: {
        defaultRecipientName: true,
        defaultPhone: true,
        defaultAddress: true,
        name: true,
      },
    });
    expect(createOrder).not.toHaveBeenCalled();

    expect(roomEmit).toHaveBeenCalledWith(
      'comment_received',
      expect.objectContaining({
        id: expect.stringMatching(UUID_REGEX),
        livestreamId: 'stream-1',
        buyerId: 'buyer-1',
        buyerName: 'Nguyễn Văn A',
        content: 'chốt sp01 0912***678 nhé shop',
        isOrder: true,
        sku: 'SP01',
        orderSuccess: true,
      }),
    );

    // draft_order_ready chỉ gửi riêng cho client, KHÔNG broadcast ra toàn phòng
    expect(clientEmit).toHaveBeenCalledWith('draft_order_ready', {
      buyerId: 'buyer-1',
      livestreamId: 'stream-1',
      product: {
        id: 'prod-1',
        sku: 'SP01',
        name: 'Áo thun basic',
        price: 199000,
        stock: 5,
        imageUrl: 'https://cdn.example.com/sp01.jpg',
      },
      defaultShipping: {
        recipientName: 'Nguyễn Văn A',
        shippingPhone: '0987654321',
        shippingAddress: '123 Lê Lợi, Q1',
      },
    });
    expect(roomEmit).not.toHaveBeenCalledWith(
      'draft_order_ready',
      expect.anything(),
    );
  });

  it('kiểm tra fallback phone hợp lệ khi user chưa lưu defaultPhone và bỏ qua fallback phone sai định dạng', async () => {
    findUniqueUser.mockResolvedValue({
      defaultRecipientName: null,
      defaultPhone: null,
      defaultAddress: null,
      name: 'Buyer Mới',
    });

    // Fallback phone không hợp lệ -> shippingPhone rỗng
    await processor.processComment(
      server,
      {
        livestreamId: 'stream-1',
        buyerId: 'buyer-2',
        buyerName: 'Buyer Mới',
        buyerRole: 'BUYER',
        commentText: 'SP01',
        phone: '12345',
      },
      client,
    );

    expect(clientEmit).toHaveBeenLastCalledWith(
      'draft_order_ready',
      expect.objectContaining({
        defaultShipping: {
          recipientName: 'Buyer Mới',
          shippingPhone: '',
          shippingAddress: '',
        },
      }),
    );

    // Fallback phone hợp lệ -> chuẩn hóa và điền vào shippingPhone
    await processor.processComment(
      server,
      {
        livestreamId: 'stream-1',
        buyerId: 'buyer-2',
        buyerName: 'Buyer Mới',
        buyerRole: 'BUYER',
        commentText: 'SP01',
        phone: '+84 912-345-678',
      },
      client,
    );

    expect(clientEmit).toHaveBeenLastCalledWith(
      'draft_order_ready',
      expect.objectContaining({
        defaultShipping: {
          recipientName: 'Buyer Mới',
          shippingPhone: '0912345678',
          shippingAddress: '',
        },
      }),
    );
  });

  it('che số điện thoại ngay cả ở bình luận thường không chứa SKU', async () => {
    await processor.processComment(
      server,
      {
        livestreamId: 'stream-1',
        buyerId: 'buyer-1',
        buyerName: 'Buyer Test',
        buyerRole: 'BUYER',
        commentText: 'Shop gọi +84 912-345-678 hoặc 0387.654.321 giúp em',
      },
      client,
    );

    expect(clientEmit).not.toHaveBeenCalled();
    expect(roomEmit).toHaveBeenCalledWith(
      'comment_received',
      expect.objectContaining({
        id: expect.stringMatching(UUID_REGEX),
        buyerId: 'buyer-1',
        content: 'Shop gọi 0912***678 hoặc 0387***321 giúp em',
        isOrder: false,
      }),
    );
  });

  it('ưu tiên khớp SKU dài nhất và kiểm tra ranh giới token (SP010 không khớp nhầm SP01)', async () => {
    findFirstProduct.mockResolvedValueOnce({
      id: 'prod-10',
      sku: 'SP010',
      name: 'Áo khoác denim',
      price: 350000,
      stock: 3,
      imageUrl: null,
      sellerId: 'seller-1',
    });

    await processor.processComment(
      server,
      {
        livestreamId: 'stream-1',
        buyerId: 'buyer-1',
        buyerName: 'Buyer',
        buyerRole: 'BUYER',
        commentText: 'SP010 0912345678',
      },
      client,
    );

    expect(findFirstProduct).toHaveBeenCalledWith({
      where: {
        sellerId: 'seller-1',
        sku: { equals: 'SP010', mode: 'insensitive' },
      },
    });
    expect(clientEmit).toHaveBeenCalledWith(
      'draft_order_ready',
      expect.objectContaining({
        product: expect.objectContaining({ id: 'prod-10', sku: 'SP010' }),
      }),
    );

    // Kiểm tra thêm ranh giới token & ưu tiên khớp dài nhất không chồng lấn trên ParserService
    expect(parserService.extractSkus('xSP01 0912345678', ['SP01'])).toEqual([]);
    expect(parserService.extractSkus('SP01-2 0912345678', ['SP01'])).toEqual(
      [],
    );
    expect(
      parserService.extractSkus('AO THUN 0912345678', ['AO', 'AO THUN']),
    ).toEqual(['AO THUN']);
    expect(parserService.extractPhoneNumber('SP01 09123456789')).toBeNull();
    expect(parserService.extractPhoneNumber('SP01 1230912345678')).toBeNull();
    expect(
      parserService.extractPhoneNumber(null as unknown as string),
    ).toBeNull();
  });

  it('xử lý hết hàng khi product.stock <= 0: phát comment_received outOfStock=true, orderSuccess=false và gửi order_failed riêng cho client', async () => {
    findFirstProduct.mockResolvedValueOnce({
      id: 'prod-1',
      sku: 'SP01',
      name: 'Áo thun basic',
      price: 199000,
      stock: 0,
      imageUrl: null,
      sellerId: 'seller-1',
    });

    await processor.processComment(
      server,
      {
        livestreamId: 'stream-1',
        buyerId: 'buyer-1',
        buyerName: 'Buyer',
        buyerRole: 'BUYER',
        commentText: 'SP01 0912 345 678',
      },
      client,
    );

    expect(roomEmit).toHaveBeenCalledWith(
      'comment_received',
      expect.objectContaining({
        id: expect.stringMatching(UUID_REGEX),
        livestreamId: 'stream-1',
        buyerId: 'buyer-1',
        content: 'SP01 0912***678',
        isOrder: true,
        sku: 'SP01',
        outOfStock: true,
        orderSuccess: false,
      }),
    );
    expect(clientEmit).toHaveBeenCalledWith('order_failed', {
      buyerId: 'buyer-1',
      sku: 'SP01',
      reason: 'OUT_OF_STOCK',
      message: 'Rất tiếc! Sản phẩm Áo thun basic (SKU: SP01) hiện đã hết hàng.',
    });
    expect(roomEmit).not.toHaveBeenCalledWith(
      'order_failed',
      expect.anything(),
    );
    expect(clientEmit).not.toHaveBeenCalledWith(
      'draft_order_ready',
      expect.anything(),
    );
  });

  it('chặn luồng draft_order_ready khi buyerRole là SELLER hoặc ADMIN', async () => {
    for (const role of ['SELLER', 'ADMIN']) {
      roomEmit.mockClear();
      clientEmit.mockClear();
      findFirstProduct.mockClear();

      await processor.processComment(
        server,
        {
          livestreamId: 'stream-1',
          buyerId: 'staff-1',
          buyerName: 'Chủ Shop',
          buyerRole: role,
          commentText: 'SP01 0912345678',
        },
        client,
      );

      expect(findFirstProduct).not.toHaveBeenCalled();
      expect(clientEmit).not.toHaveBeenCalled();
      expect(roomEmit).toHaveBeenCalledWith(
        'comment_received',
        expect.objectContaining({
          id: expect.stringMatching(UUID_REGEX),
          buyerId: 'staff-1',
          content: 'SP01 0912***678',
          isOrder: false,
        }),
      );
    }
  });

  it('gửi comment_error riêng cho client hoặc fallback về phòng khi phiên livestream đã kết thúc', async () => {
    getStreamById.mockResolvedValueOnce({
      id: 'stream-1',
      sellerId: 'seller-1',
      status: 'ENDED',
    });

    await processor.processComment(
      server,
      {
        livestreamId: 'stream-1',
        buyerId: 'buyer-1',
        buyerName: 'Buyer',
        buyerRole: 'BUYER',
        commentText: 'SP01 0912345678',
      },
      client,
    );

    expect(clientEmit).toHaveBeenCalledWith('comment_error', {
      message: 'Phiên livestream đã kết thúc.',
    });
    expect(roomEmit).not.toHaveBeenCalled();

    // Không có client -> fallback server.to(livestreamId)
    getStreamById.mockResolvedValueOnce({
      id: 'stream-1',
      sellerId: 'seller-1',
      status: 'ENDED',
    });

    await processor.processComment(server, {
      livestreamId: 'stream-1',
      buyerId: 'buyer-1',
      buyerName: 'Buyer',
      buyerRole: 'BUYER',
      commentText: 'SP01 0912345678',
    });

    expect(roomEmit).toHaveBeenCalledWith('comment_error', {
      message: 'Phiên livestream đã kết thúc.',
    });
  });

  it('fallback sang findUnique khi prisma.product.findFirst không được mock và fallback roomEmit khi không truyền client', async () => {
    const findUniqueProduct = jest.fn().mockResolvedValue({
      id: 'prod-1',
      sku: 'SP01',
      name: 'Áo thun basic',
      price: 199000,
      stock: 2,
      imageUrl: null,
      sellerId: 'seller-1',
    });

    const fallbackProcessor = new LivestreamCommentProcessor(
      { getStreamById, getSellerSkus } as unknown as LivestreamService,
      parserService,
      { createOrder } as unknown as OrderService,
      {
        product: { findUnique: findUniqueProduct },
        user: { findUnique: findUniqueUser },
      } as unknown as PrismaService,
      { sendOrderMessage } as unknown as DirectMessageService,
    );

    await fallbackProcessor.processComment(server, {
      livestreamId: 'stream-1',
      buyerId: 'buyer-1',
      buyerName: 'Buyer',
      buyerRole: 'BUYER',
      commentText: 'SP01',
    });

    expect(findUniqueProduct).toHaveBeenCalledWith({
      where: { sku: 'SP01' },
    });
    expect(roomEmit).toHaveBeenCalledWith(
      'draft_order_ready',
      expect.objectContaining({
        buyerId: 'buyer-1',
        livestreamId: 'stream-1',
      }),
    );
  });
});
