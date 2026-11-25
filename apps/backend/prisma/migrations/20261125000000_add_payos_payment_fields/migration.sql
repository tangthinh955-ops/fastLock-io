-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "checkoutUrl" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentLinkId" TEXT,
ADD COLUMN     "paymentRef" TEXT,
ADD COLUMN     "payosOrderCode" TEXT,
ADD COLUMN     "qrCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_payosOrderCode_key" ON "Order"("payosOrderCode");

-- CreateIndex
CREATE UNIQUE INDEX "Order_paymentRef_key" ON "Order"("paymentRef");
