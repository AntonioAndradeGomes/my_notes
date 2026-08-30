# Arquitetura do backend

NestJS 12 sobre Node 24, TypeScript estrito. Monolito **modular**: um deploy só,
mas com fronteiras internas nítidas o bastante para extrair um módulo no dia em
que isso for necessário ([ADR-0002](../adr/0002-backend-nestjs.md)).

## Camadas

```text
HTTP  →  Aplicação  →  Domínio  ←  Infraestrutura
```

| Camada             | Responsabilidade                                 | Pode depender de            | Nunca depende de |
| ------------------ | ------------------------------------------------ | --------------------------- | ---------------- |
| **HTTP**           | Controllers, guards, filters, interceptors, DTOs | Aplicação                   | Prisma, S3       |
| **Aplicação**      | Casos de uso, orquestração, transações           | Domínio, portas             | Express, Prisma  |
| **Domínio**        | Entidades, invariantes, erros de negócio         | Nada                        | Tudo o mais      |
| **Infraestrutura** | Repositórios Prisma, S3, mailer, filas           | Domínio (implementa portas) | HTTP             |

A regra de dependência é uma só: **nada aponta para fora do domínio**. Um caso de
uso recebe `NotesRepository` (uma interface do domínio), não `PrismaService`.

```ts
// domain/notes/notes.repository.ts — a porta
export abstract class NotesRepository {
  abstract findById(id: NoteId, ownerId: UserId): Promise<Note | null>;
  abstract save(note: Note): Promise<void>;
}

// infra/prisma/prisma-notes.repository.ts — o adaptador
@Injectable()
export class PrismaNotesRepository extends NotesRepository {
  /* ... */
}

// modules/notes/notes.module.ts — a ligação
providers: [{ provide: NotesRepository, useClass: PrismaNotesRepository }];
```

O ganho é concreto: o teste do caso de uso injeta um repositório em memória e roda
em milissegundos, sem Docker.

## Anatomia de um módulo

Todo módulo de domínio segue a mesma forma — previsibilidade vale mais que
criatividade local:

```text
modules/notes/
├── notes.module.ts
├── notes.controller.ts          # só HTTP: rotas, status, headers
├── notes.service.ts             # orquestração dos casos de uso
├── dto/
│   ├── create-note.dto.ts       # schema Zod + tipo inferido
│   └── list-notes.query.ts
├── use-cases/
│   ├── create-note.use-case.ts
│   ├── update-note.use-case.ts
│   └── search-notes.use-case.ts
└── __tests__/
    ├── create-note.use-case.spec.ts
    └── notes.controller.spec.ts
```

Controller fino é regra: se um controller tem `if` de regra de negócio, a regra
está no lugar errado.

## Configuração

Variáveis de ambiente são validadas **no boot**, com Zod. Se falta um segredo, a
aplicação não sobe — falha barulhenta na inicialização é melhor que erro silencioso
às 3 da manhã.

```ts
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  API_PORT: z.coerce.number().int().positive().default(3333),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_TTL: z.string().default('30d'),
});
```

Nenhum `process.env` espalhado pelo código: só o `ConfigService` tipado.

## Elementos transversais

| Elemento                 | Papel                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| `ProblemDetailsFilter`   | Traduz qualquer exceção para `application/problem+json` ([api/errors.md](../api/errors.md)) |
| `LoggingInterceptor`     | Log estruturado com `requestId`, rota, status e duração                                     |
| `TimeoutInterceptor`     | Corta requisições acima de 30 s                                                             |
| `JwtAuthGuard`           | Valida o access token e popula `request.user`                                               |
| `OwnershipGuard`         | Garante que o recurso pertence a quem pediu                                                 |
| `ThrottlerGuard`         | Rate limit por IP e por usuário, com contadores no Redis                                    |
| `TransactionInterceptor` | Abre uma transação por requisição de escrita quando declarado                               |

## Persistência

Prisma sobre PostgreSQL ([ADR-0003](../adr/0003-postgresql-prisma.md)). Regras:

- **Migrations sempre versionadas** (`prisma migrate dev`); nunca `db push` fora de protótipo.
- **Toda migration precisa ser reversível** ou trazer um plano de rollback escrito.
- **Nenhum `SELECT *` implícito** em listagens: `select` explícito com os campos usados.
- **Consulta em loop é bug**, não estilo: use `include`, `in` ou uma query só.
- **Soft delete** nas notas (`deletedAt`), com expurgo definitivo por job após 30 dias.

## Jobs assíncronos

BullMQ sobre Redis. O que não precisa acontecer dentro da requisição, não acontece:

| Job                | Quando                                                            |
| ------------------ | ----------------------------------------------------------------- |
| `purge-trash`      | Diário: apaga definitivamente notas na lixeira há mais de 30 dias |
| `send-email`       | Ao cadastrar, recuperar senha, convidar colaborador               |
| `reindex-search`   | Após mudança em massa de conteúdo                                 |
| `cleanup-sessions` | Remove refresh tokens expirados                                   |

## Testes

Detalhes e metas em [../guides/testing.md](../guides/testing.md). Em resumo:

| Nível      | Ferramenta              | O que cobre                                           |
| ---------- | ----------------------- | ----------------------------------------------------- |
| Unitário   | Vitest                  | Casos de uso e entidades, com repositórios em memória |
| Integração | Vitest + Testcontainers | Repositórios contra um Postgres real e descartável    |
| E2E        | Supertest               | Fluxos HTTP completos com autenticação real           |

Casos de uso ficam com meta de 90% de cobertura; infraestrutura, o que os testes
de integração alcançarem naturalmente.
