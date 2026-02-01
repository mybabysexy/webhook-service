-- AlterTable
ALTER TABLE "Webhook" ADD COLUMN     "authEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "authToken" TEXT,
ADD COLUMN     "authType" TEXT;
