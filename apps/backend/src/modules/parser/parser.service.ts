import { Injectable } from '@nestjs/common';
import { AhoCorasick } from '../../core/aho-corasick/aho-corasick';

export interface ParseResult {
    phone: string | null;
    skus: string[];
    isOrder: boolean;
    rawComment: string;
}

@Injectable()
export class ParserService {
    /**
     * Regex bóc tách Số Điện Thoại Việt Nam
     * (hỗ trợ 09x, 03x, 07x, 08x, 05x, dấu chấm, khoảng trắng, +84)
     */
    private readonly phoneRegex = /(?:\+84|84|0)(?:[3|5|7|8|9])(?:[0-9]{8}|[0-9.\s]{9,11})/;

    /**
     * Bóc tách và chuẩn hóa Số điện thoại về 10 chữ số chuẩn (dạng 0xxxxxxxxx)
     */
    extractPhoneNumber(text: string): string | null {
        if (!text) return null;
        const match = text.match(this.phoneRegex);
        if (!match) return null;

        let cleaned = match[0].replace(/[\s.]/g, '');
        if (cleaned.startsWith('+84')) {
            cleaned = '0' + cleaned.slice(3);
        } else if (cleaned.startsWith('84') && cleaned.length === 11) {
            cleaned = '0' + cleaned.slice(2);
        }

        return cleaned.length === 10 ? cleaned : null;
    }

    /**
     * Bóc tách các mã SKU từ comment bằng thuật toán Aho-Corasick (< 1ms)
     */
    extractSkus(text: string, keywords: string[]): string[] {
        if (!text || !keywords || keywords.length === 0) return [];
        const aho = new AhoCorasick(keywords);
        return aho.search(text);
    }

    /**
     * Phân tích cú pháp comment đầy đủ:
     * Trả về isOrder = true khi có cả SĐT và ít nhất 1 mã SKU hợp lệ
     */
    parseComment(text: string, shopSkus: string[]): ParseResult {
        const phone = this.extractPhoneNumber(text);
        const skus = this.extractSkus(text, shopSkus);
        const isOrder = Boolean(phone && skus.length > 0);

        return {
            phone,
            skus,
            isOrder,
            rawComment: text,
        };
    }
}
