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
     * (hỗ trợ 09x, 03x, 07x, 08x, 05x, dấu chấm, gạch ngang, khoảng trắng, +84)
     */
    private readonly phoneRegex =
        /(?<!\d)(?:\+84|84|0)[\s.-]?[35789](?:[\s.-]?\d){8}(?!\d)/;
    private readonly phoneGlobalRegex =
        /(?<!\d)(?:\+84|84|0)[\s.-]?[35789](?:[\s.-]?\d){8}(?!\d)/g;
    private readonly normalizedPhoneRegex = /^0[35789]\d{8}$/;

    private readonly automatonCache = new Map<string, AhoCorasick>();
    private readonly maxCacheSize = 200;

    private normalizePhoneCandidate(raw: string): string | null {
        let cleaned = raw.replace(/[\s.-]/g, '');
        if (cleaned.startsWith('+84')) {
            cleaned = '0' + cleaned.slice(3);
        } else if (cleaned.startsWith('84') && cleaned.length === 11) {
            cleaned = '0' + cleaned.slice(2);
        }

        return this.normalizedPhoneRegex.test(cleaned) ? cleaned : null;
    }

    private getAutomaton(keywords: string[]): AhoCorasick | null {
        const normalizedSkus = Array.from(
            new Set(
                keywords
                    .filter((k): k is string => typeof k === 'string')
                    .map((k) => k.trim().toUpperCase())
                    .filter((k) => k.length > 0),
            ),
        ).sort();

        if (normalizedSkus.length === 0) return null;

        const cacheKey = normalizedSkus.join('\0');
        const cached = this.automatonCache.get(cacheKey);
        if (cached) {
            this.automatonCache.delete(cacheKey);
            this.automatonCache.set(cacheKey, cached);
            return cached;
        }

        const automaton = new AhoCorasick(normalizedSkus);
        if (this.automatonCache.size >= this.maxCacheSize) {
            const oldestKey = this.automatonCache.keys().next().value;
            if (oldestKey !== undefined) {
                this.automatonCache.delete(oldestKey);
            }
        }
        this.automatonCache.set(cacheKey, automaton);
        return automaton;
    }

    /**
     * Bóc tách và chuẩn hóa Số điện thoại về 10 chữ số chuẩn (dạng 0xxxxxxxxx)
     */
    extractPhoneNumber(text: string): string | null {
        if (typeof text !== 'string' || !text) return null;
        const match = text.match(this.phoneRegex);
        if (!match) return null;

        return this.normalizePhoneCandidate(match[0]);
    }

    /**
     * Ẩn tất cả số điện thoại Việt Nam trong nội dung bình luận trước khi phát công khai
     */
    maskPhoneInText(text: string): string {
        if (typeof text !== 'string' || !text) return '';
        return text.replace(this.phoneGlobalRegex, (match) => {
            const normalized = this.normalizePhoneCandidate(match);
            if (!normalized) return match;
            return `${normalized.slice(0, 4)}***${normalized.slice(-3)}`;
        });
    }

    /**
     * Bóc tách các mã SKU từ comment bằng thuật toán Aho-Corasick (< 1ms)
     */
    extractSkus(text: string, keywords: string[]): string[] {
        if (
            typeof text !== 'string' ||
            !text ||
            !Array.isArray(keywords) ||
            keywords.length === 0
        ) {
            return [];
        }
        const aho = this.getAutomaton(keywords);
        return aho ? aho.search(text) : [];
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
