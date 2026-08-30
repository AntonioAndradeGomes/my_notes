# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
Versionamento conforme [SemVer](https://semver.org/lang/pt-BR/).

As entradas são geradas a partir dos commits convencionais a cada release.

## [Não publicado]

### Adicionado

- Fundação do monorepo: pnpm workspaces, Turborepo, TypeScript compartilhado
- Padrões de código: Prettier, EditorConfig, Conventional Commits e hooks de Git
- Infraestrutura local com Docker Compose (PostgreSQL, Redis, MinIO, MailDev)
- Pipelines de CI e de segurança (lint, tipos, testes, CodeQL, Gitleaks, Dependabot)
- Documentação de arquitetura: visão geral, backend, frontend, mobile, modelo de
  dados, segurança e sincronização offline
- Dez ADRs registrando as decisões estruturais do projeto
- Contrato OpenAPI 3.1 completo, com 27 rotas
- Guias de desenvolvimento: primeiros passos, fluxo, padrões, testes, Git,
  variáveis de ambiente e solução de problemas
- Documentação de operação: CI/CD, observabilidade e runbook de incidentes
- `redocly.yaml` com ruleset explícito, para que o lint do contrato não mude de
  comportamento a cada atualização da ferramenta

### Adicionado — API (início da Fase 1)

- Aplicação NestJS 12 em ESM, integrada ao monorepo (`@mynotes/api`)
- Configuração de ambiente validada por Zod no boot, com `ConfigService` tipado
- Prisma 7 com driver adapter e `prisma.config.ts`; schema inicial (`User`, `Note`)
  e primeira migration, com as extensões `citext`, `pg_trgm` e `unaccent`
- `ProblemDetailsFilter` (RFC 9457) e erros de domínio com códigos estáveis
- `ZodValidationPipe` — validação por schema, sem `class-validator`
- Catch-all de rota não encontrada, para que 404 também saia em `problem+json`
- Health checks de liveness e readiness, com sondagem real do banco
- `@mynotes/eslint-config` implementado: presets base, nestjs e nextjs com
  regras type-aware
- ADR-0011 registrando a escolha de ESLint sobre o oxlint

### Adicionado — Autenticação e usuário

- `Session` no schema, com hash SHA-256 do refresh token e coluna `revoked_at`
  preservada — é o registro revogado que permite detectar reuso de token
- Hash de senha com Argon2id, atrás da porta `PasswordHasher`
- `TokenService`: access token JWT curto e refresh token **opaco** de 256 bits
- `POST /users` cria a conta **sem emitir tokens**: cadastrar não autentica, e o
  cliente segue para o login. A criação vive no módulo `users`, não no `auth`
- `POST /auth/login`, `/auth/refresh`, `/auth/logout`
- Rotação de refresh com detecção de reuso: token reapresentado fora da janela
  de tolerância revoga todas as sessões do usuário
- `JwtAuthGuard` global via `APP_GUARD` — rota nova nasce protegida; abrir uma
  exige `@Public()` explícito
- `GET`/`PATCH`/`DELETE /users/me`, `PUT /users/me/password`,
  `GET`/`DELETE /users/me/sessions`
- Exclusão de conta agendada (202) com 30 dias de arrependimento
- 29 testes: 15 unitários com repositórios em memória, 14 e2e contra Postgres real

### Corrigido

- `allowBuilds` no `pnpm-workspace.yaml` liberando o postinstall do esbuild, que
  o pnpm 11 bloqueia por padrão (o Vitest depende dele)
- Preset `@mynotes/tsconfig/nestjs` deixou de usar `moduleResolution: Node`,
  removido no TypeScript 7 e já um erro no 6; agora usa `node16`
- Versões alinhadas ao ecossistema atual: TypeScript 6.0.x (limite do
  typescript-eslint), ESLint 10 (a linha 9 saiu de suporte), Zod 4, Vitest 4,
  Redocly 2, commitlint 21, lint-staged 17
- Presets de tsconfig não declaram mais `outDir`/`rootDir`: em um tsconfig
  herdado, caminhos relativos resolvem a partir do arquivo que os declara — o
  build da API tentava escrever em `packages/tsconfig/dist`
- `@mynotes/tsconfig` passou a ser autocontido em vez de apontar para o
  `tsconfig.base.json` da raiz, que não resolvia através do symlink do pnpm
- O alvo `.env` do Makefile gera segredos com `openssl`: os placeholders do
  `.env.example` tinham 21 caracteres e reprovavam na validação Zod (mínimo 32)
- Extensões do Postgres saíram do script de init do container e passaram a ser
  criadas pelas migrations — duas fontes causavam drift, e a CI sobe um Postgres
  cru sem script de init
- `make check` passou a incluir `docs:lint`, como a CI já fazia
