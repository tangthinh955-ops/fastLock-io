-- AlterTable
ALTER TABLE "User" ADD COLUMN     "defaultAddress" TEXT,
ADD COLUMN     "defaultPhone" TEXT,
ADD COLUMN     "defaultRecipientName" TEXT;

-- AlterTable
ALTER TABLE "Livestream" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "recipientName" TEXT,
ADD COLUMN     "shippingAddress" TEXT,
ADD COLUMN     "shippingNote" TEXT,
ADD COLUMN     "shippingPhone" TEXT;

-- CreateTable
CREATE TABLE "_LivestreamProducts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_LivestreamProducts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_LivestreamProducts_B_index" ON "_LivestreamProducts"("B");

-- AddForeignKey
ALTER TABLE "_LivestreamProducts" ADD CONSTRAINT "_LivestreamProducts_A_fkey" FOREIGN KEY ("A") REFERENCES "Livestream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LivestreamProducts" ADD CONSTRAINT "_LivestreamProducts_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
