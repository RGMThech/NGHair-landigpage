---
name: nghair-prestacao-contas
description: Gerencia o documento HTML de prestação de contas da reforma do salão NGHair (unidade Brooklin, São Paulo). Use SEMPRE que o usuário (Rodrigo/Nilian) enviar notas fiscais, comprovantes PIX, comprovantes de cartão, orçamentos, fotos da obra, ou pedir para lançar/adicionar/corrigir gastos, fornecedores, valores ou imagens da reforma. Também use quando mencionar "prestação de contas", "NGHair", "Brooklin", "reforma do salão", nomes de fornecedores (Natalício, Dep. Zona Sul, Gesso Bispo, Van De Velde, Santil, Ikesaki, OCS Caçambas, Leroy Merlin, Silva/JJ Laminados, Luciano), ou pedir commit/deploy do documento. Cobre extração de dados de notas/comprovantes, atualização do HTML com design premium, manejo correto de imagens base64, e push para o GitHub com deploy único.
---

# Prestação de Contas — Reforma NGHair Brooklin

Mantém um documento HTML único e premium consolidando todos os gastos da reforma comercial do salão NGHair na unidade Brooklin. O usuário envia documentos (notas, comprovantes, fotos) e o trabalho é extrair os dados, lançar no HTML mantendo o design, e fazer commit no GitHub.

**Idioma: SEMPRE responder em português brasileiro.**

## Arquivos e localização

- **Documento principal:** `/mnt/user-data/outputs/prestacao-contas-nghair-brooklin.html`
- **Repositório GitHub:** `https://github.com/mellrodrigo/NGHair-landigpage` (privado)
- **Pasta no repo:** `NGHairBrooklin_prestacaocontas/prestacao-contas-nghair-brooklin.html`
- **Autenticação Git:** via GitHub CLI (`gh auth login`, usuário `mellrodrigo`). NÃO usar token em texto/URL. Ver `references/git-deploy.md`.

## Dados do projeto

- **Cliente/obra:** NGHair, unidade Brooklin — Rua Barão do Triunfo, 1455, Brooklin Paulista, São Paulo, SP, CEP 04602005
- **Período:** início 25/05/2026, término previsto 30/06/2026
- **Cliente (pagamentos):** Nilian Glaucia Ortega (CPF 319.057.358-12)
- **Finalidade:** adequação para locação comercial

## Fluxo de trabalho ao receber novos documentos

Quando o usuário enviar imagens/PDFs de notas, comprovantes ou fotos:

1. **Extrair os dados** do documento (fornecedor, CNPJ, data, itens, valores, forma de pagamento, nº da nota/pedido). Para PDFs use `pdftotext` ou `pdf2image`+visão. Para imagens, leia direto.
2. **Confirmar com o usuário** dados ambíguos ANTES de lançar (ex.: valor pago vs orçado, parcela vs total, se inclui ou não no escopo). Nunca assuma.
3. **Lançar no HTML** seguindo os padrões em `references/estrutura-documento.md`.
4. **Atualizar o total geral** e os cards do resumo financeiro.
5. **Incrementar a versão** (status bar, capa, rodapé — os três devem bater).
6. **Commit + push** no GitHub seguindo `references/git-deploy.md`.
7. **Apresentar** o arquivo com `present_files`.

## Regras de ouro (aprendidas com erros reais)

Estas regras existem porque cada uma já causou um problema sério. Siga TODAS.

