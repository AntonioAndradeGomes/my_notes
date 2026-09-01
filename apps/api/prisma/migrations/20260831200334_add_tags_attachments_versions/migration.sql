-- Tabelas de tags, anexos e versoes de nota.
--
-- Tag e por usuario (unique em user_id + name); a ligacao com notas e uma tabela
-- propria com chave composta. Ver docs/architecture/data-model.md.

-- CreateEnum
CREATE TYPE "attachment_status" AS ENUM ('pending', 'ready', 'failed');

-- RenameEnum
-- A paleta deixou de ser exclusiva das notas: as tags usam a mesma.
-- O Prisma geraria DROP COLUMN + ADD COLUMN aqui, o que apagaria a cor de toda
-- nota existente. Renomear o tipo faz a mesma mudanca preservando os dados.
ALTER TYPE "note_color" RENAME TO "palette_color";

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" CITEXT NOT NULL,
    "color" "palette_color" NOT NULL DEFAULT 'none',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_tags" (
    "note_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_tags_pkey" PRIMARY KEY ("note_id","tag_id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" UUID NOT NULL,
    "note_id" UUID NOT NULL,
    "storage_key" TEXT NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(255) NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "status" "attachment_status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_versions" (
    "id" UUID NOT NULL,
    "note_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "version" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tags_user_id_name_key" ON "tags"("user_id", "name");

-- CreateIndex
CREATE INDEX "note_tags_tag_id_idx" ON "note_tags"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "attachments_storage_key_key" ON "attachments"("storage_key");

-- CreateIndex
CREATE INDEX "attachments_note_id_idx" ON "attachments"("note_id");

-- CreateIndex
CREATE INDEX "attachments_status_created_at_idx" ON "attachments"("status", "created_at");

-- CreateIndex
CREATE INDEX "note_versions_note_id_created_at_idx" ON "note_versions"("note_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "note_versions_note_id_version_key" ON "note_versions"("note_id", "version");

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_tags" ADD CONSTRAINT "note_tags_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_tags" ADD CONSTRAINT "note_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_versions" ADD CONSTRAINT "note_versions_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

