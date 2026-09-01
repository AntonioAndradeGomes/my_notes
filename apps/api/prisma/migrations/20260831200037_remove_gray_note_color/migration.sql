-- Remove `gray` da paleta de cores de nota.
--
-- Postgres nao permite remover um valor de enum: o tipo inteiro e recriado e a
-- coluna migrada. Acrescentar cor e uma linha (ALTER TYPE ... ADD VALUE);
-- remover custa isto. Vale considerar antes de estreitar a paleta com dados em
-- producao — a conversao falharia se alguma linha usasse o valor removido.

-- AlterEnum
BEGIN;
CREATE TYPE "note_color_new" AS ENUM ('none', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink');
ALTER TABLE "public"."notes" ALTER COLUMN "color" DROP DEFAULT;
ALTER TABLE "notes" ALTER COLUMN "color" TYPE "note_color_new" USING ("color"::text::"note_color_new");
ALTER TYPE "note_color" RENAME TO "note_color_old";
ALTER TYPE "note_color_new" RENAME TO "note_color";
DROP TYPE "public"."note_color_old";
ALTER TABLE "notes" ALTER COLUMN "color" SET DEFAULT 'none';
COMMIT;
