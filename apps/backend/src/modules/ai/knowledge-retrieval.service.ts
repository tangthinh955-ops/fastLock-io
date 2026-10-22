import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { KbEntry } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { EmbeddingService, EMBEDDING_MODEL_KEY } from './embedding.service';
import {
  cosineSimilarity,
  isValidVector,
  type QueryEmbedding,
} from './vector.utils';

export interface KnowledgeSource {
  id: string;
  text: string;
  score: number;
}

const TOP_K = 3;
const CONTEXT_CHARACTER_LIMIT = 4000;
// Initial value calibrated on a small development set, not a universal threshold.
const MIN_SIMILARITY = 0.82;
const BACKFILL_BATCH_SIZE = 16;
const RETRIEVAL_TIMEOUT_MS = 30000;

@Injectable()
export class KnowledgeRetrievalService {
  private readonly logger = new Logger(KnowledgeRetrievalService.name);
  private readonly pending = new Map<string, Promise<number[] | null>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly embedding: EmbeddingService,
  ) {}

  private contentHash(source: KbEntry) {
    return createHash('sha256')
      .update(JSON.stringify([source.keyword, source.answer]))
      .digest('hex');
  }

  private isCurrent(source: KbEntry) {
    return (
      source.embeddingModel === EMBEDDING_MODEL_KEY &&
      source.embeddingHash === this.contentHash(source) &&
      isValidVector(source.embedding)
    );
  }

  private prepare(source: KbEntry): Promise<number[] | null> {
    if (this.isCurrent(source)) return Promise.resolve(source.embedding);
    const hash = this.contentHash(source);
    const key = `${source.sellerId}:${source.id}:${hash}:${EMBEDDING_MODEL_KEY}`;
    const pending = this.pending.get(key);
    if (pending) return pending;

    const work = (async () => {
      const vector = await this.embedding.embed(
        `${source.keyword}\n${source.answer}`,
        'passage',
      );
      if (!isValidVector(vector)) throw new Error('Invalid knowledge vector.');
      // Do not attach a completed embedding to a deleted/edited knowledge entry.
      const saved = await this.prisma.kbEntry.updateMany({
        where: {
          id: source.id,
          sellerId: source.sellerId,
          keyword: source.keyword,
          answer: source.answer,
        },
        data: {
          embedding: vector,
          embeddingHash: hash,
          embeddingModel: EMBEDDING_MODEL_KEY,
        },
      });
      return saved.count > 0 ? vector : null;
    })().finally(() => this.pending.delete(key));
    this.pending.set(key, work);
    return work;
  }

  private async deadline<T>(work: Promise<T>): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        work,
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error('Knowledge retrieval timed out.')),
            RETRIEVAL_TIMEOUT_MS,
          );
          timer.unref?.();
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async indexEntry(sellerId: string, id: string) {
    const source = await this.prisma.kbEntry.findFirst({
      where: { id, sellerId },
    });
    if (source) await this.deadline(this.prepare(source));
  }

  retrieve(
    sellerId: string,
    question: string,
    queryEmbedding?: QueryEmbedding,
  ): Promise<KnowledgeSource[]> {
    return this.deadline(this.search(sellerId, question, queryEmbedding));
  }

  private async search(
    sellerId: string,
    question: string,
    queryEmbedding?: QueryEmbedding,
  ): Promise<KnowledgeSource[]> {
    const start = Date.now();
    const entries = (
      await this.prisma.kbEntry.findMany({ where: { sellerId } })
    ).filter((source) => source.sellerId === sellerId);
    if (!entries.length) return [];

    const missing = entries.filter((source) => !this.isCurrent(source));
    for (const source of missing.slice(0, BACKFILL_BATCH_SIZE)) {
      const vector = await this.prepare(source);
      if (vector) {
        source.embedding = vector;
        source.embeddingHash = this.contentHash(source);
        source.embeddingModel = EMBEDDING_MODEL_KEY;
      }
    }
    if (missing.length > BACKFILL_BATCH_SIZE)
      throw new Error('Knowledge indexing is in progress. Please retry.');

    const queryVector = await (queryEmbedding
      ? queryEmbedding()
      : this.embedding.embed(question, 'query'));
    const ranked = entries
      .filter((source) => this.isCurrent(source))
      .map((source) => ({
        source,
        score: cosineSimilarity(queryVector, source.embedding),
      }))
      .filter((candidate) => candidate.score >= MIN_SIMILARITY)
      .sort(
        (a, b) => b.score - a.score || a.source.id.localeCompare(b.source.id),
      );

    const selected: KnowledgeSource[] = [];
    let used = 0;
    for (const candidate of ranked) {
      // Read again after inference so deleted/edited sources cannot enter the prompt.
      const current = await this.prisma.kbEntry.findFirst({
        where: { id: candidate.source.id, sellerId },
      });
      if (
        !current ||
        current.sellerId !== sellerId ||
        !this.isCurrent(current) ||
        current.embeddingHash !== candidate.source.embeddingHash
      )
        continue;
      const text = `[Nguồn ${current.id}] ${current.keyword}\n${current.answer}`;
      const cost = text.length + (selected.length ? 1 : 0);
      if (used + cost > CONTEXT_CHARACTER_LIMIT) continue;
      selected.push({ id: current.id, text, score: candidate.score });
      used += cost;
      if (selected.length === TOP_K) break;
    }
    this.logger.log(
      JSON.stringify({
        event: 'rag_retrieval',
        model: EMBEDDING_MODEL_KEY,
        sourceIds: selected.map((source) => source.id),
        scores: selected.map((source) => Number(source.score.toFixed(3))),
        contextCharacters: used,
        backfilled: Math.min(missing.length, BACKFILL_BATCH_SIZE),
        elapsedMs: Date.now() - start,
      }),
    );
    return selected;
  }
}
