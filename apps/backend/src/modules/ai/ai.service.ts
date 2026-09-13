import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import Groq from 'groq-sdk';

@Injectable()
export class AiService {
  private groq: Groq;
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly prisma: PrismaService) {
    // Khởi tạo Groq Client bằng API Key lấy từ file .env
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY || '',
    });
  }

  /**
   * Hàm này đóng vai trò như một "Nhân viên Tư vấn ảo"
   * @param sellerId ID của chủ shop (để lấy đúng bảng size/chính sách của shop đó)
   * @param customerMessage Câu hỏi của khách hàng trên Livestream
   */
  async generateReply(
    sellerId: string,
    customerMessage: string,
  ): Promise<string> {
    try {
      // 1. Kéo toàn bộ "Sách giáo khoa" (Knowledge Base) của chủ shop này từ DB lên
      const knowledgeBases = await this.prisma.kbEntry.findMany({
        where: { sellerId },
      });

      // 2. Chế biến "Sách giáo khoa" thành 1 đoạn văn bản để nhét vào não AI
      let shopKnowledge = '';
      if (knowledgeBases.length > 0) {
        shopKnowledge = knowledgeBases
          .map(
            (kb) => `- Câu hỏi/Từ khóa: ${kb.keyword} => Trả lời: ${kb.answer}`,
          )
          .join('\n');
      } else {
        shopKnowledge =
          'Shop hiện tại chưa có thông tin quy định nào đặc biệt.';
      }

      // 3. Xây dựng System Prompt (Dạy AI cách xưng hô và làm việc)
      const systemPrompt = `
      Bạn là một nhân viên chốt đơn và chăm sóc khách hàng cực kỳ duyên dáng, nhiệt tình trên Livestream bán quần áo.
      Quy tắc xưng hô: Xưng là "Shop" hoặc "Em", gọi khách là "Anh/Chị","Mình".
      Nhiệm vụ: Trả lời ngắn gọn trong tối đa 2-3 câu, đánh đúng trọng tâm câu hỏi của khách, ngôn từ tự nhiên, có thả biểu tượng cảm xúc (emoji).
      Tuyệt đối KHÔNG BỊA ĐẶT thông tin, chỉ dựa vào Dữ Liệu Kiến Thức của Shop dưới đây để tư vấn:
      
      [DỮ LIỆU KIẾN THỨC BẮT BUỘC TUÂN THEO]
      ${shopKnowledge}
      [HẾT DỮ LIỆU KIẾN THỨC]

      Nếu khách hỏi ngoài lề hoặc không có trong dữ liệu, hãy khéo léo nói: "Dạ câu hỏi này bên em chưa có thông tin chính xác, anh/chị đợi chút em hỏi lại quản lý kho rồi báo mình nha ^^".
      `;

      // 4. Gọi Qwen qua Groq (Siêu tốc độ)
      const chatCompletion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: customerMessage },
        ],
        model: 'qwen/qwen3.6-27b', // Khôi phục lại Qwen theo ý bạn
        temperature: 0.7,
        reasoning_effort: 'none',
        max_completion_tokens: 200,
      });

      const rawReply =
        chatCompletion.choices[0]?.message?.content ||
        'Dạ shop bị lỗi mạng xíu, tình yêu nhắn lại giúp em nha!';

      let cleanReply = rawReply.trim();

      // Dùng câu dự phòng nếu Groq không trả về nội dung.
      if (!cleanReply) {
        cleanReply =
          'Dạ shop đang kiểm tra lại thông tin xíu, tình yêu đợi em tí nha!';
      }

      return cleanReply;
    } catch (error) {
      this.logger.error('Lỗi khi gọi Groq AI:', error);
      return 'Dạ hệ thống tư vấn đang quá tải, tình yêu đợi xíu nha!';
    }
  }

  // --- CRUD CHO AI KNOWLEDGE BASE (SELLER QUẢN LÝ) ---

  async getKnowledgeBases(sellerId: string) {
    return this.prisma.kbEntry.findMany({
      where: { sellerId },
      orderBy: { id: 'desc' },
    });
  }

  async addKnowledgeBase(sellerId: string, keyword: string, answer: string) {
    // 1. Kiểm tra giới hạn 20 quy tắc để tránh tràn Token Groq API
    const currentCount = await this.prisma.kbEntry.count({
      where: { sellerId },
    });

    if (currentCount >= 20) {
      throw new Error('LIMIT_EXCEEDED');
    }

    // 2. Thêm mới
    return this.prisma.kbEntry.create({
      data: {
        sellerId,
        keyword,
        answer,
      },
    });
  }

  async deleteKnowledgeBase(sellerId: string, id: string) {
    // Chỉ cho phép xóa quy tắc của chính seller đó
    return this.prisma.kbEntry.delete({
      where: {
        id,
        sellerId,
      },
    });
  }
}
