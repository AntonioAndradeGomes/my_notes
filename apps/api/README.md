# @mynotes/api — Backend NestJS

API REST do MyNotes. Autoridade sobre o domínio: autenticação, notas, cadernos,
tags, anexos e sincronização.

| Item          | Valor                                                 |
| ------------- | ----------------------------------------------------- |
| Framework     | NestJS 12 (Node 24, TypeScript 6)                     |
| Banco         | PostgreSQL 17 via Prisma 7                            |
| Cache / filas | Redis (rate limit, denylist de refresh token, BullMQ) |
| Auth          | JWT access (15 min) + refresh rotativo (30 dias)      |
| Contrato      | [docs/api/openapi.yaml](../../docs/api/openapi.yaml)  |
| Porta padrão  | `3333` — prefixo `/api/v1`                            |

## Estrutura prevista

```text
src/
├── main.ts                  # bootstrap: Helmet, CORS, shutdown hooks
├── app.setup.ts             # configuração compartilhada com os testes e2e
├── app.module.ts
├── config/                  # carregamento e validação (Zod) de env
├── common/                  # filters, interceptors, guards, decorators, pipes
│   ├── filters/             # ProblemDetails exception filter (RFC 9457) ✅
│   ├── pipes/               # ZodValidationPipe ✅
│   ├── errors/              # erros de domínio, traduzidos pelo filter ✅
│   ├── controllers/         # catch-all de rota não encontrada ✅
│   ├── interceptors/        # logging, timeout, serialização
│   └── guards/              # JwtAuthGuard, RolesGuard, ThrottlerGuard
├── modules/
│   ├── auth/                # login, refresh, logout ✅
│   ├── users/               # criação de conta, perfil, senha, sessões ✅
│   ├── notes/               # CRUD, busca, arquivo, lixeira, versões
│   ├── notebooks/           # organização hierárquica
│   ├── tags/
│   ├── attachments/         # upload pré-assinado para S3/MinIO
│   ├── sharing/             # links públicos e colaboração
│   ├── sync/                # delta sync para o app mobile
│   └── health/              # liveness e readiness ✅
├── infra/
│   ├── prisma/              # PrismaService e módulo ✅ (client gerado em generated/)
│   ├── storage/             # adaptador S3
│   ├── mailer/
│   └── telemetry/           # OpenTelemetry, logger Pino
└── jobs/                    # workers BullMQ (limpeza de lixeira, e-mails)

prisma.config.ts             # conexão do CLI (Prisma 7 tirou a url do schema)
prisma/
├── schema.prisma
├── migrations/
└── seed.ts

test/
├── unit/
├── integration/             # Testcontainers com Postgres real
└── e2e/
```

> **Atenção ao instalar o Prisma**: a tag `latest` do pacote `prisma` no npm
> aponta hoje para uma release candidate da v8, enquanto o `@prisma/client`
> estável está na v7. Instale com a major fixada para não puxar a RC:
>
> ```bash
> pnpm --filter @mynotes/api add -D prisma@^7
> pnpm --filter @mynotes/api add @prisma/client@^7
> ```

## Scripts

```bash
pnpm --filter @mynotes/api dev          # nest start --watch
pnpm --filter @mynotes/api db:migrate   # prisma migrate dev
pnpm --filter @mynotes/api db:studio    # prisma studio
pnpm --filter @mynotes/api test         # unitários
pnpm --filter @mynotes/api test:e2e     # end-to-end (precisa do Postgres de pé)
```

## Notas de implementação

**ESM.** O NestJS 12 gera o projeto como módulo ES. Na prática isso significa
que **todo import relativo leva a extensão `.js`**, mesmo apontando para um
arquivo `.ts`:

```ts
import { AppModule } from './app.module.js'; // ✅
import { AppModule } from './app.module'; // ❌ não resolve em runtime
```

**Validação é com Zod, não com class-validator.** Não há `ValidationPipe` global:
cada rota aplica `ZodValidationPipe` com o schema da sua entrada, e o mesmo schema
é compartilhado com a web via `@mynotes/contracts`. Ver [ADR-0007](../../docs/adr/0007-contrato-api-openapi-first.md).

**O catch-all de 404 precisa ser o último módulo importado** no `AppModule`. Seu
curinga casa com qualquer rota; registrado antes, engoliria as rotas reais.

## Leitura relacionada

- Arquitetura: [docs/architecture/backend.md](../../docs/architecture/backend.md)
- Modelo de dados: [docs/architecture/data-model.md](../../docs/architecture/data-model.md)
- Segurança: [docs/architecture/security.md](../../docs/architecture/security.md)

## Estado

Fatia vertical de fundação pronta: configuração validada por Zod, Prisma
conectado, tratamento de erros em `problem+json` e health checks. Os módulos de
domínio (auth, notes, notebooks, tags, sync) são o restante da Fase 1 —
ver [roadmap](../../docs/roadmap.md).
