# Notas Fiscais — Reforma NGHair Brooklin

Pasta central para organizar todas as notas fiscais, cupons e comprovantes da reforma da unidade Brooklin, com o objetivo de integração com o Gmail e lançamento direto na prestação de contas.

## Estrutura das pastas

| Pasta | O que vai aqui |
|-------|----------------|
| `pendentes/` | Notas/comprovantes recém-chegados (ex.: baixados do Gmail) que **ainda não foram lançados** no HTML da prestação de contas. |
| `processadas/` | Notas que **já foram lançadas** no documento. Servem de arquivo/backup. |
| `comprovantes-pix/` | Comprovantes de pagamento PIX, transferências e recibos. |

## Fluxo de trabalho

1. **Coletar** — as notas chegam ao Gmail (NFC-e, NF-e, cupons, orçamentos) ou são baixadas manualmente.
2. **Depositar** — o arquivo (PDF, JPG ou PNG) é salvo em `pendentes/`.
3. **Lançar** — o assistente extrai os dados (fornecedor, valor, data, itens), confirma ambiguidades, comprime a imagem e insere na seção correta do `prestacao-contas-nghair-brooklin.html`.
4. **Arquivar** — após o lançamento, o arquivo é movido de `pendentes/` para `processadas/`.

## Convenção de nomes (sugerida)

Para facilitar a identificação automática, nomear os arquivos assim:

```
AAAA-MM-DD_fornecedor_valor_documento.ext
```

Exemplos:
- `2026-06-18_leroy_1455-74_nfce-36409.jpg`
- `2026-06-17_natalicio_10000-00_pix.jpg`
- `2026-06-16_ocs_490-00_cacamba.pdf`

Campos:
- **AAAA-MM-DD** — data de emissão da nota
- **fornecedor** — nome curto, minúsculo, sem espaços (use `-`)
- **valor** — com `-` no lugar da vírgula dos centavos
- **documento** — tipo + número (`nfce-XXXX`, `nfe-XXXX`, `pix`, `orcamento-XXXX`)

## Integração com o Gmail (via Claude Code)

A automação da leitura dos e-mails com notas fiscais (a partir de 25/05/2026) é
feita no **Claude Code**. O fluxo:

1. Conectar a conta Gmail no Claude Code (MCP do Gmail ou Gmail API com OAuth).
2. Buscar e-mails desde 25/05/2026 com os termos de nota fiscal/comprovante.
3. Filtrar apenas notas do endereço da obra (Barão do Triunfo, 1455).
4. Comparar com `processadas/` e fornecedores já lançados para não duplicar.
5. Baixar os anexos para `pendentes/` no padrão de nome combinado.
6. Lançar cada nota no HTML da prestação de contas.
7. Mover o arquivo de `pendentes/` para `processadas/`.

As instruções completas para o Claude Code estão no `CLAUDE.md` da raiz do repositório.

## Fornecedores já catalogados

Mão de obra (Natalício), Dep. Zona Sul, Leroy Merlin, Gesso Bispo, Van De Velde,
Ikesaki, Santil, Nicom, Tenfer, MinasMov, Andra SA Electric, Eletro Paris, Tallis,
OCS Caçambas, Electrolux (ar-condicionado e purificador), Maicon (instalação AC).
