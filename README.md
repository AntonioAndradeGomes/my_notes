<div align="center">

# MyNotes

**Plataforma de notas multiplataforma — API, web e mobile em um monorepo.**

[![CI](https://github.com/gomesmax1997/mynotes/actions/workflows/ci.yml/badge.svg)](https://github.com/gomesmax1997/mynotes/actions/workflows/ci.yml)
[![Segurança](https://github.com/gomesmax1997/mynotes/actions/workflows/security.yml/badge.svg)](https://github.com/gomesmax1997/mynotes/actions/workflows/security.yml)
[![Licença: MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-blue.svg)](LICENSE)

[Documentação](docs/README.md) · [Arquitetura](docs/architecture/overview.md) · [API](docs/api/openapi.yaml) · [Decisões](docs/adr/README.md) · [Roadmap](docs/roadmap.md)

</div>

---

## O que é

Um sistema de notas pessoais com três superfícies sobre um único domínio: uma API
REST, uma aplicação web e um app móvel offline-first. A mesma nota, coerente em
qualquer lugar.

O projeto é também uma referência de como estruturar um monorepo poliglota de
forma profissional: contrato de API antes do código, decisões registradas em ADR,
documentação versionada junto com o que ela descreve.

## Estado

**Fase 0 concluída** — o repositório tem a fundação do monorepo e a documentação
completa. As aplicações começam na Fase 1. Ver [roadmap](docs/roadmap.md).

## Stack

| Camada           | Tecnologia                         | Decisão                                                    |
| ---------------- | ---------------------------------- | ---------------------------------------------------------- |
| Monorepo         | pnpm workspaces + Turborepo        | [ADR-0001](docs/adr/0001-monorepo-pnpm-turborepo.md)       |
| Backend          | NestJS 12 · Node 24 · TypeScript 6 | [ADR-0002](docs/adr/0002-backend-nestjs.md)                |
| Banco            | PostgreSQL 17 · Prisma             | [ADR-0003](docs/adr/0003-postgresql-prisma.md)             |
| Autenticação     | JWT + refresh rotativo             | [ADR-0004](docs/adr/0004-auth-jwt-refresh-rotativo.md)     |
| Web              | Next.js 16 · App Router · Tailwind | [ADR-0005](docs/adr/0005-frontend-nextjs-app-router.md)    |
| Mobile e desktop | Flutter 3.41 · MVVM · get_it       | [ADR-0012](docs/adr/0012-mobile-mvvm-get-it-commands.md)   |
| Contrato         | OpenAPI 3.1, design-first          | [ADR-0007](docs/adr/0007-contrato-api-openapi-first.md)    |
| Observabilidade  | OpenTelemetry · Pino               | [ADR-0010](docs/adr/0010-observabilidade-opentelemetry.md) |

## Estrutura

```text
mynotes/
├── apps/
│   ├── api/        # backend NestJS
│   ├── web/        # frontend Next.js
│   └── mobile/     # app Flutter (iOS, Android, macOS, Windows, Linux)
├── packages/
│   ├── contracts/  # schemas e tipos compartilhados (gerados do OpenAPI)
│   ├── ui/         # design system React
│   ├── eslint-config/
│   └── tsconfig/
├── docs/           # arquitetura, ADRs, API, guias, operação
├── docker/         # infraestrutura de desenvolvimento
└── .github/        # CI, templates, políticas
```

## Começando

```bash
git clone https://github.com/gomesmax1997/mynotes.git
cd mynotes
make setup     # instala dependências, cria o .env e sobe a infraestrutura
make dev       # sobe API e web
```

Guia completo, incluindo pré-requisitos e o app mobile:
[docs/guides/getting-started.md](docs/guides/getting-started.md).

| Serviço | URL                            |
| ------- | ------------------------------ |
| API     | <http://localhost:3333/api/v1> |
| Web     | <http://localhost:3000>        |
| MinIO   | <http://localhost:9001>        |
| MailDev | <http://localhost:1080>        |

## Comandos

```bash
make help      # lista todos os alvos
make dev       # API + web em modo desenvolvimento
make check     # formatação, lint, tipos, testes e contrato — o mesmo que a CI roda
make up/down   # infraestrutura Docker
make api-docs  # documentação interativa da API
```

## Como o projeto se organiza

Três convenções sustentam o resto:

1. **O contrato vem primeiro.** Mudou a API? [`openapi.yaml`](docs/api/openapi.yaml)
   muda antes, na mesma PR. Os tipos do frontend e o cliente Dart são gerados dele.
2. **Decisão cara vira ADR.** O [registro](docs/adr/README.md) explica _por que_ as
   coisas são como são — e o que foi descartado no caminho.
3. **Documentação mora com o código.** Está em `docs/`, versionada, revisada na
   mesma PR que muda o comportamento.

## Contribuindo

Leia [CONTRIBUTING.md](CONTRIBUTING.md). Em resumo: issue antes do código, branch
por mudança, commits convencionais, `make check` antes do push, PR pequena.

## Segurança

Encontrou uma vulnerabilidade? **Não abra uma issue pública** — siga o processo em
[SECURITY.md](SECURITY.md).

## Licença

[MIT](LICENSE).
