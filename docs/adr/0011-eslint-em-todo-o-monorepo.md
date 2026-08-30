# ADR-0011 — ESLint em todo o monorepo, no lugar do oxlint

- **Status**: Aceita
- **Data**: 2026-08-29
- **Relacionadas**: [ADR-0002](0002-backend-nestjs.md)

## Contexto

O scaffold do NestJS 12 passou a vir com **oxlint** — um linter escrito em Rust,
ordens de grandeza mais rápido que o ESLint — em vez do ESLint que versões
anteriores geravam.

Isso criou uma escolha que não existia quando o monorepo foi desenhado: a API
viria com oxlint, enquanto o pacote `@mynotes/eslint-config` e o guia de padrões
de código pressupunham ESLint. E o Next.js, na Fase 2, praticamente exige ESLint
para as regras de React, hooks e acessibilidade.

## Decisão

**ESLint 10 com typescript-eslint em todos os pacotes**, configurado por
`@mynotes/eslint-config` (presets `base`, `nestjs`, `nextjs`). O oxlint foi
removido do `apps/api`.

## Alternativas consideradas

### oxlint na API, ESLint na web

Mantinha o default do framework e deixava o lint da API muito mais rápido.
**Descartada**: dois linters significam duas configurações, duas listas de regras
e duas formas de silenciar um aviso. O `coding-standards.md` teria de descrever as
duas, e uma regra combinada em revisão precisaria ser escrita duas vezes — ou
valeria só em metade do código.

### oxlint em tudo que fosse possível

**Descartada** pelo mesmo motivo, agravado por perder as regras **type-aware**
justamente na camada que mais precisa delas. `no-floating-promises` e
`no-misused-promises` exigem informação de tipo do compilador, e são exatamente
os erros que a API de sincronização produziria: uma Promise não aguardada some
sem rastro e vira dado perdido do usuário.

## Consequências

### Positivas

- Uma configuração, três pacotes; uma regra nova vale em todo o repositório.
- Regras type-aware ativas no backend, onde há assincronismo de verdade.
- `eslint-config-next` entra sem atrito na Fase 2.
- O `@mynotes/eslint-config`, antes um placeholder, virou código real e testado.

### Negativas

- Lint mais lento que o oxlint — a diferença cresce com a base de código.
- Divergimos do default do NestJS: quem gerar um módulo novo com o CLI pode
  reencontrar o oxlint e precisa saber removê-lo.
- `projectService: true` faz o ESLint carregar o programa de tipos, o que pesa
  no tempo de arranque.

## Quando revisitar

Se o lint passar de ~30 s no monorepo inteiro, vale avaliar o oxlint como
**pré-filtro rápido** (rodando nos hooks de commit) mantendo o ESLint como o
portão da CI — os dois em camadas, e não em concorrência.
