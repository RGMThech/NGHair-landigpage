# Prestação de Contas — Reforma NGHair Brooklin

Este repositório contém um app React (Vite) e um documento HTML de prestação de
contas da reforma comercial do salão NGHair (unidade Brooklin, São Paulo).

**Idioma: responder SEMPRE em português brasileiro.**

## Arquivo principal de trabalho

`NGHairBrooklin_prestacaocontas/prestacao-contas-nghair-brooklin.html` — documento
HTML único, design premium, que consolida todos os gastos da reforma. É o arquivo
que mais recebe edições. A versão publicada (web) fica em
`public/NGHairBrooklin_prestacaocontas/index.html`, gerada pelo script de sync.

## Dados do projeto

- **Obra:** NGHair, unidade Brooklin — Rua Barão do Triunfo, 1455, Brooklin Paulista, São Paulo, SP, CEP 04602005
- **Período:** início 25/05/2026
- **Responsáveis pelos pagamentos:** Nilian Glaucia Ortega (CPF 319.057.358-12) e Rodrigo de Mello (CPF 165.532.788-73)
- **Finalidade:** adequação para locação comercial

## Fluxo ao receber uma nova nota/comprovante

1. Extrair dados do documento (fornecedor, CNPJ, data, itens, valores, forma de pagamento, nº nota). Para PDFs use `pdf2image` + visão; imagens leia direto.
2. **Confirmar com o usuário** dados ambíguos ANTES de lançar (valor pago vs orçado, parcela vs total, complemento vs duplicata, benfeitoria vs removível). Regra: "valores diferentes = complementos (somam); valores iguais = duplicata".
3. Comprimir a imagem com PIL (thumbnail 700-1300px, quality 62-72) e embutir no objeto `IMGS` como base64. Próxima chave = maior índice de `re.findall(r'"(i\d+)":', html)` + 1.
4. Lançar a seção/linha no HTML seguindo os padrões existentes.
5. Atualizar: total geral, seção Benfeitorias, Gastos por Categoria, cards do resumo.
6. Atualizar versão (3 lugares: capa "Obra Comercial · vX.Y", status bar, rodapé) E data "Atualizado em" (status bar + rodapé) para hoje.
7. Rodar `python3 scripts/sync-nghair-prestacao.py` (gera o public/ no mesmo commit).
8. Commit + push. Mensagem: `vX.Y — descrição`.
9. Confirmar que o deploy (GitHub Actions, workflow build.yml) passou.

## Regras de ouro (aprendidas com erros reais)

### Imagens
- NUNCA base64 inline em atributo `src`. Use `const IMGS = {"iN": "data:..."}` + `<img data-img="iN" src="" loading="lazy" decoding="async" onclick="showImg('iN')">`.
- SEMPRE comprimir com PIL antes de embutir (~20-200KB cada).
- Card padrão = `class="comp-img"` dentro de `comp-card` num `comp-grid`. NUNCA `max-width:500px` inline.
- Miniatura em tabela: `width:32-36px;height:40-48px;object-fit:cover`.
- Cada chave `iN` deve apontar para a imagem CORRETA. Conferir `data-img` vs conteúdo.
- Lazy loading via IntersectionObserver usa flag `data-loaded="1"` (NUNCA `!el.src` — src vazio retorna URL da página e quebra).

### Estrutura HTML
- Seções demarcadas por `<!-- ── NOME ── -->`. Todo `<div class="section">` e grids DEVEM fechar.
- Um `<div>` não fechado faz as seções virarem colunas lado a lado (bug das 3 colunas).
- Cuidado com `</div>div class=` (falta `<`) — vaza código como texto.
- Após editar, validar: balanço `<div>`/`</div>` por seção; sem `</div>div class=`; versão consistente; cada `data-img` tem entrada no IMGS.

### Navegação (v12.8+)
- Cards do resumo são clicáveis (wrap `<a href="#sec-X">`) e levam à seção. Cada seção tem id `sec-X` e um botão "↑ Resumo" no `section-header`.
- Lavatórios → sec-van-de-velde; Caçambas → sec-cacambas; etc.

