# Calendário conforme a agenda do profissional

## Objetivo
Liberar no calendário somente os dias em que o profissional selecionado realmente possui horário disponível para o serviço escolhido.

## Implementação
- Consultar no Trinks a disponibilidade dos 30 dias permitidos ao entrar na etapa de horário.
- Remover o bloqueio fixo de domingos e segundas.
- Para um profissional específico, liberar apenas os dias com horários vagos dele.
- Em “Sem preferência”, liberar o dia quando ao menos um profissional autorizado para o serviço tiver horário.
- Manter o filtro de horários passados com tolerância de cinco minutos para o dia atual.
- Exibir carregamento enquanto os dias disponíveis são consultados.

## Validação
- Confirmar que dias sem disponibilidade ficam bloqueados.
- Confirmar que uma segunda-feira pode ser selecionada quando houver agenda.
- Confirmar que a seleção continua mostrando apenas horários livres.
