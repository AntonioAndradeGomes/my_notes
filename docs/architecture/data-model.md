# Modelo de dados

PostgreSQL 17. Toda tabela usa `uuid` v7 como chave primária — ordenável no tempo,
o que preserva a localidade de índice sem revelar sequência de crescimento como um
`serial` faria.

## Diagrama

```mermaid
erDiagram
    User ||--o{ Note : "possui"
    User ||--o{ Notebook : "possui"
    User ||--o{ Tag : "possui"
    User ||--o{ Session : "tem"
    Notebook ||--o{ Note : "contém"
    Notebook ||--o{ Notebook : "aninha"
    Note }o--o{ Tag : "NoteTag"
    Note ||--o{ Attachment : "tem"
    Note ||--o{ NoteVersion : "historiza"
    Note ||--o{ Share : "compartilha"

    User {
        uuid id PK
        citext email UK
        text name
        text password_hash
        timestamptz created_at
        timestamptz updated_at
    }

    Session {
        uuid id PK
        uuid user_id FK
        text refresh_token_hash UK
        text device_name
        inet ip_address
        timestamptz expires_at
        timestamptz revoked_at
        timestamptz created_at
    }

    Notebook {
        uuid id PK
        uuid user_id FK
        uuid parent_id FK
        text name
        text color
        int position
        timestamptz created_at
        timestamptz updated_at
    }

    Note {
        uuid id PK
        uuid user_id FK
        uuid notebook_id FK
        text title
        text content
        text content_preview
        tsvector search_vector
        bool is_pinned
        bool is_archived
        timestamptz deleted_at
        bigint version
        timestamptz client_updated_at
        timestamptz created_at
        timestamptz updated_at
    }

    Tag {
        uuid id PK
        uuid user_id FK
        citext name
        text color
        timestamptz created_at
    }

    NoteTag {
        uuid note_id FK
        uuid tag_id FK
    }

    Attachment {
        uuid id PK
        uuid note_id FK
        text storage_key
        text filename
        text mime_type
        bigint size_bytes
        timestamptz created_at
    }

    NoteVersion {
        uuid id PK
        uuid note_id FK
        text title
        text content
        bigint version
        timestamptz created_at
    }

    Share {
        uuid id PK
        uuid note_id FK
        uuid shared_with_user_id FK
        text public_token UK
        text permission
        timestamptz expires_at
        timestamptz created_at
    }
```

> **Escopo da v1**: `User` guarda apenas nome completo, e-mail, senha e as datas.
> Avatar, preferências de interface e verificação de e-mail entram em fases
> posteriores — como colunas anuláveis, o que os torna uma migration aditiva e
> uma mudança retrocompatível de contrato.

## Decisões por trás do modelo

### `citext` para e-mail e nome de tag

`Joao@Exemplo.com` e `joao@exemplo.com` são a mesma pessoa; `Trabalho` e `trabalho`
são a mesma tag. Resolver isso no tipo da coluna evita normalização espalhada pela
aplicação — e o índice único passa a valer de fato.

### `deleted_at` em vez de `DELETE`

A lixeira é um requisito do produto: nota apagada por engano precisa voltar. Um
job diário faz o expurgo definitivo depois de 30 dias. Toda consulta de listagem
filtra `deleted_at IS NULL` — e isso vira um índice parcial, não um `WHERE` caro.

### `version` e `client_updated_at`

Os dois campos existem para a sincronização:

- `version` — inteiro incrementado a cada escrita no servidor. É a base do
  controle de concorrência otimista: o cliente manda a versão que ele viu; se não
  bate, houve conflito.
- `client_updated_at` — quando o cliente editou, no relógio dele. Serve para
  desempatar conflitos e para exibir "editado há X" de forma honesta em modo offline.

Detalhes em [offline-sync.md](offline-sync.md).

### `search_vector` materializado

Coluna gerada, mantida por trigger, com pesos: título tem peso `A`, conteúdo peso `B`.
Uma busca por "reunião" acha primeiro as notas cujo **título** fala de reunião.

```sql
ALTER TABLE notes ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('portuguese', unaccent(coalesce(title, ''))), 'A') ||
    setweight(to_tsvector('portuguese', unaccent(coalesce(content, ''))), 'B')
  ) STORED;

CREATE INDEX notes_search_idx ON notes USING GIN (search_vector);
```

`unaccent` importa: em português, ninguém digita "reunião" com til na pressa.

### `content_preview`

Primeiros ~200 caracteres do conteúdo em texto plano, desnormalizados. A listagem
de notas não carrega o corpo inteiro de cada uma — o que muda o custo de rolar uma
lista de mil notas de megabytes para kilobytes.

### Hierarquia de cadernos

`parent_id` auto-referente, com profundidade limitada a 3 níveis pela aplicação.
Além disso a navegação vira confusa e as consultas recursivas ficam caras sem
ganho real para o usuário.

## Índices

| Índice                   | Colunas                                               | Serve a                      |
| ------------------------ | ----------------------------------------------------- | ---------------------------- |
| `notes_user_updated_idx` | `(user_id, updated_at DESC) WHERE deleted_at IS NULL` | Listagem padrão              |
| `notes_notebook_idx`     | `(notebook_id) WHERE deleted_at IS NULL`              | Notas de um caderno          |
| `notes_search_idx`       | GIN `(search_vector)`                                 | Busca full-text              |
| `notes_sync_idx`         | `(user_id, updated_at)`                               | Delta sync                   |
| `notes_trash_idx`        | `(deleted_at) WHERE deleted_at IS NOT NULL`           | Job de expurgo               |
| `sessions_token_idx`     | `(refresh_token_hash)` único                          | Refresh e revogação          |
| `tags_user_name_idx`     | `(user_id, name)` único                               | Unicidade de tag por usuário |

Os índices parciais não são detalhe de otimização prematura: sem eles, o `WHERE
deleted_at IS NULL` presente em quase toda consulta força varreduras
desnecessárias.

## Integridade

- Toda FK de posse tem `ON DELETE CASCADE` a partir de `User`: apagar a conta
  apaga os dados, sem órfãos.
- `notebook_id` em `notes` é `ON DELETE SET NULL`: apagar um caderno não pode
  apagar as notas dentro dele — elas voltam para a raiz.
- `CHECK (char_length(title) <= 255)` e limite de conteúdo aplicados no banco, não
  só no DTO: o banco é a última linha de defesa.

## Convenções

- Nomes de tabela no plural e em `snake_case`; no Prisma, `@@map` faz a ponte com
  o `PascalCase` do modelo.
- Toda tabela tem `created_at`; toda tabela mutável tem `updated_at`.
- Nada de `float` para dinheiro ou contagem — não há dinheiro aqui, mas a regra fica.
- Migration nova nunca edita uma migration já aplicada. Corrige-se com uma nova.
