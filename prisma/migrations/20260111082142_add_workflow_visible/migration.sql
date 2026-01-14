-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "autoBackupEnabled" BOOLEAN NOT NULL DEFAULT false,
    "backupPath" TEXT,
    "backupFrequency" TEXT NOT NULL DEFAULT 'DAILY',
    "lastBackupAt" DATETIME,
    "showPrompterTips" BOOLEAN NOT NULL DEFAULT true,
    "tagColorsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "workflowVisible" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Settings" ("autoBackupEnabled", "backupFrequency", "backupPath", "id", "lastBackupAt", "showPrompterTips", "tagColorsEnabled", "userId") SELECT "autoBackupEnabled", "backupFrequency", "backupPath", "id", "lastBackupAt", "showPrompterTips", "tagColorsEnabled", "userId" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
CREATE UNIQUE INDEX "Settings_userId_key" ON "Settings"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
