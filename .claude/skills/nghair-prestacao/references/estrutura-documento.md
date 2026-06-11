# Estrutura do Documento HTML

## Anatomia geral

```
<head> ... fontes (DM Serif Display, Inter, JetBrains Mono) + <style> com CSS vars ...
<body>
  <div id="lightbox" ...>          ← lightbox para ampliar imagens
  <div class="cover"> ... </div>   ← capa (eyebrow, título, subtítulo, meta, versão)
  <div class="status-bar"> ... </div>  ← barra "OBRA EM ANDAMENTO ... vX.Y"
  <div class="container">
    <!-- ── RESUMO FINANCEIRO ── -->  cards + barras por categoria
    <!-- ── MÃO DE OBRA ── -->         tabela orçamentos/pagamentos
    <!-- ── DEP. ZONA SUL ── -->       tabela detalhada (rowspan) + thumbs PIX
    <!-- ── PISO LAMINADO ANDAR TÉRREO ── -->
    <!-- ── GESSO BISPO ── -->
    <!-- ── CAÇAMBAS ── -->
    <!-- ── VAN DE VELDE ── -->
    <!-- ── SANTIL ── -->
    <!-- ── REGISTROS FOTOGRÁFICOS ── -->  fotos da obra como comp-cards
    <!-- ── COMPROVANTES ── -->            grade geral de comprovantes
    <!-- ── OBSERVAÇÕES ── -->
  </div>
  <div class="footer"> ... vX.Y ... </div>
  <script> const IMGS = {...}; showImg(); loader; etc. </script>
</body>
```

## Paleta e CSS vars

Design premium preto/off-white/dourado. Variáveis principais: `--ink` (preto texto), `--ink-soft`, `--ink-muted`, `--gold` (#b8965a dourado), `--green` (#2d6a4f, valores pagos), `--green-lt`, `--red`, `--rule` (linhas), `--bg-card` (#fafaf8). Fontes: títulos DM Serif Display, corpo Inter, números/mono JetBrains Mono.

NÃO altere o CSS sem necessidade — manter o design "bonito" original.

## Sistema de imagens (CRÍTICO)

Todas as imagens ficam num objeto JS no final do `<script>`:

```javascript
const IMGS = {
  "i0": "data:image/jpeg;base64,/9j/...",
  "i2": "data:image/jpeg;base64,/9j/...",
  ...
};
function showImg(key) {
  document.getElementById("lb-img").src = IMGS[key] || "";
  document.getElementById("lightbox").classList.add("active");
}
function loadImages() {
  document.querySelectorAll("[data-img]").forEach(function(el) {
    var key = el.getAttribute("data-img");
    if (IMGS[key]) el.src = IMGS[key];
  });
}
document.addEventListener("DOMContentLoaded", loadImages);
if (document.readyState !== "loading") loadImages();
```

No corpo HTML, as imagens são SEMPRE assim (nunca base64 inline):
```html
<img class="comp-img" data-img="iN" src="" alt="..." onclick="showImg('iN')">
```

### Adicionar uma nova imagem
1. Codifique em base64 (comprimida com PIL primeiro).
2. Descubra a próxima chave livre: `re.findall(r'"(i\d+)":', html)`, pegue o maior índice +1.
3. Injete no objeto: `html.replace('const IMGS = {', f'const IMGS = {{\n  "{key}": "data:image/jpeg;base64,{b64}",')`.
4. Adicione o `<img>`/`comp-card` no lugar certo do corpo.

### Comprimir antes de embutir (Python)
```python
from PIL import Image
import io, base64
img = Image.open(path)
img.thumbnail((1000, 1000), Image.LANCZOS)   # fotos: 700-1200; notas podem ser maiores
buf = io.BytesIO()
img.save(buf, 'JPEG', quality=70, optimize=True)
b64 = base64.b64encode(buf.getvalue()).decode()
```

## Padrões de card

### Card de comprovante (padrão de referência — caçambas)
```html
<div class="comp-grid">
  <div class="comp-card" onclick="showImg('iN')">
    <img class="comp-img" data-img="iN" src="" alt="Descrição">
    <div class="comp-info"><strong>Título — R$ X</strong><span>data · contexto</span></div>
  </div>
</div>
```
CSS já existente: `.comp-img { width:100%; aspect-ratio:3/4; object-fit:cover; max-height:260px }`, `.comp-grid { grid-template-columns: repeat(auto-fill, minmax(180px, 220px)); gap:16px }`.

### Cabeçalho de fornecedor (bloco de dados)
```html
<div style="background:var(--bg-card);border:1px solid var(--rule);border-radius:4px;padding:20px 24px;margin-bottom:20px">
  <div style="display:flex;flex-wrap:wrap;gap:32px">
    <div><div class="card-label">Empresa</div><div style="font-weight:600;font-size:14px">Nome</div>...</div>
    ...
    <div><div class="card-label">Total</div><div style="font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;color:var(--green)">R$ X</div></div>
    <div><div class="card-label">Situação</div><div><span class="badge badge-pago">Pago ✓</span></div></div>
  </div>
</div>
```

### Tabela de itens
Usa `<div class="table-wrap"><table>` com `<thead>`, `<tbody>`, `<tfoot>`. Valores alinhados à direita com `class="r"` no header e `text-align:right;font-family:'JetBrains Mono',monospace` nas células. A tabela do Dep. Zona Sul é a mais complexa (rowspan agrupando itens por pedido + linha de subtotal com miniatura PIX).

### Miniatura de comprovante em linha de tabela
```html
<img data-img="iN" src="" onclick="showImg('iN')" style="width:36px;height:44px;object-fit:cover;border-radius:3px;cursor:pointer;border:1px solid var(--rule);vertical-align:middle;margin-left:6px" title="Ver comprovante PIX">
```

## Resumo financeiro (cards + barras)

A primeira seção tem `summary-grid` com `card`/`card highlight` (label, value, sub). O card de total usa `card-value gold`. Abaixo, barras de distribuição por categoria (`cat-row` com `cat-bar` cuja largura é a % do total). Ao adicionar fornecedor, atualize: total geral (capa span, card highlight), card da categoria, e barra de distribuição.

## Validação pós-edição (rode sempre)

```python
import re
# 1. Balanço de divs por seção (cada section deve fechar; só o container fica +1)
# 2. Sem '</div>div class=' (< faltante)
assert '</div>div class=' not in html
# 3. Sem base64 inline em src de tag estrutural (deve estar tudo no IMGS)
# 4. Versão consistente nos 3 lugares
assert len(set(re.findall(r'v\d+\.\d+', html))) == 1
# 5. Cada data-img tem entrada no IMGS
```