### Imagens
- **NUNCA** coloque base64 inline em atributos HTML (`src="data:..."` direto no `<img>` da estrutura). O parser do browser trava com muitos MB e vaza HTML como texto na tela.
- **SEMPRE** use o sistema de objeto JS: imagens vão num objeto `const IMGS = {"iN": "data:image/jpeg;base64,..."}` e os `<img>` usam `data-img="iN" src=""` + `onclick="showImg('iN')"`. Um loader no `DOMContentLoaded` (e execução imediata) preenche os `src`.
- **SEMPRE comprima** fotos novas antes de embutir: PIL `thumbnail((700-1200, ...))`, `quality=65-75`. Notas/comprovantes podem ir um pouco maiores. Alvo: ~20-60KB cada.
- **Tamanho de exibição:** todas as imagens de comprovante/nota usam `class="comp-img"` (CSS: `width:100%; aspect-ratio:3/4; object-fit:cover; max-height:260px`) dentro de `class="comp-card"` num `comp-grid` (`grid-template-columns: repeat(auto-fill, minmax(180px, 220px))`). NUNCA use `max-width:500px/600px` inline — fica gigante. O padrão de referência é o card de PIX das caçambas.
- **Miniaturas em tabela** (ex. comprovante PIX por pedido na tabela Dep. Zona Sul): `width:36px;height:44px;object-fit:cover`.
- Cada chave de imagem (`iN`) deve apontar para a imagem CORRETA. Após deduplicar imagens, SEMPRE verifique que as chaves não embaralharam (ex.: imagem da Santil aparecendo na seção Gesso). Confira `data-img` vs conteúdo real.

### Estrutura HTML
- O documento tem seções demarcadas por comentários `<!-- ── NOME ── -->`. Mantenha a ordem.
- Todo `<div class="section">` e `<div class="photo-grid">`/`comp-grid` DEVE ser fechado. Um `<div>` não fechado faz as seções seguintes virarem colunas lado a lado (bug do "layout 3 colunas"). Após editar, verifique o balanço de `<div>`/`</div>` por seção.
- Cuidado com `<` faltante: `</div>div class=` em vez de `</div><div class=` faz o código vazar como texto. Sempre confira.

### Quando o arquivo "quebrar"
- Se o HTML corromper (texto vazando, layout quebrado, seção sumida), **NÃO tente consertar o HTML quebrado linha a linha**. É mais seguro e barato buscar a última versão boa do histórico Git (`git show <commit>:caminho`) e reaplicar só a mudança necessária.
- Commits de referência conhecidos como bons estão em `references/git-deploy.md`.

### Versão e commit
- A versão aparece em 3 lugares (capa, status bar, rodapé) e os três DEVEM bater.
- **Formato da mensagem de commit:** `vX.Y — descrição` (a versão vem da status bar, no começo da mensagem). Ex.: `v11.5 — adiciona NF Leroy pedido 0036237201`.
- **SEMPRE faça commit após cada alteração** — o usuário cobra isso. Não acumule mudanças sem commitar.

## Referências detalhadas

Leia conforme a necessidade:
- `references/estrutura-documento.md` — anatomia do HTML, CSS, paleta, como adicionar cada tipo de seção/card, sistema de imagens IMGS.
- `references/fornecedores.md` — dados consolidados de todos os fornecedores já lançados, valores, e o placar financeiro atual. Consulte para não duplicar e para manter o total correto.
- `references/git-deploy.md` — workflow exato de commit/push, geração dos arquivos public/, deploy único na Hostinger, commits de referência bons.

## Estado atual (v13.8)

- **Total geral (pago):** R$ 117.434,10
- **Benfeitorias:** R$ 67.308,30 (~60%)
- **Mão de obra Natalício:** R$ 30.236,28 pago (orçado R$ 44.100; saldo R$ 13.863,72)
- **Seções:** Resumo, Benfeitorias, Mão de Obra, Dep. Zona Sul (7 pedidos), Piso Laminado, Gesso Bispo, Caçambas (3), Van De Velde/Móveis e Equipamentos (Ikesaki + purificador), Santil (3), Nicom, Tenfer (5), Leroy Merlin (7), Ar-Condicionado (aparelhos + Maicon + fotos), MinasMov, Andra, Eletro Paris, Tallis, Fotos e Vídeos da Obra, Comprovantes, Observações.
- **Recursos novos:** navegação por âncoras (cards clicáveis + botões ↑ Resumo); upload de fotos/vídeos da obra via Supabase Storage (bucket obra-nghair, signed URLs).
- **Pendências:** piso laminado térreo (Silva/JJ ~R$9.820 não lançado); piso resina superior (Luciano); saldo mão de obra R$ 13.863,72; instalação AC Maicon (previsto R$4.736).
