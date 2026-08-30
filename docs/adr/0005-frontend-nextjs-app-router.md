# ADR-0005 — Next.js com App Router no frontend

- **Status**: Aceita
- **Data**: 2026-08-28

## Contexto

A aplicação web precisa de: carregamento rápido da lista de notas, um editor
altamente interativo, boas URLs compartilháveis e um lugar seguro para guardar
tokens de sessão.

Esse último ponto é o que restringe de verdade: sem um servidor sob nosso controle,
o token acaba em `localStorage`, exposto a qualquer XSS.

## Decisão

**Next.js 16 com App Router**, React Server Components por padrão e
`'use client'` apenas onde há interatividade real.

Tokens ficam em cookies `httpOnly` administrados por route handlers do próprio
Next.js, que funcionam como um BFF fino diante da API.

## Alternativas consideradas

### SPA com Vite + React Router

Mais simples, build mais rápido, mental model direto. **Descartada**: sem servidor
próprio, o refresh token cairia em `localStorage`. Some-se a isso o carregamento
inicial pior e a ausência de SEO para páginas públicas de notas compartilhadas.

### Remix / React Router framework

Excelente modelo de dados e formulários. **Descartada** por decisão de ecossistema:
o time já conhece Next.js e a documentação e o mercado de bibliotecas em volta dele
são maiores. Não é um julgamento técnico contra o Remix.

### Next.js com Pages Router

Estável e conhecido. **Descartada**: sem RSC, todo o carregamento de dados vai para
o cliente, aumentando o bundle e o tempo até a primeira nota aparecer. O App Router
é para onde o ecossistema está indo.

### SvelteKit ou Nuxt

Ótimos frameworks. **Descartada**: mudaria a linguagem de componentes do projeto e
inviabilizaria compartilhar o design system entre superfícies React.

## Consequências

### Positivas

- Refresh token em cookie `httpOnly`: XSS não o alcança.
- Lista inicial de notas renderizada no servidor — primeira pintura rápida.
- Route handlers dão um BFF sem precisar de um serviço separado.
- Streaming e Suspense melhoram a percepção de velocidade em listas grandes.

### Negativas

- A fronteira servidor/cliente é fonte real de confusão; exige disciplina e revisão.
- Um salto de rede extra em requisições que passam pelo BFF.
- O App Router evolui rápido: atualizações de versão maior pedem atenção.
- Hospedagem exige Node em execução (não é site estático).

## Quando revisitar

Se a complexidade do App Router se mostrar um custo recorrente de manutenção
maior que o benefício de segurança — cenário em que uma SPA com BFF separado
voltaria à mesa.
