# Git e Deploy

## Workflow de commit (executar após CADA alteração)

```bash
cd /home/claude/NGHair-landigpage   # clonar se não existir (ver abaixo)
TOKEN="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"

# 1. Puxar antes para evitar rejeição (workflows fazem commits automáticos)
git pull "https://mellrodrigo:${TOKEN}@github.com/mellrodrigo/NGHair-landigpage.git" main --no-rebase -q

# 2. Copiar o HTML atualizado para a pasta do repo
cp /mnt/user-data/outputs/prestacao-contas-nghair-brooklin.html NGHairBrooklin_prestacaocontas/prestacao-contas-nghair-brooklin.html

# 3. Gerar os arquivos public/ NO MESMO COMMIT (evita deploy duplicado)
python3 scripts/sync-nghair-prestacao.py

# 4. Stage + commit + push
git add NGHairBrooklin_prestacaocontas/prestacao-contas-nghair-brooklin.html public/
git commit -m "vX.Y — descrição da mudança"
git push "https://mellrodrigo:${TOKEN}@github.com/mellrodrigo/NGHair-landigpage.git" main
```

### Clonar o repo (primeira vez na sessão)
```bash
cd /home/claude
git clone "https://mellrodrigo:${TOKEN}@github.com/mellrodrigo/NGHair-landigpage.git"
cd NGHair-landigpage
git config user.name "Rodrigo Mello"
git config user.email "mellrodrigo@users.noreply.github.com"
git config pull.rebase false
```

## Formato da mensagem de commit

`vX.Y — descrição` — a versão vem da status bar do documento, no COMEÇO da mensagem.
Exemplos:
- `v11.5 — adiciona NF Leroy pedido 0036237201 R$ 4.516,72`
- `v11.6 — corrige imagem trocada na seção Santil`

## Deploy único (já configurado)

Há UM workflow só: `.github/workflows/build.yml`. Ele faz build do React + dispara a Hostinger uma vez, com `concurrency: cancel-in-progress` para não rodar duas vezes.

**NÃO recriar** os workflows removidos (`sync-nghair-prestacao.yml` e `hostinger-deploy.yml`) — eles causavam deploy duplicado. Por isso geramos `public/` localmente no passo 3.

## Script de sync (já existe no repo)

`scripts/sync-nghair-prestacao.py` converte o HTML com base64 em arquivos `public/NGHairBrooklin_prestacaocontas.html`, `public/NGHairBrooklin_prestacaocontas/index.html` e extrai as imagens base64 para `public/.../assets/image-<hash>.jpg` (referenciadas por caminho externo). Isso deixa a versão pública leve. Rode sempre antes do commit.

## Commits de referência conhecidos como BONS

Se o arquivo corromper, buscar a versão correta destes commits com `git show <commit>:NGHairBrooklin_prestacaocontas/prestacao-contas-nghair-brooklin.html`:

- **d07d477** (v10.3): resumo + estrutura corretos, total R$ 75.208,27, 140 imagens. Boa base geral.
- **48ada19**: seção Dep. Zona Sul com tabela detalhada (rowspan) e thumbs PIX corretos nas chaves i121/i123/i125/i127/i129.
- **b61366b** (v11.4): última versão estável validada pelo usuário ("acertou tudo"). **Melhor ponto de partida.**

## Cache do browser

Se o usuário disser que não atualizou após o deploy, orientar `Ctrl+Shift+R` (desktop) ou fechar/reabrir (iPhone). O GitHub mostra código-fonte, não renderiza — para visualizar use a URL publicada na Hostinger, não o arquivo cru do GitHub.
