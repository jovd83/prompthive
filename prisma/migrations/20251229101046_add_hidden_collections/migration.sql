-- CreateTable
CREATE TABLE "_CollectionVisibility" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CollectionVisibility_A_fkey" FOREIGN KEY ("A") REFERENCES "Collection" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CollectionVisibility_B_fkey" FOREIGN KEY ("B") REFERENCES "Settings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_CollectionVisibility_AB_unique" ON "_CollectionVisibility"("A", "B");

-- CreateIndex
CREATE INDEX "_CollectionVisibility_B_index" ON "_CollectionVisibility"("B");
