export interface KbEntry {
  id: string;
  keyword: string;
  answer: string;
  sellerId: string;
}

export type KnowledgeDraft = Pick<KbEntry, 'keyword' | 'answer'>;
