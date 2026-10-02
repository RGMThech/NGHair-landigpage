# Regras técnicas do projeto

- O fluxo de agendamento consulta e atualiza clientes somente pela função `trinks-booking`, evitando expor a chave da API no navegador.
- Nomes de clientes com código de colaborador entre barras verticais são imutáveis; o servidor preserva o nome original em qualquer atualização.
- O calendário de agendamento libera dias pela disponibilidade real do serviço e profissional no Trinks, sem bloquear dias da semana de forma fixa.- Área do Cliente: login por código (edge cliente-area), perfil em cliente_profiles, agendamentos via trinks_cliente_id; separada de Eurofarma/Vértice para não misturar acessos.
- Tokens Trinks por salão: Campo Belo usa TRINKS_API_KEY e Brooklin usa TRINKS_API_KEY_BROOKLIN (helper _shared/trinks-key.ts); se um token esgota a cota (429), o outro é tentado como reserva automática. Motivo: cada salão tem sua chave, e a reserva evita parar o agendamento.
