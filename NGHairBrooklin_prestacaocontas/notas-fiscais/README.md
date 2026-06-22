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

## Integração com o Gmail

A ideia é, futuramente, automatizar a leitura dos e-mails com notas fiscais
(a partir de 25/05/2026) e depositar os anexos diretamente em `pendentes/`.

Essa automação funciona melhor no **Claude Code**, onde é possível:
- Conectar a conta Gmail via API (com autorização OAuth)
- Filtrar e-mails por remetente, assunto e data
- Baixar os anexos (PDF/JPG) automaticamente para esta pasta
- Acionar o fluxo de lançamento na prestação de contas

Enquanto isso, os arquivos podem ser adicionados manualmente nesta pasta
ou enviados direto na conversa com o assistente.

## Fornecedores já catalogados

Mão de obra (Natalício), Dep. Zona Sul, Leroy Merlin, Gesso Bispo, Van De Velde,
Ikesaki, Santil, Nicom, Tenfer, MinasMov, Andra SA Electric, Eletro Paris, Tallis,
OCS Caçambas, Electrolux (ar-condicionado e purificador), Maicon (instalação AC).
