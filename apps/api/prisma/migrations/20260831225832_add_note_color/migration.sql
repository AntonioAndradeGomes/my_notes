-- CreateEnum
CREATE TYPE "note_color" AS ENUM ('none', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink', 'gray');

-- AlterTable
ALTER TABLE "notes" ADD COLUMN     "color" "note_color" NOT NULL DEFAULT 'none';
