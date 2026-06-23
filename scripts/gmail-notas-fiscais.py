#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Busca notas fiscais da reforma NGHair Brooklin no Gmail e baixa os anexos.

Fluxo:
  1. Autentica via OAuth (somente leitura). Primeira execução abre o navegador.
  2. Busca e-mails a partir de 25/05/2026 com termos fiscais / labels de NF.
  3. Baixa PDF + XML de cada anexo para uma área de staging.
  4. Lê o XML da NF-e para extrair fornecedor, CNPJ, valor, data, nº e ENDEREÇO.
  5. Classifica: OBRA (endereço Barão do Triunfo 1455 / CEP 04602005),
     OUTRO (endereço diferente) ou REVISAR (cupom NFC-e sem endereço de entrega).
  6. Deduplica pela chave de acesso (índice .gmail/index.json) e por arquivos já
     presentes em pendentes/ e processadas/.
  7. Move os candidatos de OBRA/REVISAR para pendentes/ no padrão de nome do README.

Uso:
  py scripts/gmail-notas-fiscais.py            # baixa e classifica
  py scripts/gmail-notas-fiscais.py --dry-run  # só lista, não grava em pendentes/
  py scripts/gmail-notas-fiscais.py --since 2026/05/25 --include-outros
"""
import argparse
import base64
import json
import os
import re
import sys
import unicodedata
import xml.etree.ElementTree as ET
from datetime import datetime

# ── Caminhos ────────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_DIR = os.path.dirname(SCRIPT_DIR)
GMAIL_DIR = os.path.join(SCRIPT_DIR, ".gmail")          # gitignored
CREDS = os.path.join(GMAIL_DIR, "credentials.json")
TOKEN = os.path.join(GMAIL_DIR, "token.json")
INDEX = os.path.join(GMAIL_DIR, "index.json")
NF_DIR = os.path.join(REPO_DIR, "NGHairBrooklin_prestacaocontas", "notas-fiscais")
PENDENTES = os.path.join(NF_DIR, "pendentes")
PROCESSADAS = os.path.join(NF_DIR, "processadas")
STAGING = os.path.join(GMAIL_DIR, "staging")

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

# ── Endereços aceitos como "da obra" (entrega/destinatário) ─────────────────
# A obra é Barão do Triunfo 1455; materiais também foram entregues em
# João Álvares Soares 1292 (confirmado pelo usuário como entrega da obra).
ACCEPTED_ADDR = [
    {"cep": "04602005", "tokens": ["barao", "triunfo"], "nro": "1455"},
    {"cep": "04609003", "tokens": ["joao", "alvares", "soares"], "nro": "1292"},
]

# Fornecedores a ignorar (gasto pessoal, não da obra) — por CNPJ.
EXCLUDE_CNPJS = {
    "61412110039108",  # Drogaria São Paulo S.A (farmácia)
}

HTML_DOC = os.path.join(REPO_DIR, "NGHairBrooklin_prestacaocontas",
                        "prestacao-contas-nghair-brooklin.html")

# Termos de busca (Gmail query). Labels: "Notas Fiscais" e "Finanças/Nota Fiscal Eletronica".
DEFAULT_SINCE = "2026/05/25"
KEYWORDS = ('"nota fiscal" OR NF-e OR NFC-e OR NFCe OR "cupom fiscal" '
            'OR comprovante OR recibo OR pedido OR "orçamento" OR boleto OR DANFE')
LABELS = 'label:"Notas Fiscais" OR label:"Finanças/Nota Fiscal Eletronica"'


def norm(s):
    """Remove acentos, baixa caixa, colapsa espaços."""
    if not s:
        return ""
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"\s+", " ", s).strip().lower()


def slug(s):
    s = norm(s)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:24] or "fornecedor"


def get_service():
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build

    if not os.path.exists(CREDS):
        sys.exit(
            f"[ERRO] Falta o arquivo de credenciais OAuth:\n  {CREDS}\n"
            "Crie-o no Google Cloud Console (OAuth client 'Desktop app') e salve nesse caminho.\n"
            "Passo a passo no README ao lado deste script."
        )
    creds = None
    if os.path.exists(TOKEN):
        creds = Credentials.from_authorized_user_file(TOKEN, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(CREDS, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(TOKEN, "w", encoding="utf-8") as f:
            f.write(creds.to_json())
    return build("gmail", "v1", credentials=creds, cache_discovery=False)


# ── Parse do XML da NF-e / NFC-e ─────────────────────────────────────────────
def _findtext(node, tag):
    """Busca uma tag ignorando namespace."""
    if node is None:
        return ""
    for el in node.iter():
        if el.tag.rsplit("}", 1)[-1] == tag and el.text:
            return el.text.strip()
    return ""


def _find(node, tag):
    if node is None:
        return None
    for el in node.iter():
        if el.tag.rsplit("}", 1)[-1] == tag:
            return el
    return None


def parse_nfe_xml(xml_bytes):
    """Extrai campos relevantes do XML de NF-e/NFC-e. Retorna dict ou None."""
    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError:
        return None
    infNFe = _find(root, "infNFe")
    if infNFe is None:
        return None
    ide = _find(infNFe, "ide")
    emit = _find(infNFe, "emit")
    dest = _find(infNFe, "dest")
    total = _find(infNFe, "ICMSTot")
    entrega = _find(infNFe, "entrega")  # endereço de entrega (quando existe)

    mod = _findtext(ide, "mod")              # 55 = NF-e, 65 = NFC-e
    chave = (infNFe.get("Id") or "").replace("NFe", "")
    dh = _findtext(ide, "dhEmi") or _findtext(ide, "dEmi")
    data = ""
    if dh:
        m = re.match(r"(\d{4})-(\d{2})-(\d{2})", dh)
        if m:
            data = f"{m.group(1)}-{m.group(2)}-{m.group(3)}"

    # endereços candidatos: entrega tem prioridade; senão o do destinatário
    def addr(node):
        ender = _find(node, "enderDest")
        if ender is None:
            ender = _find(node, "enderEntreg")
        if ender is None:
            ender = node
        return {
            "logr": _findtext(ender, "xLgr"),
            "nro": _findtext(ender, "nro"),
            "bairro": _findtext(ender, "xBairro"),
            "cep": re.sub(r"\D", "", _findtext(ender, "CEP")),
            "mun": _findtext(ender, "xMun"),
        }

    ender_entrega = addr(entrega) if entrega is not None else None
    ender_dest = addr(dest) if dest is not None else None

    return {
        "mod": mod,
        "chave": chave,
        "nNF": _findtext(ide, "nNF"),
        "serie": _findtext(ide, "serie"),
        "data": data,
        "emit_nome": _findtext(emit, "xNome") or _findtext(emit, "xFant"),
        "emit_cnpj": _findtext(emit, "CNPJ"),
        "dest_nome": _findtext(dest, "xNome"),
        "valor": _findtext(total, "vNF"),
        "ender_entrega": ender_entrega,
        "ender_dest": ender_dest,
    }


def is_obra(nf):
    """True/False/None — None = não dá pra confirmar (cupom sem endereço)."""
    enders = [e for e in (nf.get("ender_entrega"), nf.get("ender_dest")) if e]
    # só considera endereços com conteúdo real (cupom NFC-e costuma vir vazio)
    enders = [e for e in enders if e.get("cep") or e.get("logr")]
    if not enders:
        return None  # sem endereço → REVISAR (não descarta)
    for e in enders:
        cep = e.get("cep", "")
        logr = norm(e.get("logr", ""))
        nro = (e.get("nro") or "").strip()
        for a in ACCEPTED_ADDR:
            if cep and cep == a["cep"]:
                return True
            if all(t in logr for t in a["tokens"]) and nro == a["nro"]:
                return True
    # tem endereço, mas nenhum bate com os endereços da obra
    return False


# ── Gmail helpers ────────────────────────────────────────────────────────────
def list_message_ids(svc, query):
    ids, token = [], None
    while True:
        resp = svc.users().messages().list(
            userId="me", q=query, pageToken=token, maxResults=100).execute()
        ids += [m["id"] for m in resp.get("messages", [])]
        token = resp.get("nextPageToken")
        if not token:
            break
    return ids


def get_attachments(svc, msg_id):
    """Retorna (headers, [ {filename, mime, data_bytes} ])."""
    msg = svc.users().messages().get(userId="me", id=msg_id, format="full").execute()
    headers = {h["name"].lower(): h["value"]
               for h in msg.get("payload", {}).get("headers", [])}
    out = []

    def walk(part):
        fn = part.get("filename")
        body = part.get("body", {})
        if fn and (body.get("attachmentId") or body.get("data")):
            if body.get("attachmentId"):
                att = svc.users().messages().attachments().get(
                    userId="me", messageId=msg_id, id=body["attachmentId"]).execute()
                raw = att.get("data", "")
            else:
                raw = body.get("data", "")
            data = base64.urlsafe_b64decode(raw + "===") if raw else b""
            out.append({"filename": fn, "mime": part.get("mimeType", ""), "data": data})
        for p in part.get("parts", []) or []:
            walk(p)

    walk(msg.get("payload", {}))
    return headers, out


def load_index():
    if os.path.exists(INDEX):
        with open(INDEX, encoding="utf-8") as f:
            return json.load(f)
    return {"chaves": {}}


def save_index(idx):
    with open(INDEX, "w", encoding="utf-8") as f:
        json.dump(idx, f, ensure_ascii=False, indent=2)


_HTML_CACHE = None


def html_text():
    global _HTML_CACHE
    if _HTML_CACHE is None:
        try:
            with open(HTML_DOC, encoding="utf-8") as f:
                _HTML_CACHE = f.read()
        except OSError:
            _HTML_CACHE = ""
    return _HTML_CACHE


def already_have(nf):
    """Dedup: já lançada no HTML, no índice de chaves, ou em pendentes/processadas."""
    chave = nf.get("chave", "")
    nnf = (nf.get("nNF") or "").lstrip("0")
    # 1) já lançada no documento HTML (nº da nota aparece no texto)
    if nnf and re.search(rf"\b0*{re.escape(nnf)}\b", html_text()):
        return True
    # 2) já baixada (pasta pendentes/ ou processadas/)
    for folder in (PENDENTES, PROCESSADAS):
        if not os.path.isdir(folder):
            continue
        for f in os.listdir(folder):
            if chave and chave in f:
                return True
            if nnf and re.search(rf"nf?c?e-0*{re.escape(nnf)}\b", f):
                return True
    return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--since", default=DEFAULT_SINCE, help="data inicial YYYY/MM/DD")
    ap.add_argument("--dry-run", action="store_true", help="não grava em pendentes/")
    ap.add_argument("--include-outros", action="store_true",
                    help="também baixa notas de OUTRO endereço (revisão)")
    args = ap.parse_args()

    # Console do Windows (cp1252) não imprime ═/✓/✗ — força UTF-8.
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    os.makedirs(STAGING, exist_ok=True)
    os.makedirs(PENDENTES, exist_ok=True)

    query = f'after:{args.since} has:attachment (({KEYWORDS}) OR ({LABELS}))'
    print(f"[query] {query}\n")

    svc = get_service()
    ids = list_message_ids(svc, query)
    print(f"[busca] {len(ids)} e-mails com anexo encontrados\n")

    idx = load_index()
    salvos, pulados, outros, revisar, excluidos = [], [], [], [], []

    for mid in ids:
        headers, atts = get_attachments(svc, mid)
        assunto = headers.get("subject", "(sem assunto)")
        xmls = [a for a in atts if a["filename"].lower().endswith(".xml")]
        pdfs = [a for a in atts if a["filename"].lower().endswith(".pdf")]

        nf = None
        for x in xmls:
            nf = parse_nfe_xml(x["data"])
            if nf:
                break

        if not nf:
            # Sem XML de NF-e — pode ser comprovante PIX/boleto em PDF. Marca p/ revisão.
            revisar.append((assunto, "(sem XML NF-e)", [p["filename"] for p in pdfs]))
            continue

        if nf.get("emit_cnpj") in EXCLUDE_CNPJS:
            excluidos.append(nf)
            continue

        status = is_obra(nf)  # True / False / None
        tag = {True: "OBRA", False: "OUTRO", None: "REVISAR"}[status]

        if already_have(nf):
            pulados.append((nf, tag))
            continue
        if status is False and not args.include_outros:
            outros.append(nf)
            continue

        # nome no padrão: AAAA-MM-DD_fornecedor_valor_documento.ext
        valor = (nf["valor"] or "0").replace(".", "-")
        doc = ("nfce" if nf["mod"] == "65" else "nfe") + "-" + (nf["nNF"] or "s-num")
        base = f"{nf['data'] or 'sem-data'}_{slug(nf['emit_nome'])}_{valor}_{doc}"

        if not args.dry_run:
            for p in pdfs:
                with open(os.path.join(PENDENTES, base + ".pdf"), "wb") as f:
                    f.write(p["data"])
            for x in xmls:
                with open(os.path.join(PENDENTES, base + ".xml"), "wb") as f:
                    f.write(x["data"])
            if nf.get("chave"):
                idx["chaves"][nf["chave"]] = base
        (salvos if status is True else revisar).append((nf, tag, base))

    if not args.dry_run:
        save_index(idx)

    # ── Relatório ────────────────────────────────────────────────────────────
    print("═" * 70)
    print(f"SALVOS em pendentes/ (OBRA confirmada): {len(salvos)}")
    for item in salvos:
        nf = item[0]
        print(f"  ✓ {item[2]}  | {nf['emit_nome']}  R$ {nf['valor']}")
    print(f"\nREVISAR (cupom sem endereço ou sem XML): {len(revisar)}")
    for item in revisar:
        print(f"  ? {item}")
    print(f"\nOUTRO endereço (ignorados, use --include-outros p/ baixar): {len(outros)}")
    for nf in outros:
        e = nf.get("ender_dest") or {}
        print(f"  ✗ {nf['emit_nome']}  R$ {nf['valor']}  [{e.get('logr')} {e.get('nro')} CEP {e.get('cep')}]")
    print(f"\nJÁ CATALOGADOS (dedup HTML/pastas, pulados): {len(pulados)}")
    for nf, tag in pulados:
        print(f"  = {nf['emit_nome']}  nNF {nf['nNF']}  ({tag})")
    print(f"\nEXCLUÍDOS (fornecedor pessoal): {len(excluidos)}")
    for nf in excluidos:
        print(f"  ⊘ {nf['emit_nome']}  R$ {nf['valor']}  nNF {nf['nNF']}")
    print("═" * 70)


if __name__ == "__main__":
    main()
