# Solução de problemas

Problemas conhecidos, com a causa e a correção. Antes de reinstalar tudo, procure
aqui.

## Instalação e ferramentas

### `ERR_PNPM_UNSUPPORTED_ENGINE`

Sua versão de Node é anterior à exigida.

```bash
fnm use          # ou: nvm use
node -v          # precisa ser >= 22
```

### `pnpm: command not found`

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

### Dependência fantasma: pacote existe mas o import falha

O pnpm usa `node_modules` estrito — um pacote só enxerga o que declarou. Se o
import falha, a dependência não está no `package.json` daquele pacote:

```bash
pnpm --filter @mynotes/api add nome-do-pacote
```

Isso é o comportamento correto, não um defeito: evita que o código dependa de algo
que só chegou por transitividade.

## Docker e infraestrutura

### `bind: address already in use` na porta 5432

Já há um Postgres rodando na máquina.

```bash
lsof -i :5432                       # descubra quem é
brew services stop postgresql@17    # ou pare o serviço local
```

Ou mude `POSTGRES_PORT` no `.env` para `5433` e ajuste a `DATABASE_URL`.

### Containers sobem mas a API não conecta

Verifique a saúde antes de investigar o código:

```bash
docker compose -f docker/docker-compose.yml ps
docker compose -f docker/docker-compose.yml logs postgres
```

Se o Postgres está `unhealthy`, o volume pode estar corrompido:

```bash
make reset   # ATENÇÃO: apaga o banco local
```

### MinIO responde `AccessDenied`

O bucket não existe. Crie pelo console em <http://localhost:9001>
(`minioadmin` / `minioadmin`) ou:

```bash
docker exec mynotes-minio mc mb local/mynotes-attachments
```

## Banco de dados

### `P1001: Can't reach database server`

Três causas, nesta ordem de probabilidade: o container não está de pé, a
`DATABASE_URL` aponta para a porta errada, ou o Postgres ainda está inicializando.

```bash
docker compose -f docker/docker-compose.yml up -d postgres
grep DATABASE_URL .env
```

### `Drift detected` ao rodar migration

Seu banco local divergiu do histórico de migrations — normalmente porque alguém
alterou o schema à mão ou você trocou de branch.

Em desenvolvimento, o caminho mais rápido é recomeçar:

```bash
pnpm --filter @mynotes/api db:reset
```

**Nunca** rode isso apontando para staging ou produção.

### Migration não aplica em outro computador

Migration commitada mas não aplicada localmente. `pnpm --filter @mynotes/api db:migrate`
resolve. Se o erro persistir, verifique se duas branches criaram migrations com o
mesmo timestamp — nesse caso, uma delas precisa ser regerada.

## API

### `EADDRINUSE: address already in use :::3333`

Alguma coisa já ocupa a porta da API. O `make api` verifica isso antes de subir
e distingue dois casos:

**A API já está rodando e respondendo** — normalmente uma outra aba do terminal.
Não há o que fazer: o `nest start --watch` recarrega sozinho ao salvar um
arquivo. Ele reporta e sai com sucesso.

**A porta está travada** — um processo não responde ao health check. Interromper
o watch do Nest com `Ctrl+C` nem sempre encerra o processo filho:

```bash
make stop-api
```

Para descobrir quem ocupa a porta, quando não for a própria API:

```bash
lsof -nP -iTCP:3333 -sTCP:LISTEN
```

### `JWT_ACCESS_SECRET is required`

A validação de ambiente está funcionando. Preencha o `.env`:

```bash
echo "JWT_ACCESS_SECRET=$(openssl rand -base64 48)" >> .env
```

### Todo request responde `401` logo após o login

Relógio da máquina fora de sincronia faz o JWT nascer expirado. Verifique com
`date` e sincronize o NTP do sistema.

### CORS bloqueando o frontend

`CORS_ORIGINS` precisa conter a origem exata, **com protocolo e porta**:

```text
CORS_ORIGINS=http://localhost:3000
```

`localhost:3000` sem `http://` não funciona.

## Frontend

### `Error: Text content does not match server-rendered HTML`

Erro de hidratação: o servidor renderizou algo diferente do cliente. Causas
frequentes: `new Date()` ou `Math.random()` no corpo do componente, ou leitura de
`localStorage` fora de `useEffect`.

### `useState is not a function` em um componente

Falta `'use client'` no topo do arquivo. Componentes são de servidor por padrão no
App Router.

### Mudança no `@mynotes/contracts` não aparece na web

O pacote precisa ser reconstruído:

```bash
pnpm --filter @mynotes/contracts build
```

Ou rode `pnpm dev` na raiz — o Turborepo cuida da ordem.

## Mobile

### App não alcança a API

| Alvo               | URL                                      |
| ------------------ | ---------------------------------------- |
| Emulador Android   | `http://10.0.2.2:3333/api/v1`            |
| Simulador iOS      | `http://localhost:3333/api/v1`           |
| Dispositivo físico | `http://<ip-da-sua-máquina>:3333/api/v1` |

Em dispositivo físico, a API precisa escutar em `0.0.0.0`, não em `127.0.0.1`.

### `build_runner` falha com conflito de saída

```bash
dart run build_runner build --delete-conflicting-outputs
```

### Alterei um modelo e o app não compila

Se o projeto usar geração de código, arquivos `.g.dart` e `.freezed.dart` são
gerados. Rode o `build_runner` — de preferência em modo watch:

```bash
dart run build_runner watch -d
```

### `CocoaPods` falha no iOS

```bash
cd apps/mobile/ios && pod install --repo-update
```

## CI

### Passa local, falha na CI

Quase sempre uma destas quatro:

1. **Arquivo não commitado** — `git status`.
2. **Dependência não commitada no lockfile** — a CI usa `--frozen-lockfile`.
3. **Variável de ambiente ausente** — configure em Settings → Secrets.
4. **Teste dependente de ordem ou de tempo** — a CI é mais lenta e paraleliza
   diferente. Ver [testing.md](testing.md#testes-instáveis).

### Cache do Turborepo servindo resultado velho

```bash
turbo run build --force
```

Se o problema for local e persistente, `rm -rf .turbo` limpa o cache.

## Nada aqui resolveu

1. `make reset && pnpm install`
2. Confira se está na branch certa e atualizada
3. Abra uma issue com: comando executado, saída completa, SO e versões
   (`node -v`, `pnpm -v`, `docker -v`)

E, se você resolveu um problema que não estava neste arquivo: **adicione-o aqui**.
É o que faz este guia continuar útil.
