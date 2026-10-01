# Ajustar localização e inclusão de clientes

## Alterações
- Quando nenhum cadastro for encontrado, orientar primeiro uma nova tentativa usando e-mail e/ou telefone.
- Manter a opção de criar um cadastro novo após essa orientação.
- Corrigir a inclusão para reconhecer o cliente mesmo quando o Trinks cria o registro sem devolver o identificador esperado.
- Após incluir, localizar e reler o cadastro criado no Trinks antes de mostrar sucesso e liberar o agendamento.
- Evitar duplicações: se a primeira inclusão tiver sido concluída, uma nova tentativa deve recuperar o cadastro existente em vez de criar outro.

## Validação
- Publicar a função atualizada.
- Testar busca sem resultado e o retorno de uma inclusão simulada/segura, sem criar agendamento.
- Confirmar que o site continua compilando sem erros.
