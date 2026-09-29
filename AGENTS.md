# Regras técnicas do projeto

- O fluxo de agendamento consulta e atualiza clientes somente pela função `trinks-booking`, evitando expor a chave da API no navegador.
- Nomes de clientes com código de colaborador entre barras verticais são imutáveis; o servidor preserva o nome original em qualquer atualização.