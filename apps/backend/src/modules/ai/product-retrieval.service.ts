import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { EmbeddingService, EMBEDDING_MODEL_KEY } from './embedding.service';
import { KnowledgeSource } from './knowledge-retrieval.service';
import {
  cosineSimilarity,
  isValidVector,
  type QueryEmbedding,
} from './vector.utils';

type IndexedProduct = Prisma.ProductGetPayload<{
  include: { aiEmbedding: true };
}>;
export interface ProductSearchResult {
  sources: KnowledgeSource[];
  missingSkus: string[];
  needsSelection?: boolean;
  usedCurrentSku?: boolean;
}

const MAX_PRODUCTS = 2;
// Development-set threshold; short names can still produce close candidates.
const MIN_SIMILARITY = 0.82;
const BACKFILL_BATCH_SIZE = 16;
const TIMEOUT_MS = 30000;

@Injectable()
export class ProductRetrievalService {
  private readonly logger = new Logger(ProductRetrievalService.name);
  private readonly pending = new Map<string, Promise<number[] | null>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly embedding: EmbeddingService,
  ) {}

  private hash(product: IndexedProduct) {
    return createHash('sha256')
      .update(JSON.stringify([product.name, product.sku]))
      .digest('hex');
  }

  private isCurrent(product: IndexedProduct) {
    const stored = product.aiEmbedding;
    return Boolean(
      stored &&
      stored.embeddingModel === EMBEDDING_MODEL_KEY &&
      stored.embeddingHash === this.hash(product) &&
      isValidVector(stored.embedding),
    );
  }

  private skusIn(text: string, products: IndexedProduct[]) {
    const codes = new Set<string>();
    const spans: { start: number; end: number }[] = [];
    const overlaps = (start: number, end: number) =>
      spans.some((span) => start < span.end && end > span.start);
    // Longer catalog codes win; never match SP01 inside AO-SP01 or SP01-RED.
    for (const product of [...products].sort(
      (a, b) => b.sku.length - a.sku.length,
    )) {
      const escaped = product.sku.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (!escaped) continue;
      for (const match of text.matchAll(
        new RegExp(
          `(?<![\\p{L}\\p{N}_-])${escaped}(?![\\p{L}\\p{N}_-])`,
          'giu',
        ),
      )) {
        const start = match.index;
        const end = start + match[0].length;
        if (overlaps(start, end)) continue;
        codes.add(product.sku.toUpperCase());
        spans.push({ start, end });
      }
    }
    // Unlabelled alphabetic codes use uppercase to distinguish them from T-shirt.
    for (const match of text.matchAll(
      /(?<![\p{L}\p{N}_-])[a-z][a-z0-9_-]{0,49}(?![\p{L}\p{N}_-])/giu,
    )) {
      if (
        (/\d/u.test(match[0]) || /^[A-Z]+(?:[-_][A-Z]+)+$/u.test(match[0])) &&
        !overlaps(match.index, match.index + match[0].length)
      )
        codes.add(match[0].toUpperCase());
    }
    for (const match of text.matchAll(
      /(?:\bsku|\bmã(?:\s+sản phẩm\b|\s+sp\b)?)\s*[:#]?\s*([a-z0-9][a-z0-9_-]{0,49})/giu,
    )) {
      const start = match.index + match[0].lastIndexOf(match[1]);
      if (!overlaps(start, start + match[1].length))
        codes.add(match[1].toUpperCase());
    }
    return [...codes];
  }

  private prepare(product: IndexedProduct): Promise<number[] | null> {
    if (this.isCurrent(product))
      return Promise.resolve(product.aiEmbedding!.embedding);
    const hash = this.hash(product);
    const key = `${product.sellerId}:${product.id}:${hash}:${EMBEDDING_MODEL_KEY}`;
    const existing = this.pending.get(key);
    if (existing) return existing;
    const work = (async () => {
      const vector = await this.embedding.embed(
        `Tên sản phẩm: ${product.name}\nSKU: ${product.sku}`,
        'passage',
      );
      if (!isValidVector(vector)) throw new Error('Invalid product vector.');
      const current = await this.prisma.product.findFirst({
        where: { id: product.id, sellerId: product.sellerId },
        include: { aiEmbedding: true },
      });
      if (!current || this.hash(current) !== hash) return null;
      const data = {
        embedding: vector,
        embeddingHash: hash,
        embeddingModel: EMBEDDING_MODEL_KEY,
      };
      try {
        await this.prisma.productEmbedding.upsert({
          where: { productId: product.id },
          create: { productId: product.id, ...data },
          update: data,
        });
      } catch (error) {
        // Product may be deleted after the check; the FK prevents orphan vectors.
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          ['P2003', 'P2025'].includes(error.code)
        )
          return null;
        throw error;
      }
      return vector;
    })().finally(() => this.pending.delete(key));
    this.pending.set(key, work);
    return work;
  }

  async retrieve(
    sellerId: string,
    question: string,
    context: string[] = [],
    queryEmbedding?: QueryEmbedding,
  ): Promise<ProductSearchResult> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        this.search(sellerId, question, context, queryEmbedding),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error('Product retrieval timed out.')),
            TIMEOUT_MS,
          );
          timer.unref?.();
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  private async snapshot(
    product: IndexedProduct,
    score: number,
    semantic: boolean,
  ): Promise<KnowledgeSource | null> {
    const current = await this.prisma.product.findFirst({
      where: { id: product.id, sellerId: product.sellerId },
      include: { aiEmbedding: true },
    });
    if (
      !current ||
      current.sellerId !== product.sellerId ||
      current.sku !== product.sku ||
      (semantic && this.hash(current) !== this.hash(product))
    )
      return null;
    return {
      id: current.id,
      score,
      text: `[SẢN PHẨM ${current.id}]\n${JSON.stringify({ sku: current.sku, name: current.name, priceVnd: current.price, stock: current.stock })}\nGiá/tồn kho là dữ liệu tại thời điểm kiểm tra, chưa giữ hàng hoặc tạo đơn.`,
    };
  }

  private async search(
    sellerId: string,
    question: string,
    context: string[],
    queryEmbedding?: QueryEmbedding,
  ): Promise<ProductSearchResult> {
    const start = Date.now();
    const products = (
      await this.prisma.product.findMany({
        where: { sellerId },
        include: { aiEmbedding: true },
      })
    ).filter((product) => product.sellerId === sellerId);
    // Current message wins; context is supplied newest first, never merged across SKUs.
    let requested = this.skusIn(question, products);
    const usedCurrentSku = requested.length > 0;
    if (!requested.length)
      for (const message of context) {
        requested = this.skusIn(message, products);
        if (requested.length) break;
      }
    const missingSkus = requested.filter(
      (sku) => !products.some((product) => product.sku.toUpperCase() === sku),
    );
    if (missingSkus.length) return { sources: [], missingSkus };
    if (requested.length > MAX_PRODUCTS)
      return { sources: [], missingSkus: [], needsSelection: true };
    if (requested.length) {
      const exact = products
        .filter((product) => requested.includes(product.sku.toUpperCase()))
        .slice(0, MAX_PRODUCTS);
      const snapshots = await Promise.all(
        exact.map((product) => this.snapshot(product, 1, false)),
      );
      const sources = snapshots.filter(
        (source): source is KnowledgeSource => source !== null,
      );
      this.logger.log(
        JSON.stringify({
          event: 'product_retrieval',
          lookup: 'exact_sku',
          sourceIds: sources.map((source) => source.id),
          elapsedMs: Date.now() - start,
        }),
      );
      return {
        sources,
        usedCurrentSku,
        missingSkus: requested.filter(
          (sku) =>
            !exact.some(
              (product) =>
                product.sku.toUpperCase() === sku &&
                sources.some((source) => source.id === product.id),
            ),
        ),
      };
    }
    if (!products.length) return { sources: [], missingSkus: [] };
    const missing = products.filter((product) => !this.isCurrent(product));
    for (const product of missing.slice(0, BACKFILL_BATCH_SIZE)) {
      const vector = await this.prepare(product);
      if (vector)
        product.aiEmbedding = {
          productId: product.id,
          embedding: vector,
          embeddingHash: this.hash(product),
          embeddingModel: EMBEDDING_MODEL_KEY,
        };
    }
    if (missing.length > BACKFILL_BATCH_SIZE)
      throw new Error('Product indexing is in progress. Please retry.');
    const query = await (queryEmbedding
      ? queryEmbedding()
      : this.embedding.embed(
          [question, ...context].join('\n').slice(0, 1800),
          'query',
        ));
    const ranked = products
      .filter((product) => this.isCurrent(product))
      .map((product) => ({
        product,
        score: cosineSimilarity(query, product.aiEmbedding!.embedding),
      }))
      .filter((candidate) => candidate.score >= MIN_SIMILARITY)
      .sort(
        (a, b) => b.score - a.score || a.product.id.localeCompare(b.product.id),
      );
    const sources: KnowledgeSource[] = [];
    for (const candidate of ranked) {
      const source = await this.snapshot(
        candidate.product,
        candidate.score,
        true,
      );
      if (source) sources.push(source);
      if (sources.length === MAX_PRODUCTS) break;
    }
    this.logger.log(
      JSON.stringify({
        event: 'product_retrieval',
        lookup: 'semantic',
        sourceIds: sources.map((source) => source.id),
        scores: sources.map((source) => Number(source.score.toFixed(3))),
        backfilled: Math.min(missing.length, BACKFILL_BATCH_SIZE),
        elapsedMs: Date.now() - start,
      }),
    );
    return { sources, missingSkus: [] };
  }
}
