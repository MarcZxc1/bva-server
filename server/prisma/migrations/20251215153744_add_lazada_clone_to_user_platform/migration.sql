/*
  Warnings:

  - The `status` column on the `Sale` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'TO_SHIP', 'TO_RECEIVE', 'COMPLETED', 'CANCELLED', 'RETURNED', 'REFUNDED', 'FAILED');

-- AlterEnum
ALTER TYPE "UserPlatform" ADD VALUE 'LAZADA_CLONE';

-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "status",
ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'PENDING';
