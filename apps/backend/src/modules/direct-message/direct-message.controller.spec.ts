import { Test, TestingModule } from '@nestjs/testing';
import { DirectMessageController } from './direct-message.controller';
import { DirectMessageService } from './direct-message.service';

describe('DirectMessageController', () => {
  let controller: DirectMessageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DirectMessageController],
      providers: [
        {
          provide: DirectMessageService,
          useValue: {
            getShops: jest.fn(),
            getSellerCustomers: jest.fn(),
            getSellerConversationMode: jest.fn(),
            updateSellerConversationMode: jest.fn(),
            getSellerConversation: jest.fn(),
            markSellerConversationRead: jest.fn(),
            sendSellerMessage: jest.fn(),
            getBuyerConversationMode: jest.fn(),
            getConversation: jest.fn(),
            markBuyerConversationRead: jest.fn(),
            sendChatMessage: jest.fn(),
            sendOrderMessage: jest.fn(),
            sendVerifiedOrderMessage: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DirectMessageController>(DirectMessageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
