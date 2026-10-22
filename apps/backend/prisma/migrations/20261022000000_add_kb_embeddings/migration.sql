-- Add persistent embeddings without deleting or replacing existing knowledge.
ALTER TABLE "KbEntry"
ADD COLUMN "embedding" DOUBLE PRECISION[] NOT NULL DEFAULT ARRAY[]::DOUBLE PRECISION[],
ADD COLUMN "embeddingModel" TEXT,
ADD COLUMN "embeddingHash" TEXT;

CREATE INDEX "KbEntry_sellerId_idx" ON "KbEntry"("sellerId");
