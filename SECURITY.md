# Política de segurança

## Reportando uma vulnerabilidade

**Não abra uma issue pública.** Uma issue expõe a falha antes que exista correção.

Use um destes canais:

1. [Security Advisory privado](https://github.com/gomesmax1997/mynotes/security/advisories/new) — preferido
2. E-mail para `seguranca@mynotes.app`

### O que incluir

- Tipo da vulnerabilidade e componente afetado
- Passos para reproduzir, ou prova de conceito
- Impacto: o que um atacante consegue fazer
- Versão ou commit testado

Quanto mais específico, mais rápida a correção.

### O que esperar

| Etapa                          | Prazo           |
| ------------------------------ | --------------- |
| Confirmação de recebimento     | 48 horas        |
| Avaliação inicial e severidade | 5 dias úteis    |
| Correção (crítica)             | 7 dias          |
| Correção (alta)                | 30 dias         |
| Correção (média/baixa)         | Próxima release |

Mantemos você informado do progresso e creditamos a descoberta no advisory, se
você quiser.

## Divulgação coordenada

Pedimos 90 dias antes da divulgação pública, ou até a correção ser publicada — o
que vier primeiro. Se precisarmos de mais tempo, conversamos.

## Escopo

**Dentro do escopo**: código deste repositório, dependências diretas, configuração
de infraestrutura versionada aqui.

**Fora do escopo**: ataques de negação de serviço por volume, engenharia social,
vulnerabilidades em serviços de terceiros (reporte a eles), e problemas que exigem
acesso físico ao dispositivo do usuário.

## Práticas do projeto

- Argon2id para senhas; refresh tokens opacos com hash no banco
- Rotação de refresh token com detecção de reuso
- CodeQL, `pnpm audit` e Gitleaks em toda PR
- Dependabot semanal
- Segredos fora do repositório, rotacionados a cada 90 dias

Detalhes técnicos e modelo de ameaças:
[docs/architecture/security.md](docs/architecture/security.md).
