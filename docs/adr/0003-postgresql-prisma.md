# ADR-0003 — PostgreSQL com Prisma

- **Status**: Aceita
- **Data**: 2026-08-28

## Contexto

O domínio do MyNotes é relacional sem ambiguidade: usuários possuem notas, notas
pertencem a cadernos, cadernos aninham cadernos, notas e tags têm relação
muitos-para-muitos. Precisamos ainda de busca full-text em português, transações
para o motor de sincronização e controle de concorrência otimista.

## Decisão

**PostgreSQL 17** como banco e **Prisma** como ORM e ferramenta de migrations.

Full-text search com `tsvector` + `unaccent` no próprio Postgres, sem mecanismo de
busca externo — detalhes em [architecture/data-model.md](../architecture/data-model.md).

## Alternativas consideradas

### MongoDB

Notas com estrutura flexível parecem caber bem em documentos. **Descartada**: a
flexibilidade seria útil só no campo de conteúdo — que é texto. Todo o resto do
modelo é relacional, e emular junções na aplicação é justamente o erro clássico.
Somam-se transações multi-documento mais frágeis e busca em português inferior à
do Postgres.

### TypeORM

Integração mais "nativa" com NestJS. **Descartada**: histórico de bugs em
migrations, inferência de tipos mais fraca e API com dois estilos concorrentes
(Active Record e Data Mapper) que dividem a base de código.

### Drizzle

SQL-first, leve, tipagem excelente. **Foi a alternativa mais difícil de recusar.**
Descartada por maturidade de ecossistema e ferramental: `prisma migrate` e
`prisma studio` reduzem atrito diário, e o Prisma Client cobre nosso caso sem que
precisemos escrever SQL para 95% das consultas. Os 5% restantes usam `$queryRaw`.

### Elasticsearch para busca

**Descartada por ora**: mais um serviço para operar, sincronizar e pagar, para
resolver um problema que o Postgres resolve bem na ordem de milhões de notas por
usuário. Revisitar só com número de latência medido em mãos.

## Consequências

### Positivas

- Integridade referencial e transações reais — essenciais para o sync.
- Schema declarativo, com migrations versionadas e revisáveis em PR.
- Tipos gerados do schema: uma coluna renomeada quebra o build, não a produção.
- Busca full-text, JSONB, índices parciais e GIN sem serviço extra.

### Negativas

- O Prisma Client adiciona uma camada; consultas muito complexas exigem `$queryRaw`
  e perdem parte da tipagem.
- O runtime do Prisma pesa no bundle e no tempo de cold start.
- Acoplamento à ferramenta de migrations do Prisma.

### Mitigação

- Repositórios ficam atrás de interfaces do domínio ([ADR-0002](0002-backend-nestjs.md)),
  então trocar de ORM afetaria `infra/prisma/`, não os casos de uso.

## Quando revisitar

Se a busca full-text virar gargalo **medido**, ou se o Prisma se tornar impeditivo
para consultas que o produto precise.
