# Prestação de Contas — Reforma NGHair Brooklin

Este repositório contém um app React (Vite) e um documento HTML de prestação de
contas da reforma comercial do salão NGHair (unidade Brooklin, São Paulo).

**Idioma: responder SEMPRE em português brasileiro.**

## Arquivo principal de trabalho

`NGHairBrooklin_prestacaocontas/prestacao-contas-nghair-brooklin.html` — documento
HTML único, design premium, que consolida todos os gastos da reforma. É o arquivo
que mais recebe edições.

## Fluxo ao receber uma nova nota/comprovante

1. Extrair dados do documento (fornecedor, CNPJ, data, itens, valores, forma de pagamento, nº nota).
2. **Confirmar com o usuário** dados ambíguos ANTES de lançar (valor pago vs orçado, parcela vs total, complemento vs duplicata). Regra do usuário: "valores diferentes = complementos (somam); valores iguais = duplicata".
3. Comprimir a imagem com PIL (thumbnail 700-1200px, quality 65-75) e embutir no objeto `IMGS` como base64.
4. Lançar a seção/linha no HTML seguindo os padrões existentes.
5. Atualizar: total geral, seção Benfeitorias (se aplicável), Gastos por Categoria.
6. Atualizar versão (3 lugares: capa, status bar, rodapé) E data "Atualizado em" (status bar + rodapé) para a data de hoje.
7. Commit + push. Mensagem no formato `vX.Y — descrição` (versão da status bar no começo).
8. Confirmar que o deploy (GitHub Actions) passou.

## Regras de ouro (aprendidas com erros reais)

### Imagens
- NUNCA base64 inline em atributo `src`. Use o objeto JS `const IMGS = {"iN": "data:..."}` e `<img data-img="iN" src="" loading="lazy" onclick="showImg('iN')">`.
- SEMPRE comprimir com PIL antes de embutir (~20-60KB cada).
- Tamanho de card padrão = `class="comp-img"` dentro de `comp-card` num `comp-grid`. NUNCA usar `max-width:500px/600px` inline (fica gigante).
- Miniatura em tabela: `width:36px;height:44px;object-fit:cover`.
- Cada chave `iN` deve apontar para a imagem CORRETA. Conferir `data-img` vs conteúdo. NÃO embaralhar (ex.: imagem Santil não pode aparecer em Gesso).
- O padrão thumbnail/full usa chave par (miniatura) + chave ímpar (full no lightbox).

### Estrutura HTML
- Seções demarcadas por `<!-- ── NOME ── -->`. Todo `<div class="section">` e grids DEVEM fechar.
- Um `<div>` não fechado faz as seções virarem colunas lado a lado (bug das 3 colunas).
- Cuidado com `<` faltante: `</div>div class=` em vez de `</div><div class=` vaza código como texto.
- Após editar, validar: balanço de `<div>`/`</div>` por seção; sem `</div>div class=`; versão consistente; cada `data-img` tem entrada no IMGS.

### Quando o arquivo quebrar
- NÃO consertar HTML corrompido linha a linha. Buscar a última versão boa do Git
  (`git show <commit>:caminho`) e reaplicar só a mudança.

## Git e Deploy

- Config: `git config user.name "Rodrigo Mello"`, email `mellrodrigo@users.noreply.github.com`, `pull.rebase false`.
- Sempre `git pull origin main --no-rebase` antes de commitar.
- Gerar os arquivos public/ no MESMO commit: `python3 scripts/sync-nghair-prestacao.py`.
- `git add NGHairBrooklin_prestacaocontas/... public/` e commit.
- Deploy: há UM workflow só (`.github/workflows/build.yml`) que faz build + deploy único.
  A Hostinger puxa do Git automaticamente. NÃO recriar workflows de webhook (quebram).

## Estado atual

- Versão: v12.5
- Total geral (pago): R$ 94.165,49
- Benfeitorias (ficam no imóvel): R$ 45.999,69 (~52%)
- Seções: Resumo, Benfeitorias, Mão de Obra, Dep. Zona Sul, Piso Laminado, Gesso Bispo,
  Caçambas, Van De Velde (Móveis e Equipamentos), Santil, Nicom, Tenfer, Leroy Merlin,
  Ar-Condicionado, Registros, Comprovantes, Observações.

## Detalhes completos dos fornecedores

Ver `.claude/skills/nghair-prestacao/` (skill instalável) ou o histórico de commits.
