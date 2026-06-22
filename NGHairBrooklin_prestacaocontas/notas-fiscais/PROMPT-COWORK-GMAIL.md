# Prompt para o Claude Cowork — Coleta de Notas Fiscais via Gmail

> Copie todo o texto da seção "PROMPT" abaixo e cole no Claude Cowork.
> Antes, conecte sua conta do Gmail no Cowork (Configurações → Conectores → Gmail).

---

## PROMPT

Você é meu assistente de organização de notas fiscais para uma prestação de contas de reforma comercial. Preciso que você leia meu Gmail e organize todas as notas fiscais e comprovantes de uma obra.

### Contexto da obra

- **Projeto:** Reforma da unidade Brooklin do salão NGHair
- **Endereço:** Rua Barão do Triunfo, 1455 — Brooklin Paulista, São Paulo, SP
- **Responsáveis pelos pagamentos:** Nilian Glaucia Ortega (CPF 319.057.358-12) e Rodrigo de Mello (CPF 165.532.788-73)
- **Período relevante:** notas a partir de **25/05/2026** até hoje

### O que preciso que você faça

1. **Busque no meu Gmail** todos os e-mails recebidos a partir de 25/05/2026 que contenham notas fiscais, cupons fiscais (NFC-e/NF-e), recibos, orçamentos ou comprovantes de pagamento relacionados a materiais de construção, mão de obra, móveis, equipamentos ou serviços para reforma.

2. **Critérios de busca sugeridos** (use estes termos e remetentes como ponto de partida):
   - Palavras-chave: "nota fiscal", "NFC-e", "NF-e", "cupom fiscal", "comprovante", "pedido", "orçamento", "recibo"
   - Fornecedores já conhecidos desta obra (priorize estes): **Leroy Merlin, Dep. Zona Sul, Gesso Bispo, Van De Velde, Ikesaki, Santil, Nicom, Tenfer, MinasMov, Andra SA Electric, Eletro Paris, Tallis, OCS Caçambas, Electrolux**
   - Também procure por: lojas de material elétrico/hidráulico, marcenarias, vidraçarias, lojas de tinta, ar-condicionado, iluminação

3. **Para cada nota/comprovante encontrado, extraia e organize numa tabela** com:
   - Data de emissão
   - Fornecedor (nome/razão social)
   - Número do documento (NFC-e, NF-e, pedido)
   - Valor total
   - Forma de pagamento (se constar)
   - Breve descrição dos itens
   - Se é material que **fica no imóvel** (benfeitoria) ou **removível** (móveis/equipamentos)

4. **Baixe os anexos** (PDFs e imagens das notas) e salve numa pasta local chamada `notas-pendentes`, renomeando cada arquivo no padrão:
   ```
   AAAA-MM-DD_fornecedor_valor_documento.ext
   ```
   Exemplo: `2026-06-18_leroy_1455-74_nfce-36409.pdf`

5. **Gere um resumo final** em uma planilha ou documento com:
   - A tabela completa de todas as notas encontradas
   - O valor total somado
   - Separação entre benfeitorias e itens removíveis
   - Uma lista dos arquivos baixados

### Regras importantes

- **NÃO inclua** notas de outras obras ou endereços diferentes do citado acima. Se encontrar notas com endereço de entrega diferente (ex: outro bairro, outra obra), separe-as numa seção "fora do escopo" e me avise.
- **Confirme comigo** qualquer nota ambígua antes de considerar como gasto da obra (ex: valor estranho, fornecedor desconhecido, possível duplicata).
- **Não delete nem mova** nenhum e-mail. Apenas leia e baixe os anexos.
- Se um e-mail tiver apenas o link para a nota (e não o anexo), me avise para eu acessar manualmente.

### Entrega

Ao terminar, me apresente:
1. A planilha/tabela com todas as notas
2. A pasta `notas-pendentes` com os arquivos renomeados
3. Um resumo de quantas notas encontrou, o valor total, e quais ficaram pendentes de confirmação

Depois disso, eu vou revisar e enviar os arquivos para lançamento na prestação de contas (um documento HTML que já mantenho).

---

## Observações para você (Rodrigo)

- **Antes de rodar:** conecte o Gmail no Cowork em Configurações → Conectores.
- **Depois que o Cowork baixar as notas:** você pode me enviar aqui no chat os arquivos da pasta `notas-pendentes` (ou o resumo em planilha), e eu faço o lançamento na prestação de contas como sempre fizemos — extraio, comprimo, insiro na seção certa, atualizo os totais e faço o commit/deploy.
- **Notas que JÁ estão lançadas** (não precisa relançar): Leroy (7 notas), Dep. Zona Sul (7 pedidos), Gesso Bispo, Van De Velde, Ikesaki, Santil (3 notas), Nicom, Tenfer (5 notas), MinasMov, Andra, Eletro Paris, Tallis, OCS Caçambas (3), Electrolux (AC + purificador), Maicon (instalação), Mão de obra Natalício (4 PIX). Se o Cowork encontrar essas mesmas, é só conferir se há alguma diferente das já catalogadas.
- **Dica:** peça ao Cowork para destacar especificamente as notas que ele acha que **ainda não foram lançadas**, comparando com a lista acima.
