# Runbook de incidentes

Procedimentos para quando algo quebra em produção. Escritos para serem lidos às
3 da manhã, por alguém com sono — objetivos e sem contexto pressuposto.

## Severidade

| Nível    | Definição                          | Resposta                           | Comunicação           |
| -------- | ---------------------------------- | ---------------------------------- | --------------------- |
| **SEV1** | Fora do ar ou perda de dados       | Imediata, acorda o plantão         | Status page em 15 min |
| **SEV2** | Funcionalidade principal degradada | < 1 h, horário comercial estendido | Status page em 1 h    |
| **SEV3** | Funcionalidade secundária afetada  | Próximo dia útil                   | Nas notas de release  |
| **SEV4** | Cosmético, sem impacto funcional   | Backlog                            | Nenhuma               |

Na dúvida entre dois níveis, **escolha o mais grave**. Rebaixar depois é fácil.

## Primeiros cinco minutos

1. **Confirme o impacto.** Painel de saúde do serviço. É real ou é o alerta?
2. **Declare a severidade** e avise o canal de incidentes.
3. **Pare o sangramento antes de investigar.** Se o incidente começou logo após um
   deploy, reverta primeiro; investigue com o serviço no ar.
4. **Registre a linha do tempo** desde já. Reconstruir depois nunca funciona.

## API fora do ar

**Sintoma**: readiness falhando, 5xx generalizado.

```bash
kubectl get pods -l app=mynotes-api
kubectl logs -l app=mynotes-api --tail=200
kubectl describe pod <pod>
curl -s https://api.mynotes.app/api/v1/health/ready | jq
```

| Causa             | Sinal                                   | Ação                                                |
| ----------------- | --------------------------------------- | --------------------------------------------------- |
| Deploy ruim       | Começou logo após um rollout            | `kubectl rollout undo deployment/mynotes-api`       |
| Banco inacessível | `checks.database.status: down`          | Ver "Banco indisponível"                            |
| OOM               | `OOMKilled` no describe                 | Aumentar o limite de memória e investigar vazamento |
| Config inválida   | Crash no boot, erro de validação de env | Corrigir o segredo e reimplantar                    |

## Latência alta

```bash
# consultas em execução há mais de 30 segundos
SELECT pid, now() - query_start AS duration, state, query
FROM pg_stat_activity
WHERE state != 'idle' AND now() - query_start > interval '30 seconds'
ORDER BY duration DESC;
```

Causas frequentes, em ordem: consulta sem índice após uma migration; pool de
conexões saturado; job pesado competindo com o tráfego; cache do Redis frio após
reinício.

Matar uma consulta travada: `SELECT pg_cancel_backend(<pid>);` — e
`pg_terminate_backend` se o cancel não resolver.

## Banco indisponível

1. Verifique o status da instância no provedor.
2. Verifique conectividade a partir de um pod (`nc -zv <host> 5432`).
3. Confira o número de conexões: `SELECT count(*) FROM pg_stat_activity;`

Se atingiu `max_connections`, o caminho mais rápido é reduzir o tamanho do pool da
aplicação e reiniciar os pods — não aumentar `max_connections` no banco sob pressão.

## Pico de falhas de autenticação

**Sintoma**: `auth_failures_total` ou `REFRESH_TOKEN_REUSED` disparando.

1. Distinga ataque de bug: as falhas vêm de poucos IPs ou de muitos?
2. Ataque distribuído: reforce o rate limit e considere bloqueio no WAF.
3. Muitos `REFRESH_TOKEN_REUSED` legítimos indicam **bug de corrida** na renovação,
   não roubo em massa — verifique se a serialização de refresh concorrente está
   funcionando.
4. Confirmando vazamento: revogue as sessões afetadas e notifique os usuários.

## Fila acumulando

```bash
# profundidade das filas BullMQ
redis-cli --scan --pattern "bull:*:wait" | while read k; do echo "$k $(redis-cli llen "$k")"; done
```

Se um job específico está acumulando, verifique se ele está falhando em loop
(jobs na fila de falhas). Um job com retry infinito consome todos os workers.

## Sincronização quebrada

**Sintoma**: `sync_conflicts_total` anômalo, ou relatos de "minhas notas sumiram".

Prioridade absoluta: **nenhum dado do usuário pode ser perdido**.

1. Verifique se o pull está devolvendo tombstones indevidos — um bug aqui apaga
   notas em todos os dispositivos.
2. Se houver suspeita disso, **desabilite o processamento de exclusões no pull**
   (feature flag) antes de qualquer outra coisa.
3. Notas apagadas indevidamente ficam recuperáveis por 30 dias (soft delete). Não
   rode o job de expurgo até o incidente estar encerrado.

## Restauração de backup

**Último recurso.** Só com aprovação explícita — restaurar significa perder as
escritas feitas depois do ponto de restauração.

1. Confirme o ponto de restauração e o que será perdido.
2. Restaure em uma instância **nova**, nunca por cima da atual.
3. Valide a integridade dos dados na instância restaurada.
4. Só então redirecione a aplicação.

Backups: diários, retenção de 30 dias, criptografados. Restauração testada
trimestralmente — backup nunca testado não é backup.

## Depois do incidente

Postmortem em até 48 horas para SEV1 e SEV2. **Sem culpados**: procuramos a falha
no sistema que permitiu o erro, não a pessoa que o cometeu. Um postmortem que
aponta culpado ensina o time a esconder problemas.

Estrutura:

1. **Resumo** — o que aconteceu, em duas frases
2. **Impacto** — quem foi afetado, por quanto tempo, o que deixou de funcionar
3. **Linha do tempo** — detecção, diagnóstico, mitigação, resolução
4. **Causa raiz** — os "cinco porquês", até chegar em algo acionável
5. **O que funcionou** — não só o que falhou
6. **Ações** — com responsável e prazo; cada ação vira uma issue

## Contatos

| Papel       | Onde                         |
| ----------- | ---------------------------- |
| Plantão     | Canal `#mynotes-incidentes`  |
| Escalação   | CODEOWNERS do módulo afetado |
| Status page | `status.mynotes.app`         |
