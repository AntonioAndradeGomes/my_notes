# Catálogo de erros

Todo erro responde `application/problem+json`, conforme a RFC 9457
([ADR-0009](../adr/0009-erros-problem-details.md)).

```json
{
  "type": "https://docs.mynotes.app/errors/validation-failed",
  "title": "Falha de validação",
  "status": 422,
  "detail": "O campo 'title' excede o tamanho máximo de 255 caracteres.",
  "instance": "/api/v1/notes",
  "code": "VALIDATION_FAILED",
  "requestId": "018f2e9a-7c3b-7000-8000-a1b2c3d4e5f6",
  "errors": [{ "field": "title", "code": "max_length", "message": "Máximo de 255 caracteres." }]
}
```

**Programe contra `code`.** `title` e `detail` são texto para humanos e podem ser
reescritos a qualquer momento; `code` é contrato.

## Autenticação e sessão

| `code`                 | HTTP | Significado                           | O que o cliente faz                           |
| ---------------------- | ---- | ------------------------------------- | --------------------------------------------- |
| `UNAUTHENTICATED`      | 401  | Token ausente ou malformado           | Redireciona para login                        |
| `TOKEN_EXPIRED`        | 401  | Access token expirado                 | Chama `/auth/refresh` e repete                |
| `TOKEN_INVALID`        | 401  | Assinatura inválida                   | Descarta a sessão, redireciona para login     |
| `REFRESH_TOKEN_REUSED` | 401  | Refresh já consumido — possível roubo | Limpa tudo, força novo login, avisa o usuário |
| `INVALID_CREDENTIALS`  | 401  | E-mail ou senha incorretos            | Mensagem genérica, sem dizer qual dos dois    |
| `ACCOUNT_LOCKED`       | 423  | Muitas tentativas falhas              | Mostra o tempo de espera                      |

## Validação

| `code`                   | HTTP | Significado                                          |
| ------------------------ | ---- | ---------------------------------------------------- |
| `VALIDATION_FAILED`      | 422  | Um ou mais campos inválidos — detalhes em `errors[]` |
| `MALFORMED_REQUEST`      | 400  | Corpo não é JSON válido                              |
| `UNSUPPORTED_MEDIA_TYPE` | 415  | `Content-Type` não suportado                         |
| `PAYLOAD_TOO_LARGE`      | 413  | Corpo acima do limite                                |

Códigos usados em `errors[].code`: `required`, `invalid_type`, `invalid_format`,
`min_length`, `max_length`, `min_value`, `max_value`, `pattern`, `invalid_enum`,
`not_unique`.

## Recursos

| `code`             | HTTP | Significado                                       |
| ------------------ | ---- | ------------------------------------------------- |
| `NOT_FOUND`        | 404  | Não existe, ou pertence a outro usuário           |
| `ALREADY_EXISTS`   | 409  | Violação de unicidade (e-mail, nome de tag)       |
| `VERSION_CONFLICT` | 409  | Concorrência otimista — `serverState` acompanha   |
| `RESOURCE_GONE`    | 410  | Apagado definitivamente; não é restaurável        |
| `NOT_IN_TRASH`     | 409  | Tentou restaurar uma nota que não está na lixeira |

## Domínio

| `code`                    | HTTP | Significado                               |
| ------------------------- | ---- | ----------------------------------------- |
| `NOTEBOOK_CYCLE`          | 422  | O caderno viraria ancestral de si mesmo   |
| `NOTEBOOK_TOO_DEEP`       | 422  | Ultrapassa os 3 níveis de aninhamento     |
| `TAG_LIMIT_EXCEEDED`      | 422  | Mais de 50 tags em uma nota               |
| `NOTE_TOO_LARGE`          | 413  | Conteúdo acima de 1 MiB                   |
| `ATTACHMENT_TOO_LARGE`    | 413  | Anexo acima de 25 MB                      |
| `ATTACHMENT_TYPE_BLOCKED` | 422  | Tipo de arquivo não permitido             |
| `STORAGE_QUOTA_EXCEEDED`  | 507  | Cota de armazenamento do usuário esgotada |

## Sincronização

| `code`                 | HTTP | Significado                                                        |
| ---------------------- | ---- | ------------------------------------------------------------------ |
| `SYNC_CURSOR_INVALID`  | 422  | Cursor corrompido ou de formato antigo — refazer sync completo     |
| `SYNC_CURSOR_TOO_OLD`  | 409  | Cliente offline além da janela de retenção — refazer sync completo |
| `SYNC_BATCH_TOO_LARGE` | 422  | Mais de 100 operações em um push                                   |

Os dois primeiros exigem a mesma reação: descartar o cursor e fazer um pull
completo. É a única forma segura de voltar a um estado consistente.

## Limites e disponibilidade

| `code`                | HTTP | Significado            | Repetir?                |
| --------------------- | ---- | ---------------------- | ----------------------- |
| `RATE_LIMITED`        | 429  | Limite excedido        | Sim, após `Retry-After` |
| `INTERNAL_ERROR`      | 500  | Falha inesperada       | Sim, com backoff        |
| `SERVICE_UNAVAILABLE` | 503  | Dependência fora do ar | Sim, com backoff        |
| `TIMEOUT`             | 504  | Operação excedeu 30 s  | Sim, com backoff        |

## Regras de tratamento

**Repita** em `429`, `500`, `503` e `504` — com backoff exponencial e jitter.
**Nunca repita** em `4xx` fora dessa lista: o resultado será o mesmo.

**Nunca** exiba `detail` cru ao usuário final. Ele é escrito para quem depura.
Mapeie o `code` para uma mensagem de produto.

**Sempre** registre o `requestId` no seu log de cliente. É o que permite ao suporte
localizar a requisição exata no servidor.

## Do lado do servidor

- Nenhum `detail` pode conter stack trace, SQL, nome de tabela ou valor de campo
  sensível. Em produção, erros `500` respondem uma mensagem genérica; o detalhe
  fica no log, correlacionado pelo `requestId`.
- Todo `code` novo entra neste arquivo **na mesma PR** que o introduz. Um teste
  de contrato verifica que todo código emitido pela aplicação está catalogado aqui.
