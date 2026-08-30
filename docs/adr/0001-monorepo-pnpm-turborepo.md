# ADR-0001 — Monorepo com pnpm workspaces e Turborepo

- **Status**: Aceita
- **Data**: 2026-08-28

## Contexto

O MyNotes tem três aplicações que compartilham um domínio: API, web e mobile. Elas
mudam juntas com frequência — um campo novo em nota costuma atingir as três na
mesma semana.

Com repositórios separados, uma mudança de contrato vira três PRs em três repos,
com ordem de merge frágil e versões de pacote compartilhado para publicar. Com time
pequeno, esse custo de coordenação é maior que o benefício do isolamento.

## Decisão

Um único repositório, com **pnpm workspaces** para o gerenciamento de pacotes e
**Turborepo** para orquestração de tarefas e cache.

```text
apps/      api (NestJS) · web (Next.js) · mobile (Flutter)
packages/  contracts · ui · eslint-config · tsconfig
docs/      documentação viva
```

O app Flutter mora no monorepo mas fica **fora** do workspace pnpm — Dart tem o
próprio gerenciador (`pub`). Ele participa da CI, não do grafo de tarefas do Turbo.

## Alternativas consideradas

### Repositórios separados

Isolamento e permissões mais simples. **Descartada**: mudança de contrato exigiria
PRs coordenadas em três repos e publicação de pacotes versionados só para
compartilhar tipos. Overhead alto demais para o tamanho do time.

### Monorepo com Nx

Mais poderoso: geradores, grafo de dependências rico, plugins para NestJS e Next.js.
**Descartada**: a curva de aprendizado e o acoplamento aos plugins do Nx não se
justificam com quatro pacotes. Turborepo faz o essencial — cache e paralelismo —
com um `turbo.json` que cabe em uma tela.

### npm ou yarn workspaces

Funcionariam. **Descartada**: pnpm instala mais rápido, usa muito menos disco pelo
store com links, e o `node_modules` estrito impede dependência fantasma — um pacote
só enxerga o que declarou. Isso pega erro real antes da produção.

## Consequências

### Positivas

- Mudança de contrato atravessa API e web em uma PR só, atômica.
- Ferramental e padrões unificados: um Prettier, um ESLint, um TypeScript.
- Cache do Turborepo: só reconstrói e retesta o que foi afetado.
- Documentação e código versionados juntos — não há como o `docs/` divergir sem
  que se veja na PR.

### Negativas

- O repositório cresce; `git clone` fica mais pesado com o tempo.
- CI precisa de filtros por caminho para não rodar tudo a cada mudança (já
  implementado em `.github/workflows/ci.yml`).
- Flutter fora do grafo do Turbo exige um job separado na CI.

### A acompanhar

- Se o tempo de CI passar de ~10 minutos com o cache quente, revisar a granularidade
  dos filtros.

## Quando revisitar

Se o mobile ganhar um time próprio com ciclo de release independente, ou se o
repositório passar de ~1 GB.
