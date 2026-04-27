-- AlterTable
ALTER TABLE "_CardToLabel" ADD CONSTRAINT "_CardToLabel_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_CardToLabel_AB_unique";
