# MyNotes — atalhos de desenvolvimento.
# `make help` lista todos os alvos disponíveis.

SHELL := /bin/bash
.DEFAULT_GOAL := help
COMPOSE := docker compose --env-file .env -f docker/docker-compose.yml

.PHONY: help
help: ## Mostra esta ajuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

.env: .env.example ## Cria o .env com segredos gerados
	@cp -n .env.example .env
	@# Os placeholders do exemplo não passam na validação Zod (mínimo de 32
	@# caracteres): geramos segredos reais para o ambiente já subir funcionando.
	@sed -i '' "s|^JWT_ACCESS_SECRET=.*|JWT_ACCESS_SECRET=$$(openssl rand -base64 48 | tr -d '\n')|" .env
	@sed -i '' "s|^JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$$(openssl rand -base64 48 | tr -d '\n')|" .env
	@echo "Criado .env com segredos gerados."

.PHONY: setup
setup: .env ## Instala dependências e sobe a infraestrutura local
	pnpm install
	$(COMPOSE) up -d
	@echo "Pronto. Rode 'make dev'."

.PHONY: dev
dev: ## Sobe API + Web em modo desenvolvimento
	pnpm dev

.PHONY: up
up: .env ## Sobe Postgres, Redis, MinIO e MailDev
	$(COMPOSE) up -d

.PHONY: down
down: .env ## Derruba a infraestrutura local
	$(COMPOSE) down

.PHONY: reset
reset: .env ## Derruba a infraestrutura APAGANDO os volumes e sobe de novo
	$(COMPOSE) down -v && $(COMPOSE) up -d

.PHONY: logs
logs: .env ## Acompanha os logs da infraestrutura
	$(COMPOSE) logs -f

.PHONY: lint
lint: ## Lint em todo o monorepo
	pnpm lint && pnpm docs:lint

.PHONY: test
test: ## Testes unitários e de integração
	pnpm test

.PHONY: check
check: ## Verificação completa (o mesmo que a CI roda)
	pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm api:validate && pnpm docs:lint

.PHONY: api-docs
api-docs: ## Abre a documentação interativa da API (Redoc)
	pnpm api:preview
