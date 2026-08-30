# ADR-0002 — NestJS como framework do backend

- **Status**: Aceita
- **Data**: 2026-08-28

## Contexto

O backend precisa servir três clientes, sustentar autenticação, sincronização e
jobs assíncronos, e continuar legível conforme o número de módulos cresce. O time
é TypeScript-first.

Sem uma estrutura imposta, projetos Node tendem a virar uma pasta `services/` com
arquivos de mil linhas — a estrutura precisa vir de algum lugar.

## Decisão

NestJS 12, em arquitetura de **monolito modular** com camadas explícitas
(HTTP → aplicação → domínio ← infraestrutura), detalhada em
[architecture/backend.md](../architecture/backend.md).

## Alternativas consideradas

### Express ou Fastify puro

Mais leve, mais controle, sem "mágica" de decorators. **Descartada**: cada projeto
acaba reinventando injeção de dependência, validação, modularização e o ciclo de
vida da aplicação — mal e de forma incompatível com o próximo projeto. NestJS traz
isso pronto e, principalmente, **convencionado**.

### Fastify puro com uma camada própria

Desempenho bruto superior. **Descartada**: o gargalo do MyNotes é banco e I/O, não
o roteador HTTP. Ganhar 15% de throughput no framework não compensa construir e
manter a estrutura à mão. (E o NestJS roda sobre Fastify se isso mudar.)

### Backend em outra linguagem (Go, Java/Spring, .NET)

Cada um com méritos reais. **Descartada**: TypeScript no backend permite
compartilhar schemas Zod, tipos e validação com o frontend via `@mynotes/contracts`.
Manter uma linguagem só reduz troca de contexto num time pequeno.

## Consequências

### Positivas

- Estrutura modular imposta pelo framework: onde colocar cada coisa é uma
  pergunta já respondida.
- Injeção de dependência de primeira classe — o que torna o domínio testável sem banco.
- Ecossistema maduro para o que precisamos: Passport, Throttler, Terminus, BullMQ, Swagger.
- Guards, interceptors e filters resolvem preocupações transversais sem repetição.

### Negativas

- Decorators e metadados têm curva de aprendizado para quem vem de Express.
- Boilerplate: um recurso novo nasce com módulo, controller, service e DTOs.
- Overhead de inicialização maior — irrelevante em servidor de longa duração,
  mas notável se um dia houver serverless.

## Quando revisitar

Se um módulo precisar de escala independente do resto (candidato natural: `sync`),
extrai-se aquele módulo — sem trocar o framework dos demais.
