-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "issueId" TEXT,
ADD COLUMN     "pageEnd" INTEGER,
ADD COLUMN     "pageStart" INTEGER;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "qualityRatings" JSONB;

-- CreateTable
CREATE TABLE "Volume" (
    "id" TEXT NOT NULL,
    "volumeNumber" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Volume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL,
    "volumeId" TEXT NOT NULL,
    "issueNumber" INTEGER NOT NULL,
    "title" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditorialDecision" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "editorId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "comments" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EditorialDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Volume_volumeNumber_key" ON "Volume"("volumeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Issue_volumeId_issueNumber_key" ON "Issue"("volumeId", "issueNumber");
