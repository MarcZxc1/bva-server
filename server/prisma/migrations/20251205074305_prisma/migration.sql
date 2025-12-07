/*
  Warnings:

  - A unique constraint covering the columns `[shopId,externalId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[shopId,externalId]` on the table `Sale` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[googleId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[shopeeId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'BUYER';

-- AlterTable
ALTER TABLE "Inventory" ADD COLUMN     "batchNumber" TEXT,
ADD COLUMN     "threshold" INTEGER NOT NULL DEFAULT 10;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "category" TEXT,
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "profit" DOUBLE PRECISION,
ADD COLUMN     "revenue" DOUBLE PRECISION,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'completed';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "shopeeId" TEXT,
ALTER COLUMN "password" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Product_shopId_externalId_key" ON "Product"("shopId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_shopId_externalId_key" ON "Sale"("shopId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_shopeeId_key" ON "User"("shopeeId");
