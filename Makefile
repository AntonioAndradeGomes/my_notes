# MyNotes — atalhos de desenvolvimento.
# `make help` lista todos os alvos disponíveis.

SHELL := /bin/bash
.DEFAULT_GOAL := help
COMPOSE := docker compose --env-file .env -f docker/docker-compose.yml
API_PORT := 3333

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

.PHONY: api
api: db ## Sobe SÓ a API, com hot reload (http://localhost:3333/api/v1)
	@# Interromper o watch do Nest costuma deixar o processo filho vivo segurando
	@# a porta. Distinguimos "já está rodando" de "porta travada": no primeiro
	@# caso o estado desejado ja e verdade, entao nao ha erro a reportar.
	@pid=$$(lsof -t -nP -iTCP:$(API_PORT) -sTCP:LISTEN 2>/dev/null | head -1); \
	if [ -n "$$pid" ]; then \
		if curl -sf -m 2 http://localhost:$(API_PORT)/api/v1/health/live >/dev/null 2>&1; then \
			echo "A API ja esta rodando na porta $(API_PORT) (PID $$pid) e respondendo."; \
			echo "O watch recarrega sozinho ao salvar — nao precisa subir de novo."; \
			echo "Para reiniciar mesmo assim:  make stop-api && make api"; \
			exit 0; \
		fi; \
		echo "Porta $(API_PORT) ocupada pelo PID $$pid, que nao responde no health check."; \
		echo "Se for uma execucao travada da API:  make stop-api"; \
		echo "Para ver o que e:  lsof -nP -iTCP:$(API_PORT) -sTCP:LISTEN"; \
		exit 1; \
	fi; \
	exec pnpm --filter @mynotes/api dev

.PHONY: stop-api
stop-api: ## Encerra a API que ficou segurando a porta
	@pids=$$(lsof -t -nP -iTCP:$(API_PORT) -sTCP:LISTEN 2>/dev/null); \
	if [ -n "$$pids" ]; then kill $$pids && echo "Encerrado(s): $$pids"; \
	else echo "Porta $(API_PORT) já está livre."; fi

.PHONY: db
db: .env ## Sobe só o Postgres e espera ficar saudável
	@# --wait segura até o healthcheck passar: sem isso a API pode tentar
	@# conectar antes de o Postgres aceitar conexões, num start a frio.
	@$(COMPOSE) up -d --wait postgres

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
