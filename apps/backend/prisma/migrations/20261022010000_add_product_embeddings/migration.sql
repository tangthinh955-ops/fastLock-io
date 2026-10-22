-- Add a separate AI index without changing or deleting product business data.
CREATE TABLE "ProductEmbedding" (
  "productId" TEXT NOT NULL,
  "embedding" DOUBLE PRECISION[] NOT NULL DEFAULT ARRAY[]::DOUBLE PRECISION[],
  "embeddingModel" TEXT,
  "embeddingHash" TEXT,
  CONSTRAINT "ProductEmbedding_pkey" PRIMARY KEY ("productId")
);

ALTER TABLE "ProductEmbedding"
ADD CONSTRAINT "ProductEmbedding_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
