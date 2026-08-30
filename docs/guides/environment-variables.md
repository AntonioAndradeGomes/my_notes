# Variáveis de ambiente

Toda variável é validada por Zod na inicialização da API. Se falta um segredo, a
aplicação **não sobe** — falha barulhenta no boot é melhor que comportamento
estranho em produção às 3 da manhã.

O arquivo `.env.example` é a referência. Ao adicionar uma variável, atualize os
dois: o exemplo e esta tabela.

## Geral

| Variável   | Obrigatória | Padrão | Descrição                                    |
| ---------- | ----------- | ------ | -------------------------------------------- |
| `NODE_ENV` | sim         | —      | `development`, `test` ou `production`        |
| `TZ`       | não         | `UTC`  | Fuso do processo. **Sempre UTC em produção** |

## API

| Variável            | Obrigatória | Padrão | Descrição                                                        |
| ------------------- | ----------- | ------ | ---------------------------------------------------------------- |
| `API_PORT`          | não         | `3333` | Porta HTTP                                                       |
| `API_GLOBAL_PREFIX` | não         | `api`  | Prefixo antes da versão                                          |
| `API_PUBLIC_URL`    | sim (prod)  | —      | URL pública; usada em links de e-mail                            |
| `CORS_ORIGINS`      | sim         | —      | Origens permitidas, separadas por vírgula. Nunca `*` em produção |

## Banco de dados

| Variável             | Obrigatória | Padrão | Descrição                     |
| -------------------- | ----------- | ------ | ----------------------------- |
| `DATABASE_URL`       | sim         | —      | String de conexão do Postgres |
| `DATABASE_POOL_SIZE` | não         | `10`   | Conexões no pool              |

`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` e `POSTGRES_PORT` são usadas
apenas pelo Docker Compose local.

## Redis

| Variável    | Obrigatória | Padrão | Descrição                                     |
| ----------- | ----------- | ------ | --------------------------------------------- |
| `REDIS_URL` | sim         | —      | Cache, rate limit, denylist de tokens e filas |

## Autenticação

| Variável             | Obrigatória | Padrão  | Descrição                                        |
| -------------------- | ----------- | ------- | ------------------------------------------------ |
| `JWT_ACCESS_SECRET`  | sim         | —       | Mínimo de 32 caracteres                          |
| `JWT_ACCESS_TTL`     | não         | `15m`   | Validade do access token                         |
| `JWT_REFRESH_SECRET` | sim         | —       | Mínimo de 32 caracteres, **diferente do access** |
| `JWT_REFRESH_TTL`    | não         | `30d`   | Validade do refresh token                        |
| `ARGON2_MEMORY_COST` | não         | `19456` | KiB. Mínimo recomendado pelo OWASP               |
| `ARGON2_TIME_COST`   | não         | `2`     | Iterações                                        |

Gerar segredos:

```bash
openssl rand -base64 48
```

Os dois segredos precisam ser **diferentes**. Reutilizar o mesmo permite que um
access token seja apresentado como refresh.

## Armazenamento

| Variável              | Obrigatória | Padrão  | Descrição                    |
| --------------------- | ----------- | ------- | ---------------------------- |
| `S3_ENDPOINT`         | sim         | —       | MinIO em dev, S3 em produção |
| `S3_REGION`           | sim         | —       | Região                       |
| `S3_BUCKET`           | sim         | —       | Bucket dos anexos            |
| `S3_ACCESS_KEY`       | sim         | —       | Chave de acesso              |
| `S3_SECRET_KEY`       | sim         | —       | Chave secreta                |
| `S3_FORCE_PATH_STYLE` | não         | `false` | `true` para MinIO            |

## E-mail

| Variável        | Obrigatória | Padrão | Descrição                       |
| --------------- | ----------- | ------ | ------------------------------- |
| `SMTP_HOST`     | sim         | —      | Servidor SMTP                   |
| `SMTP_PORT`     | não         | `587`  | Porta                           |
| `SMTP_USER`     | não         | —      | Usuário (não usado com MailDev) |
| `SMTP_PASSWORD` | não         | —      | Senha                           |
| `SMTP_FROM`     | sim         | —      | Remetente                       |

## Observabilidade

| Variável                      | Obrigatória | Padrão        | Descrição                                       |
| ----------------------------- | ----------- | ------------- | ----------------------------------------------- |
| `LOG_LEVEL`                   | não         | `info`        | `debug`, `info`, `warn`, `error`                |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | não         | —             | Coletor OTLP. Ausente desliga o export          |
| `OTEL_SERVICE_NAME`           | não         | `mynotes-api` | Nome do serviço nos traces                      |
| `OTEL_TRACES_SAMPLER_ARG`     | não         | `0.1`         | Taxa de amostragem. Erros são sempre amostrados |
| `SENTRY_DSN`                  | não         | —             | Captura de exceções. Vazio desliga              |

## Web

Variáveis com prefixo `NEXT_PUBLIC_` são **embutidas no bundle e visíveis ao
usuário**. Nunca coloque segredo nelas.

| Variável                | Obrigatória | Descrição                                                |
| ----------------------- | ----------- | -------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`   | sim         | URL base da API                                          |
| `NEXT_PUBLIC_APP_NAME`  | não         | Nome exibido na interface                                |
| `SESSION_COOKIE_SECRET` | sim         | Assinatura dos cookies de sessão. **Sem** `NEXT_PUBLIC_` |

## Mobile

O Flutter não lê `.env`. A configuração entra em tempo de compilação:

```bash
flutter run --dart-define=API_URL=http://10.0.2.2:3333/api/v1
flutter build apk --dart-define=API_URL=https://api.mynotes.app/api/v1
```

| Define       | Obrigatória | Descrição        |
| ------------ | ----------- | ---------------- |
| `API_URL`    | sim         | URL base da API  |
| `SENTRY_DSN` | não         | Captura de erros |

## Gestão de segredos

| Ambiente           | Onde ficam                                               |
| ------------------ | -------------------------------------------------------- |
| Local              | `.env`, fora do Git                                      |
| CI                 | GitHub Actions Secrets                                   |
| Staging / Produção | Gerenciador de segredos do provedor, injetado no runtime |

Segredo **nunca** entra no repositório — nem em teste, nem "temporariamente". O
Gitleaks roda na CI sobre todo o histórico e falha a build.

Se um segredo vazar: rotacione primeiro, investigue depois. Reescrever o histórico
do Git não resolve — o valor já foi exposto.
