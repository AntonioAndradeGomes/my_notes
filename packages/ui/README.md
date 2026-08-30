# @mynotes/ui

Biblioteca de componentes React compartilhada (design system do MyNotes).

Existe para que a aplicação web e futuras superfícies web (landing page, painel
administrativo) compartilhem os mesmos primitivos visuais e tokens de design.

## Escopo

- **Tokens**: cores, tipografia, espaçamento, raio, sombras — com suporte a tema claro/escuro.
- **Primitivos**: `Button`, `Input`, `Dialog`, `Menu`, `Toast`, `Skeleton`.
- **Compostos de domínio**: `NoteCard`, `EditorToolbar`, `TagChip`.

Base técnica: React + Tailwind CSS + Radix UI, documentado com Storybook.

> Pacote ainda não implementado. Fase 2 do [roadmap](../../docs/roadmap.md).
> As decisões de stack estão em [ADR-0005](../../docs/adr/0005-frontend-nextjs-app-router.md).
