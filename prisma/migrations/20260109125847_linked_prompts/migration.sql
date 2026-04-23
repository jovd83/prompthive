-- AlterTable
ALTER TABLE "Tag" ADD COLUMN "color" TEXT;

-- CreateTable
CREATE TABLE "TechnicalIdSequence" (
    "prefix" TEXT NOT NULL PRIMARY KEY,
    "lastValue" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "_PromptLinks" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PromptLinks_A_fkey" FOREIGN KEY ("A") REFERENCES "Prompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PromptLinks_B_fkey" FOREIGN KEY ("B") REFERENCES "Prompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Prompt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "resource" TEXT,
    "currentVersionId" TEXT,
    "createdById" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "copyCount" INTEGER NOT NULL DEFAULT 0,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "technicalId" TEXT,
    CONSTRAINT "Prompt_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Prompt" ("copyCount", "createdAt", "createdById", "currentVersionId", "description", "id", "resource", "title", "updatedAt", "viewCount") SELECT "copyCount", "createdAt", "createdById", "currentVersionId", "description", "id", "resource", "title", "updatedAt", "viewCount" FROM "Prompt";
DROP TABLE "Prompt";
ALTER TABLE "new_Prompt" RENAME TO "Prompt";
CREATE UNIQUE INDEX "Prompt_technicalId_key" ON "Prompt"("technicalId");
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "autoBackupEnabled" BOOLEAN NOT NULL DEFAULT false,
    "backupPath" TEXT,
    "backupFrequency" TEXT NOT NULL DEFAULT 'DAILY',
    "lastBackupAt" DATETIME,
    "showPrompterTips" BOOLEAN NOT NULL DEFAULT true,
    "tagColorsEnabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Settings" ("autoBackupEnabled", "backupFrequency", "backupPath", "id", "lastBackupAt", "showPrompterTips", "userId") SELECT "autoBackupEnabled", "backupFrequency", "backupPath", "id", "lastBackupAt", "showPrompterTips", "userId" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
CREATE UNIQUE INDEX "Settings_userId_key" ON "Settings"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_PromptLinks_AB_unique" ON "_PromptLinks"("A", "B");

-- CreateIndex
CREATE INDEX "_PromptLinks_B_index" ON "_PromptLinks"("B");