### Upload de fotos/vídeos (v13.4+)
- A seção "Fotos e Vídeos da Obra" (id `sec-fotos`) tem botão de upload que envia direto para o Supabase Storage (bucket `obra-nghair`, privado, signed URLs). Ordena cronologicamente pelo timestamp no nome do arquivo. NÃO usar `capture=` no input (senão força a câmera; sem ele oferece câmera E galeria).

### Quando o arquivo quebrar
- NÃO consertar HTML corrompido linha a linha. Buscar última versão boa do Git (`git show <commit>:caminho`) e reaplicar só a mudança. Commits bons: c26274d (v12.7 limpo), aadc615 (v13.8).

## Git e Deploy

- Config: `git config user.name "Rodrigo Mello"`, email `mellrodrigo@users.noreply.github.com`, `pull.rebase false`.
- Sempre `git pull origin main --no-rebase` antes de commitar.
- Gerar public/ no MESMO commit: `python3 scripts/sync-nghair-prestacao.py`.
- `git add NGHairBrooklin_prestacaocontas/... public/` e commit.
- Deploy: UM workflow só (`.github/workflows/build.yml`), build + deploy. Hostinger puxa do Git automaticamente. NÃO recriar workflows de webhook.

## Integração Gmail (notas fiscais)

Objetivo: ler o Gmail, encontrar notas fiscais/comprovantes da obra a partir de 25/05/2026,
baixar os anexos para `NGHairBrooklin_prestacaocontas/notas-fiscais/pendentes/` e lançar na prestação.

- Use o conector/MCP do Gmail (ou a Gmail API com OAuth). Ver `notas-fiscais/README.md`.
- Buscar e-mails desde 25/05/2026 com termos: "nota fiscal", "NFC-e", "NF-e", "cupom fiscal", "comprovante", "pedido", "orçamento", "recibo".
- Filtrar SÓ notas do endereço da obra (Barão do Triunfo, 1455). Descartar outros endereços/obras.
- Comparar com `notas-fiscais/processadas/` e com os fornecedores já lançados (ver skill) para NÃO duplicar.
- Salvar anexos em `pendentes/` no padrão `AAAA-MM-DD_fornecedor_valor_documento.ext`.
- Após lançar cada nota no HTML, mover o arquivo de `pendentes/` para `processadas/`.

## Estado atual (v13.8)

- **Total geral (pago):** R$ 117.434,10
- **Benfeitorias (ficam no imóvel):** R$ 67.308,30 (~60%)
- **Mão de obra Natalício:** R$ 30.236,28 pago (orçado R$ 44.100; saldo R$ 13.863,72)
- **Seções:** Resumo, Benfeitorias, Mão de Obra, Dep. Zona Sul (7 pedidos), Piso Laminado, Gesso Bispo, Caçambas (3), Van De Velde/Móveis e Equipamentos (inclui Ikesaki + purificador), Santil (3), Nicom, Tenfer (5), Leroy Merlin (7), Ar-Condicionado (aparelhos + Maicon + fotos instalação), MinasMov, Andra, Eletro Paris, Tallis, Fotos e Vídeos da Obra, Comprovantes, Observações.
- **Pendências:** piso laminado térreo (Silva/JJ, orçamento ~R$9.820 não lançado); piso resina superior (Luciano); saldo mão de obra R$ 13.863,72; instalação AC Maicon (previsto R$4.736, falta split 12k superior).

## Referências detalhadas

- `.claude/skills/nghair-prestacao/references/estrutura-documento.md` — anatomia do HTML, CSS, sistema IMGS.
- `.claude/skills/nghair-prestacao/references/fornecedores.md` — dados de todos os fornecedores e placar financeiro.
- `.claude/skills/nghair-prestacao/references/git-deploy.md` — workflow de commit/push/deploy.

## Segurança (IMPORTANTE)

O token do GitHub e as credenciais do Supabase estão em texto no repositório (`.env`, skill).
Antes de uso prolongado no Claude Code, migrar para `gh auth login` (GitHub) e variáveis de
ambiente locais (Supabase), removendo os segredos do código versionado.
