# Integração Gmail — download de notas fiscais da obra

Script: `scripts/gmail-notas-fiscais.py`. Lê o Gmail (somente leitura), baixa os
anexos das notas fiscais da reforma a partir de 25/05/2026, confirma o endereço da
obra pelo XML da NF-e e salva em `notas-fiscais/pendentes/` no padrão de nome do README.

## 1. Setup OAuth (uma vez, ~10 min — feito por você no navegador)

1. Acesse <https://console.cloud.google.com/> e crie/escolha um projeto.
2. **Ative a Gmail API:** APIs & Services → Library → procure "Gmail API" → **Enable**.
3. **Tela de consentimento OAuth:** APIs & Services → OAuth consent screen →
   tipo **External** → preencha nome do app e seu e-mail → em **Test users**
   adicione `mellrodrigo@gmail.com` (assim não precisa publicar o app).
4. **Credencial:** APIs & Services → Credentials → **Create Credentials** →
   **OAuth client ID** → Application type **Desktop app** → Create.
5. Clique em **Download JSON** e salve exatamente como:
   `scripts/.gmail/credentials.json`
   (a pasta `.gmail/` já é ignorada pelo git — o segredo NÃO vai pro repositório).

## 2. Rodar

```bash
py scripts/gmail-notas-fiscais.py --dry-run   # 1ª vez: abre o navegador p/ autorizar; só lista
py scripts/gmail-notas-fiscais.py             # baixa de fato para pendentes/
```

- Na primeira execução abre o navegador pedindo para você autorizar o acesso
  somente-leitura ao Gmail. O token fica em `scripts/.gmail/token.json` (também ignorado).
- `--dry-run` lista e classifica sem gravar.
- `--include-outros` também baixa notas de endereço diferente (para revisão manual).
- `--since 2026/05/25` muda a data inicial.

## 3. O que o script faz

- Busca: e-mails com anexo desde a data, com termos fiscais OU os labels
  "Notas Fiscais" / "Finanças/Nota Fiscal Eletronica".
- Para cada NF-e (modelo 55) lê o XML e confirma se o endereço de entrega/destinatário
  é a obra (CEP 04602005 ou "Barão do Triunfo, 1455"):
  - **OBRA** → salva em `pendentes/`.
  - **OUTRO** → ignora (a menos que `--include-outros`).
  - **REVISAR** → cupom NFC-e (modelo 65) sem endereço, ou anexo sem XML (ex.: PIX/boleto).
    Salvo para você e eu revisarmos manualmente.
- **Dedup:** pula notas cuja chave de acesso já está no índice (`.gmail/index.json`)
  ou cujo número já aparece em `pendentes/`/`processadas/`.

## Segurança

`credentials.json`, `token.json` e a pasta `.gmail/` estão no `.gitignore`.
Escopo OAuth = `gmail.readonly` (somente leitura — o script nunca apaga nem envia e-mail).
