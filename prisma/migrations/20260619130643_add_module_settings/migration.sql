-- AlterTable
ALTER TABLE "users" ADD COLUMN     "moduleSettings" JSONB NOT NULL DEFAULT '{}';
