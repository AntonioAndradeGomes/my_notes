# ADR-0004 — Autenticação JWT com refresh rotativo

- **Status**: Aceita
- **Data**: 2026-08-28
- **Relacionadas**: [ADR-0005](0005-frontend-nextjs-app-router.md), [ADR-0006](0006-mobile-flutter-riverpod.md)

## Contexto

Três clientes precisam autenticar: navegador, Android e iOS. Sessão por cookie
puro atende bem a web mas é desconfortável no mobile; JWT puro atende o mobile mas
não permite revogação real.

Requisitos: sessões longas (ninguém quer relogar no celular toda semana),
revogação imediata ("desconectar todos os dispositivos") e resistência a roubo de
token.

## Decisão

Autenticação própria, com **par de tokens**:

- **Access token**: JWT HS256, 15 minutos, sem estado, validado por assinatura.
- **Refresh token**: valor opaco de 256 bits, 30 dias, com hash SHA-256 no banco,
  **rotacionado a cada uso** e com **detecção de reuso**.

Reuso de um refresh já consumido revoga **todas** as sessões do usuário.
Fluxo completo em [architecture/security.md](../architecture/security.md).

## Alternativas consideradas

### Sessão por cookie com estado no servidor

Simples, revogação trivial. **Descartada**: exige consulta ao store a cada
requisição e encaixa mal no app mobile, que não tem gerenciamento de cookies
tão natural.

### JWT longo, sem refresh

Menos peças móveis. **Descartada**: sem revogação. Um token roubado vale até
expirar. Reduzir a validade para compensar significaria relogin constante.

### Refresh token como JWT

Comum, e errado para o nosso caso. **Descartada**: um JWT de refresh continua
válido depois de "revogado", a menos que se mantenha uma denylist — que é estado
no servidor de qualquer forma. Sendo assim, é melhor que o token seja opaco desde
o início: sem informação vazada e com revogação real.

### Provider gerenciado (Auth0, Clerk, Supabase Auth)

Menos código nosso, MFA e social login prontos. **Descartada** para esta fase:
custo por usuário ativo, dependência de terceiro no caminho crítico de login, e
menos controle sobre o fluxo de sincronização mobile. A decisão é reversível — o
módulo `auth` está isolado.

## Consequências

### Positivas

- Revogação real e imediata, por sessão ou global.
- Roubo de refresh token é **detectável**: o uso duplicado dispara o alarme.
- Access token sem estado: a maioria das requisições não toca o banco para autenticar.
- Mesma mecânica nas três plataformas, com armazenamento adequado a cada uma.
- Lista de sessões ativas por dispositivo, visível ao usuário.

### Negativas

- Mais código para escrever e testar que uma solução pronta.
- A rotação exige cuidado com concorrência: duas requisições renovando ao mesmo
  tempo não podem ser lidas como roubo (resolvido com janela de tolerância de
  poucos segundos por `opId` de refresh).
- Segredos de JWT precisam ser rotacionáveis — o que exige suporte a dois segredos
  ativos durante a transição.

## Quando revisitar

Ao surgir demanda por SSO corporativo, MFA ou login social em escala — aí um
provider gerenciado pode passar a compensar.
