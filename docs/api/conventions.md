# Convenções da API

Regras que valem para **toda** rota. Quando uma rota precisa fugir delas, isso é
documentado explicitamente no [OpenAPI](openapi.yaml) — e a exceção precisa de
justificativa na PR.

## URL e verbos

- Substantivos no plural: `/notes`, `/tags`, `/users`.
- Hierarquia só quando existe posse real: `/notes/{id}/attachments`.
- Ações que não são CRUD viram sub-recurso com `POST`: `/notes/{id}/restore`.
- `camelCase` em campos JSON; `kebab-case` em segmentos de URL.

| Verbo    | Uso                   | Corpo | Idempotente                       |
| -------- | --------------------- | ----- | --------------------------------- |
| `GET`    | Leitura               | Não   | Sim                               |
| `POST`   | Criação e ações       | Sim   | Não (salvo com `Idempotency-Key`) |
| `PATCH`  | Atualização parcial   | Sim   | Não                               |
| `PUT`    | Substituição completa | Sim   | Sim                               |
| `DELETE` | Remoção               | Não   | Sim                               |

`PATCH` é o padrão para edição. `PUT` só onde a substituição total é a semântica
correta — `/notes/{id}/tags`, por exemplo, substitui o conjunto inteiro.

## Códigos de status

| Código | Quando                                                      |
| ------ | ----------------------------------------------------------- |
| `200`  | Sucesso com corpo                                           |
| `201`  | Recurso criado — sempre com header `Location`               |
| `202`  | Aceito para processamento assíncrono                        |
| `204`  | Sucesso sem corpo                                           |
| `400`  | Requisição malformada (JSON inválido, por exemplo)          |
| `401`  | Não autenticado                                             |
| `403`  | Autenticado, mas sem permissão — **raro aqui** (ver abaixo) |
| `404`  | Não existe, ou não é seu                                    |
| `409`  | Conflito de estado ou de versão                             |
| `413`  | Corpo acima do limite                                       |
| `422`  | Sintaticamente válido, semanticamente inválido              |
| `429`  | Rate limit                                                  |
| `500`  | Erro nosso                                                  |
| `503`  | Dependência indisponível                                    |

**Sobre `403` vs `404`**: acessar recurso de outro usuário responde `404`. Um `403`
confirmaria que o recurso existe — informação que o solicitante não deveria obter.

**Sobre o `Location` em `201`**: a exceção é `POST /users`. Não existe
`GET /users/{id}` — o usuário criado só é legível em `GET /users/me`, já
autenticado. Apontar `Location` para uma rota que não existe seria pior que
omiti-lo.

**Sobre `400` vs `422`**: `400` é para o que nem chega a ser JSON válido; `422` é
para o corpo que se lê perfeitamente mas viola uma regra.

## Paginação

Cursor, não offset:

```http
GET /notes?limit=20
GET /notes?limit=20&cursor=eyJ1IjoiMjAyNi0wOC0yOFQxNDowMDowMFoiLCJpIjoiMDE4Zi4uLiJ9
```

```json
{
  "data": [/* ... */],
  "meta": { "nextCursor": "eyJ1...", "hasMore": true }
}
```

O cursor codifica o par `(updatedAt, id)` — o `id` é o desempate para registros
com o mesmo timestamp, sem o qual a paginação perde ou repete linhas.

Por que não `?page=2`: com notas sendo criadas o tempo todo, offset faz itens
pularem entre páginas. Cursor é estável sob escrita concorrente e não fica mais
lento nas páginas profundas.

Trate o cursor como **opaco**. O formato pode mudar sem aviso.

## Filtros e ordenação

```http
GET /notes?q=reunião&tagIds=018a...,018b...&filter=pinned&sort=updatedAt&order=desc
```

- `tagIds` usa `AND`: a nota precisa ter **todas** as tags.
- `q` é full-text sem sensibilidade a acentos — `reuniao` acha "reunião".
- Combinações inválidas respondem `422`, não são ignoradas em silêncio.

## Datas e fuso

Todo timestamp é ISO 8601 em **UTC**, com `Z` explícito:

```json
{ "updatedAt": "2026-08-28T14:03:11.221Z" }
```

O servidor nunca devolve horário local. A conversão para o fuso do usuário é
responsabilidade do cliente.

## Idempotência

`POST` que cria recurso aceita `Idempotency-Key` (UUID gerado pelo cliente):

```http
POST /notes
Idempotency-Key: 018f2e9a-7c3b-7000-8000-a1b2c3d4e5f6
```

Repetir com a mesma chave devolve a resposta original em vez de criar duplicata.
Chaves valem 24 horas.

No `/sync/push` o mecanismo equivalente é o `opId` por operação — ver
[architecture/offline-sync.md](../architecture/offline-sync.md).

Isso não é refinamento: rede móvel produz timeouts em requisições que **foram**
processadas. Sem idempotência, o retry duplica a nota do usuário.

## Concorrência otimista

`PATCH /notes/{id}` aceita `version`. Se a versão no servidor for diferente:

```http
409 Conflict
{
  "code": "VERSION_CONFLICT",
  "serverState": { "version": 12, "title": "...", "content": "..." }
}
```

O estado do servidor volta junto — o cliente reconcilia sem uma segunda ida à rede.

Omitir `version` aceita last-write-wins. Use isso apenas para campos onde
sobrescrever é inofensivo (fixar, arquivar).

## Rate limiting

Toda resposta traz:

```text
RateLimit-Limit: 300
RateLimit-Remaining: 287
RateLimit-Reset: 42
```

Ao estourar, `429` com `Retry-After`. Cliente deve respeitar o valor, com jitter —
retry sincronizado de muitos clientes é o que transforma pico em queda.

Limites por rota em [architecture/security.md](../architecture/security.md).

## Versionamento

`/api/v1/...`. Regras de compatibilidade em
[ADR-0008](../adr/0008-versionamento-da-api.md).

**Contrato do cliente**: ao receber um valor de enum que não conhece, degrade
graciosamente — não quebre. Um `filter` novo ou um `status` novo de anexo não pode
derrubar um app antigo.

## Campos nulos e ausentes

- `null` = o campo existe e está vazio (`"deletedAt": null` — nota fora da lixeira).
- Ausente em `PATCH` = não mexer neste campo.
- Ausente em resposta = não incluído nesta representação (`content` não vem em listagens).

A diferença importa em `PATCH`: enviar `"deletedAt": null` restaura a nota;
omitir o campo deixa o estado dela intacto.

## Cabeçalhos de correlação

Toda resposta traz `X-Request-Id`. Envie o mesmo valor em `X-Request-Id` na
requisição se quiser correlacionar do seu lado — ele aparece nos logs do servidor
e em todo corpo de erro.
