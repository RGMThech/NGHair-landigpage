# Área do Cliente NGHair (login por código no e-mail)

## O que a cliente vai ver
- Botão **Entrar** ao lado de **Agendar** no topo do site (computador e celular).
- Página **/minha-conta/entrar**:
  1. Digita o e-mail. O sistema procura esse e-mail nos cadastros do Trinks (Campo Belo).
  2. **Encontrou:** envia um código de 6 dígitos para o e-mail (de contato@nghair.com.br), como no Vértice. A cliente digita o código e entra.
  3. **Não encontrou:** aparece "Cadastro não localizado" e o formulário de criação: nome e sobrenome, telefone com DDD e **e-mail obrigatório**. O cadastro é criado no Trinks e depois o código é enviado.
  4. Aviso fixo: "É colaboradora de empresa parceira? Entre pelo menu Empresas, na sua empresa" (com links para Eurofarma e Vértice).
- Depois de entrar, o botão **Entrar** vira o **ícone da usuária** (foto ou iniciais) com menu:
  - Meu perfil (editar nome, telefone, data de nascimento, foto — igual Eurofarma)
  - Meus agendamentos (próximos 2 meses, com botão Cancelar)
  - Agendar horário
  - Sair
- Página **Meu perfil** com envio de foto; ao salvar nome/telefone, também atualiza no Trinks (respeitando nomes com código, que nunca são alterados).
- Página **Meus agendamentos**: lista e cancelamento iguais aos da Eurofarma, buscando pelo cadastro do Trinks ligado à conta.
- No agendamento, se a cliente já estiver logada, o passo "Seus dados" já vem com o cadastro dela selecionado.

## Detalhes técnicos
- Nova tabela `cliente_profiles` (user_id, trinks_cliente_id, full_name, email, phone, birth_date, avatar_url) com GRANT + RLS por `auth.uid()`; tabela `cliente_login_codes` só para service_role.
- Nova edge function `cliente-login-code` (verify_jwt=false): ações `verificar` (busca e-mail no Trinks), `criar` (cria cliente no Trinks, reaproveitando a lógica do `trinks-booking`), `enviar` (gera código, hash, SMTP Hostinger), `validar` (confere código, cria/obtém usuário de auth e devolve sessão via magic link token, como no Vértice).
- Agendamentos/cancelamento: nova ação no `trinks-booking` (ou função dedicada) que usa o `trinks_cliente_id` do perfil do usuário autenticado, validando o JWT.
- Fotos no bucket `avatars` já existente (pasta por user_id).
- Hook `useClienteAuth` e componente `UserMenu` no Navbar; rotas `/minha-conta/entrar`, `/minha-conta/perfil`, `/minha-conta/agendamentos`.
- Contas Eurofarma/Vértice continuam separadas; o menu do ícone só aparece para quem entrou pela Área do Cliente.
