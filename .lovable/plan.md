# Dois meses no calendário do agendamento

## Objetivo
Exibir, na etapa de horário, o mês atual e o mês seguinte simultaneamente, lado a lado em telas maiores e empilhados no celular.

## Implementação
- Substituir o calendário mensal navegável pelos dois calendários fixos.
- Manter o dia atual como primeira data possível.
- Limitar a seleção ao intervalo inclusivo entre hoje e 30 dias corridos à frente.
- Preservar as regras atuais: domingos, segundas e datas passadas desabilitados; horários já passados no dia atual continuam ocultos.
- Manter o carregamento dos horários disponíveis ao selecionar uma data.

## Validação
- Conferir visualmente em desktop e celular.
- Confirmar que datas fora da janela de 30 dias não podem ser selecionadas.
- Confirmar que a escolha de uma data ainda carrega somente os horários disponíveis.
