# Primeiros passos

Do zero ao ambiente rodando. Se algo falhar no caminho, veja
[troubleshooting.md](troubleshooting.md) antes de improvisar.

## Pré-requisitos

| Ferramenta       | Versão mínima       | Verificar com                              |
| ---------------- | ------------------- | ------------------------------------------ |
| Node.js          | 22 (recomendado 24) | `node -v`                                  |
| pnpm             | 10                  | `pnpm -v`                                  |
| Docker + Compose | 24                  | `docker -v`                                |
| Git              | 2.40                | `git --version`                            |
| Flutter          | 3.35                | `flutter --version` — só para o app mobile |

Node: use [fnm](https://github.com/Schniz/fnm) ou nvm; o `.nvmrc` fixa a versão.
pnpm: `corepack enable && corepack prepare pnpm@latest --activate`.

## Instalação

```bash
git clone https://github.com/gomesmax1997/mynotes.git
cd mynotes
make setup
```

`make setup` faz três coisas: instala as dependências, cria o `.env` a partir do
exemplo e sobe a infraestrutura no Docker.

Sem `make`, o equivalente é:

```bash
pnpm install
cp .env.example .env
docker compose --env-file .env -f docker/docker-compose.yml up -d
```

## Configuração

Abra o `.env`. Para desenvolvimento local, os padrões funcionam — com uma exceção:
gere segredos de verdade para os tokens.

```bash
echo "JWT_ACCESS_SECRET=$(openssl rand -base64 48)"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 48)"
```

Cada variável está explicada em [environment-variables.md](environment-variables.md).

## Banco de dados

> Disponível a partir da Fase 1 ([roadmap](../roadmap.md)).

```bash
pnpm --filter @mynotes/api db:migrate   # aplica as migrations
pnpm --filter @mynotes/api db:seed      # popula dados de exemplo
```

O seed cria um usuário `demo@mynotes.local` / `senha-de-demonstracao` com alguns
cadernos e notas.

## Rodando

```bash
pnpm dev
```

Sobe API e web em paralelo, via Turborepo:

| Serviço             | URL                            |
| ------------------- | ------------------------------ |
| API                 | <http://localhost:3333/api/v1> |
| Documentação da API | <http://localhost:3333/docs>   |
| Web                 | <http://localhost:3000>        |
| MinIO (console)     | <http://localhost:9001>        |
| MailDev             | <http://localhost:1080>        |

Para rodar só uma aplicação:

```bash
pnpm --filter @mynotes/api dev
pnpm --filter @mynotes/web dev
```

## App mobile

```bash
cd apps/mobile
flutter pub get
dart run build_runner build --delete-conflicting-outputs
flutter run --dart-define=API_URL=http://10.0.2.2:3333/api/v1
```

`10.0.2.2` é o endereço pelo qual o **emulador Android** enxerga o `localhost` da
sua máquina. No simulador iOS, use `http://localhost:3333/api/v1`. Em dispositivo
físico, use o IP da máquina na rede local.

## Verificando que está tudo certo

```bash
make check
```

Roda formatação, lint, tipos, testes e validação do OpenAPI — exatamente o que a
CI executa. Se passa aqui, passa lá.

## Sem Docker?

É possível usar um Postgres e um Redis instalados localmente: ajuste `DATABASE_URL`
e `REDIS_URL` no `.env`. Você perde o MinIO (anexos) e o MailDev (e-mails), então
funcionalidades que dependem deles ficam indisponíveis em dev.

## Próximos passos

- [Fluxo de desenvolvimento](development-workflow.md) — como abrir sua primeira PR
- [Visão geral da arquitetura](../architecture/overview.md) — como as peças se encaixam
- [Padrões de código](coding-standards.md) — o que a revisão vai cobrar
