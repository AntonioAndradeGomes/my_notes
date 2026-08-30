# ADR-0009 — Erros em `application/problem+json` (RFC 9457)

- **Status**: Aceita
- **Data**: 2026-08-28

## Contexto

Três clientes precisam tratar erro de forma consistente: mostrar mensagem ao
usuário, decidir se vale repetir a requisição, destacar o campo inválido no
formulário. Para isso, o corpo do erro precisa ser estruturado e previsível.

O padrão default do NestJS (`{ statusCode, message, error }`) é inconsistente:
`message` às vezes é string, às vezes é array. Cada cliente acaba escrevendo o
próprio adaptador para adivinhar.

## Decisão

Todo erro responde `application/problem+json` conforme a **RFC 9457**, com
extensões nossas:

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

- **`code`** — string estável em `SCREAMING_SNAKE_CASE`. É o que o cliente
  programa contra; `title` e `detail` são para humanos e podem mudar de redação.
- **`requestId`** — correlaciona com os logs do servidor. O usuário reporta o
  problema citando esse id.
- **`errors`** — só em erros de validação, com um item por campo.

O catálogo completo está em [api/errors.md](../api/errors.md).

## Alternativas consideradas

### Formato default do NestJS

**Descartada**: inconsistente entre exceções, sem código estável, sem correlação
com logs.

### Envelope próprio (`{ success: false, error: {...} }`)

**Descartada**: reinventa um padrão que já existe. Usar um RFC significa que
qualquer pessoa nova no projeto — e boa parte das ferramentas — já entende o formato.

### JSON:API errors

**Descartada**: traz junto todo o resto da especificação JSON:API, que não usamos
para respostas de sucesso. Misturar as duas convenções é pior que escolher uma.

## Consequências

### Positivas

- Um único formato de erro, para os três clientes.
- `code` estável permite tratamento programático sem depender de texto.
- `requestId` liga o relato do usuário ao rastro no servidor.
- `Content-Type` correto permite que ferramentas reconheçam o corpo.

### Negativas

- Exige um exception filter global bem testado, incluindo os erros que não passam
  por ele naturalmente (falhas do próprio framework).
- Todo erro novo precisa entrar no catálogo — disciplina de manutenção.
- É preciso vigiar para que `detail` nunca vaze informação interna (stack trace,
  SQL, nome de tabela).

## Quando revisitar

Não há gatilho previsto. É um padrão estável.
