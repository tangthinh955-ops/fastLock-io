import { Injectable } from '@nestjs/common';

export const EMBEDDING_MODEL = 'Xenova/multilingual-e5-small';
// Changing preprocessing/model requires re-embedding persisted knowledge.
export const EMBEDDING_MODEL_KEY = `${EMBEDDING_MODEL}:q8:mean:l2:e5-prefix:v1`;

@Injectable()
export class EmbeddingService {
  private extractor?: Promise<
    (
      text: string,
      options: { pooling: 'mean'; normalize: true },
    ) => Promise<number[]>
  >;
  private queue: Promise<unknown> = Promise.resolve();

  embed(text: string, kind: 'query' | 'passage'): Promise<number[]> {
    // One inference at a time bounds CPU/RAM use and shares the model loader.
    const result = this.queue.then(async () => {
      if (!this.extractor) {
        this.extractor = this.loadExtractor().catch((error) => {
          this.extractor = undefined;
          throw error;
        });
      }
      const extractor = await this.extractor;
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
