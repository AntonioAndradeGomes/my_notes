# @mynotes/web — Frontend Next.js

Aplicação web do MyNotes: escrita, organização e busca de notas no navegador.

| Item          | Valor                                                 |
| ------------- | ----------------------------------------------------- |
| Framework     | Next.js 16 (App Router, React Server Components)      |
| Estilo        | Tailwind CSS + `@mynotes/ui`                          |
| Estado server | TanStack Query                                        |
| Editor        | TipTap (ProseMirror), conteúdo persistido em Markdown |
| Testes        | Vitest + Testing Library, Playwright para E2E         |
| Porta padrão  | `3000`                                                |

## Estrutura prevista

```text
src/
├── app/
│   ├── (auth)/              # login, cadastro, recuperação de senha
│   ├── (app)/               # área autenticada
│   │   ├── notes/[id]/
│   │   ├── notebooks/
│   │   └── search/
│   ├── layout.tsx
│   └── api/                 # route handlers (BFF: refresh de sessão, uploads)
├── components/              # componentes específicos da aplicação
├── features/                # fatias por domínio (hooks, serviços, tipos)
├── lib/                     # cliente HTTP, auth, utilidades
└── styles/
```

## Decisões notáveis

- **Tokens em cookies `httpOnly`**: o refresh token nunca é acessível ao JavaScript.
  A renovação passa por um route handler do próprio Next.js.
- **RSC por padrão**: `'use client'` só onde há interatividade real (editor, atalhos, DnD).
- **Sem estado global de servidor duplicado**: o cache do TanStack Query é a fonte
  de verdade no cliente.

## Leitura relacionada

- Arquitetura: [docs/architecture/frontend.md](../../docs/architecture/frontend.md)
- [ADR-0005](../../docs/adr/0005-frontend-nextjs-app-router.md)

> Aplicação ainda não implementada. Fase 2 do [roadmap](../../docs/roadmap.md).
