import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

export const EMBEDDING_MODEL = 'Xenova/multilingual-e5-small';
// Changing preprocessing/model requires re-embedding persisted knowledge.
export const EMBEDDING_MODEL_KEY = `${EMBEDDING_MODEL}:q8:mean:l2:e5-prefix:v1`;

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingService.name);
  private extractor?: Promise<
    (
      text: string,
      options: { pooling: 'mean'; normalize: true },
    ) => Promise<number[]>
  >;
  private queue: Promise<unknown> = Promise.resolve();

  onModuleInit() {
    if (process.env.NODE_ENV !== 'test') {
      void this.warmup();
    }
  }

  private ensureExtractor() {
    if (!this.extractor) {
      this.extractor = this.loadExtractor().catch((error) => {
        this.extractor = undefined;
        throw error;
      });
    }
    return this.extractor;
  }

  warmup(): Promise<void> {
    const result = this.queue.then(async () => {
      const extractor = await this.ensureExtractor();
      if (!extractor) throw new Error('Embedding model is not ready.');
    });
    this.queue = result.catch(() => undefined);
    return result.catch((error) => {
      const detail = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Embedding warmup failed (${detail}).`);
    });
  }

  embed(text: string, kind: 'query' | 'passage'): Promise<number[]> {
    // One inference at a time bounds CPU/RAM use and shares the model loader.
    const result = this.queue.then(async () => {
      const extractor = await this.ensureExtractor();
      if (!extractor) throw new Error('Embedding model is not ready.');
      const vector = await extractor(`${kind}: ${text}`, {
        pooling: 'mean',
        normalize: true,
      });
      if (!vector.length || vector.some((value) => !Number.isFinite(value)))
        throw new Error('Embedding model returned an invalid vector.');
      return vector;
    });
    this.queue = result.catch(() => undefined);
    return result;
  }

  private async loadExtractor() {
    const { pipeline } = await import('@huggingface/transformers');
    const extractor = await pipeline('feature-extraction', EMBEDDING_MODEL, {
      dtype: 'q8',
      device: 'cpu',
    });
    return async (
      text: string,
      options: { pooling: 'mean'; normalize: true },
    ) => {
      const output = await extractor(text, options);
      return Array.from(output.data as Float32Array, Number);
    };
  }
}
