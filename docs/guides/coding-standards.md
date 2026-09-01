# Padrões de código

Regras que a revisão vai cobrar. O objetivo não é uniformidade estética — é que
qualquer pessoa do time consiga ler qualquer arquivo sem precisar decifrar o
estilo pessoal de quem escreveu.

Formatação é resolvida pelo Prettier e não se discute em PR.

## TypeScript

### `any` é bug

```ts
// não
function process(data: any) {
  /* ... */
}

// sim — se o tipo é desconhecido, diga isso e restrinja
function process(data: unknown) {
  const parsed = noteSchema.parse(data);
}
```

`unknown` obriga a validar antes de usar. `any` desliga o compilador exatamente
onde ele mais serviria.

### Nomes dizem o que a coisa é

```ts
// não
const d = new Date();
const list = notes.filter((n) => !n.deletedAt);

// sim
const now = new Date();
const activeNotes = notes.filter((note) => note.deletedAt === null);
```

Booleano começa com `is`, `has` ou `can`. Função começa com verbo. Nada de
abreviação além das universais (`id`, `url`, `api`).

### Retorno antecipado em vez de aninhamento

```ts
// não
function update(note: Note | null, input: UpdateInput) {
  if (note) {
    if (note.ownerId === input.userId) {
      return applyUpdate(note, input);
    } else {
      throw new ForbiddenError();
    }
  } else {
    throw new NotFoundError();
  }
}

// sim
function update(note: Note | null, input: UpdateInput) {
  if (!note) throw new NotFoundError();
  if (note.ownerId !== input.userId) throw new NotFoundError();
  return applyUpdate(note, input);
}
```

### Erros são tipados

Nunca `throw new Error('deu ruim')`. Use as classes de erro de domínio, que o
exception filter traduz para o `code` correto do
[catálogo](../api/errors.md).

### Comentários explicam por quê

```ts
// não: repete o código
// incrementa a versão
note.version += 1;

// sim: explica a decisão
// A versão precisa subir mesmo quando só metadados mudam: o cliente mobile
// usa esse número para detectar conflito, e não compara campo a campo.
note.version += 1;
```

Código que precisa de comentário para explicar **o quê** normalmente precisa de
um nome melhor, não de um comentário.

## Backend

- Controller não tem regra de negócio. Se tem `if` de domínio, está no lugar errado.
- Caso de uso depende de interface, nunca de `PrismaService` direto
  ([architecture/backend.md](../architecture/backend.md)).
- Validação de entrada com Zod, sempre — inclusive limites de tamanho.
- Consulta ao banco sempre escopada por `userId` na cláusula `where`, nunca
  filtrada depois ([security.md](../architecture/security.md)).
- Nada de `process.env` fora do `ConfigService`.
- Consulta dentro de laço é bug de desempenho: use `include`, `in` ou uma query só.

## Frontend

- `'use client'` o mais fundo possível na árvore.
- Estado de servidor no TanStack Query; estado de UI no componente. Nunca duplique
  dado de servidor em store global.
- Componente com mais de ~150 linhas ou mais de uma responsabilidade: divida.
- Toda ação interativa precisa funcionar por teclado.
- Nada de `useEffect` para derivar estado — derive na renderização.

## Flutter

- `const` em todo widget que puder ser constante.
- View não conversa com rede nem com repositório: só com o ViewModel.
- ViewModel não conhece service — só repositório.
- `BuildContext` não atravessa as camadas de dados.
- Dependência entra por construtor; `getIt` só no `initModule` e nas rotas.
- Ação assíncrona disparada pela UI vira `Command`, não `Future` solta.
- Erro esperado volta como `Result`, não como exceção — consumido com `fold`,
  que obriga a tratar os dois caminhos.
- Nenhum `print` em código de produção — use o logger.

## Testes

Nome de teste descreve comportamento, não implementação:

```ts
// não
it('deve chamar o repositório', ...)

// sim
it('rejeita a atualização quando a versão enviada está desatualizada', ...)
```

Estrutura arrange–act–assert, com uma asserção conceitual por teste. Detalhes em
[testing.md](testing.md).

## Organização de arquivos

- Um conceito por arquivo. `notes.service.ts` não abriga `TagsService`.
- Nome de arquivo em `kebab-case` com sufixo de papel: `create-note.use-case.ts`.
- Import ordenado: bibliotecas, depois pacotes internos (`@mynotes/*`), depois
  relativos. O ESLint ordena automaticamente.
- Nada de `index.ts` que só reexporta tudo — dificulta rastrear a origem de um símbolo.

## O que a revisão bloqueia

- [ ] `any`, `@ts-ignore` ou `eslint-disable` sem comentário justificando
- [ ] Consulta ao banco sem escopo de usuário
- [ ] Segredo, token ou dado real no código ou nos testes
- [ ] Mudança de comportamento sem teste
- [ ] Mudança de contrato de API sem atualizar o OpenAPI
- [ ] `console.log` esquecido
- [ ] Migration destrutiva sem plano de rollback
