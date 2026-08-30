# Infraestrutura local

Serviços que o ambiente de desenvolvimento do MyNotes precisa. Nenhum deles é
usado em produção nesta forma — em produção usamos serviços gerenciados
(ver [docs/operations/ci-cd.md](../docs/operations/ci-cd.md)).

| Serviço  | Porta       | Para que serve                                | UI                                     |
| -------- | ----------- | --------------------------------------------- | -------------------------------------- |
| postgres | 5432        | Banco relacional principal                    | —                                      |
| redis    | 6379        | Cache, rate limit e denylist de refresh token | —                                      |
| minio    | 9000 / 9001 | Armazenamento de anexos (S3 compatível)       | <http://localhost:9001> (`minioadmin`) |
| maildev  | 1025 / 1080 | Captura de e-mails enviados em dev            | <http://localhost:1080>                |

## Comandos

```bash
make up      # sobe tudo
make logs    # acompanha os logs
make down    # derruba
make reset   # derruba APAGANDO os volumes e sobe de novo
```

> `make reset` apaga o banco de desenvolvimento. Rode as migrations e o seed
> em seguida: `pnpm --filter @mynotes/api db:migrate && pnpm --filter @mynotes/api db:seed`.

## Extensões do Postgres

As extensões (`citext`, `pg_trgm`, `unaccent`) são criadas pelas **migrations do
Prisma**, não por um script de inicialização do container. Ter as duas coisas
criando as mesmas extensões produzia drift na primeira migration — e um script de
init só roda no primeiro boot do volume, o que faria o ambiente local divergir da
CI, que sobe um Postgres cru.
