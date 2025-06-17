/*
  Warnings:

  - A unique constraint covering the columns `[name,isSystem]` on the table `categories` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "parentId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "hasSeenWelcome" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "income" DECIMAL(12,2),
ADD COLUMN     "setupComplete" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_isSystem_key" ON "categories"("name", "isSystem");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
