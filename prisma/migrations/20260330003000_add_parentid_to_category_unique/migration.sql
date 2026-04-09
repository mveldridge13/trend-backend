-- DropIndex
DROP INDEX "categories_name_userId_isSystem_key";

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_userId_isSystem_parentId_key" ON "categories"("name", "userId", "isSystem", "parentId");
