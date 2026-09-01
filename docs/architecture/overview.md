# Visão geral da arquitetura

## O que o MyNotes é

Uma plataforma de notas pessoais com três superfícies — API, web e mobile — sobre
um único domínio. A regra que organiza tudo: **o servidor é a autoridade sobre o
domínio; os clientes são caches inteligentes dele.**

Três características moldam o desenho:

1. **Multiplataforma de verdade** — a mesma nota, coerente em qualquer superfície.
2. **Offline-first no mobile** — escrever sem rede é o caso normal.
3. **Contrato antes da implementação** — o OpenAPI é escrito antes do código
   ([ADR-0007](../adr/0007-contrato-api-openapi-first.md)).

## Nível 1 — Contexto

```mermaid
graph TB
    U["👤 Usuário"]

    subgraph MyNotes
        WEB["Aplicação Web<br/>Next.js"]
        APP["App Flutter<br/>5 plataformas"]
        API["API REST<br/>NestJS"]
        DB[("PostgreSQL")]
    end

    S3["Object Storage<br/>S3 / MinIO"]
    MAIL["Serviço de e-mail<br/>SMTP"]

    U --> WEB
    U --> APP
    WEB -->|HTTPS / JSON| API
    APP -->|HTTPS / JSON| API
    API --> DB
    API --> S3
    API --> MAIL
```

## Nível 2 — Contêineres

```mermaid
graph TB
    subgraph Clientes
        WEB["Next.js 16<br/>App Router + RSC<br/>:3000"]
        APP["Flutter 3.41<br/>MVVM + get_it"]
    end

    subgraph Servidor
        API["NestJS 12<br/>/api/v1 · :3333"]
        WORKER["Workers BullMQ<br/>jobs assíncronos"]
    end

    subgraph Dados
        PG[("PostgreSQL 17<br/>dados + full-text search")]
        REDIS[("Redis 7<br/>cache · rate limit<br/>denylist de tokens · filas")]
        S3["Object Storage<br/>anexos"]
    end

    WEB -->|"JSON + cookie httpOnly"| API
    APP -->|"JSON + Bearer token"| API
    APP -.->|"delta sync"| API
    API --> PG
    API --> REDIS
    API -->|"URL pré-assinada"| S3
    APP -.->|"upload direto"| S3
    WEB -.->|"upload direto"| S3
    REDIS --> WORKER
    WORKER --> PG
```

Por que o upload de anexo vai direto ao storage: o binário nunca passa pela API.
Ela apenas assina uma URL temporária e registra o metadado. Isso mantém a API
leve e o custo de banda previsível.

## Nível 3 — Componentes da API

```mermaid
graph LR
    subgraph "Camada HTTP"
        C["Controllers"]
        G["Guards<br/>auth · roles · throttle"]
        F["Exception Filter<br/>problem+json"]
        I["Interceptors<br/>log · timeout · serialização"]
    end

    subgraph "Camada de aplicação"
        S["Services / Casos de uso"]
        D["DTOs + validação Zod"]
    end

    subgraph "Camada de domínio"
        E["Entidades e regras"]
        P["Portas (interfaces)"]
    end

    subgraph "Camada de infraestrutura"
        R["Repositórios Prisma"]
        ST["Adaptador S3"]
        MA["Mailer"]
    end

    C --> G --> S
    C --> D
    S --> E
    S --> P
    P -.implementado por.-> R
    P -.implementado por.-> ST
    P -.implementado por.-> MA
    C --> I
    C --> F
```

A seta pontilhada é o ponto importante: o domínio declara **portas**; a
infraestrutura as implementa. O domínio não sabe que Prisma existe — o que
permite testar regras de negócio sem banco.

## Fluxo: criar uma nota pela web

```mermaid
sequenceDiagram
    participant U as Usuário
    participant W as Next.js
    participant A as API NestJS
    participant DB as PostgreSQL

    U->>W: escreve e para de digitar (debounce 800 ms)
    W->>W: atualização otimista no cache do TanStack Query
    W->>A: POST /api/v1/notes (cookie httpOnly)
    A->>A: JwtAuthGuard valida o access token
    A->>A: ValidationPipe valida o corpo (Zod)
    A->>DB: INSERT + geração do tsvector de busca
    DB-->>A: nota persistida
    A-->>W: 201 Created + Location
    W->>W: reconcilia o cache com a resposta

    Note over W,A: Se falhar, o cache reverte e a nota<br/>fica em rascunho local no navegador
```

## Fluxo: sincronização do app mobile

```mermaid
sequenceDiagram
    participant App as Flutter
    participant Q as Fila local (banco)
    participant A as API

    Note over App: offline
    App->>Q: enfileira create/update/delete
    App->>App: grava no SQLite e mostra na UI

    Note over App: rede volta
    App->>A: POST /sync/push (operações pendentes)
    A-->>App: aplicadas + conflitos detectados
    App->>A: GET /sync/pull?cursor=...
    A-->>App: mudanças desde o cursor + novo cursor
    App->>App: aplica, resolve conflitos, atualiza cursor
```

Detalhes de conflito e limites em [offline-sync.md](offline-sync.md).

## Princípios

| Princípio                             | Consequência prática                                                          |
| ------------------------------------- | ----------------------------------------------------------------------------- |
| **O servidor é a autoridade**         | Nenhum cliente inventa regra de negócio; validação do servidor é a que vale.  |
| **Contrato antes do código**          | Mexeu na API? O `openapi.yaml` muda primeiro, na mesma PR.                    |
| **Domínio independente de framework** | Regras de negócio testáveis sem HTTP e sem banco.                             |
| **Explícito melhor que mágico**       | Sem injeção implícita obscura, sem `any`, sem configuração adivinhada de env. |
| **Toda decisão relevante vira ADR**   | Ninguém precisa arqueologia de Git para entender uma escolha.                 |
| **Erro é parte do contrato**          | Todo erro sai em `problem+json` com um código estável e documentado.          |

## Limites conhecidos

Escolhas conscientes desta versão, com o gatilho para revisitar cada uma:

| Limite                                | Por quê                                                             | Revisitar quando                                         |
| ------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------- |
| Sem edição colaborativa em tempo real | CRDT/OT multiplicaria a complexidade do sync                        | Houver demanda real de coautoria simultânea              |
| Sem criptografia ponta a ponta        | Impede busca no servidor e recuperação de conta                     | Surgir requisito de privacidade que justifique o custo   |
| Monolito modular na API               | Time pequeno; microsserviços custam mais do que entregam aqui       | Um módulo precisar escalar ou ser implantado em separado |
| Busca no Postgres, sem Elasticsearch  | `tsvector` + `unaccent` resolve bem até a ordem de milhões de notas | A busca virar gargalo medido, não suposto                |
