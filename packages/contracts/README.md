# @mynotes/contracts

Fonte única de verdade **em TypeScript** para o que trafega entre API e clientes web:
schemas Zod de request/response, tipos inferidos e constantes de domínio (limites,
enums, regex).

O contrato canônico da API é o [OpenAPI](../../docs/api/openapi.yaml). Este pacote é
gerado a partir dele — ver [ADR-0007](../../docs/adr/0007-contrato-api-openapi-first.md).

## Estrutura prevista

```text
src/
├── index.ts
├── auth/          # LoginInput, TokenPair, ...
├── notes/         # Note, CreateNoteInput, NoteListQuery, ...
├── users/         # User, CreateUserInput, UpdateProfileInput, ...
├── tags/
├── common/        # Pagination, ProblemDetails, Cursor, ...
└── constants.ts   # limites de tamanho, enums de domínio
```

## Por que não é usado pelo Flutter

Dart não consome tipos TypeScript. O app mobile gera seu próprio cliente a partir
do mesmo `openapi.yaml` — o contrato continua único, só o alvo da geração muda.

## Estado

Pacote ainda não implementado — Fase 1 do [roadmap](../../docs/roadmap.md). O
`package.json` declara apenas as dependências (para fixá-las no catálogo); os
scripts `build`, `typecheck`, `lint` e `test` entram junto com o `src/`, para que
`make check` continue verde num clone novo.
