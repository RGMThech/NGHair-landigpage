#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Converte a 1ª página de um DANFE (PDF) em JPEG comprimido e injeta no objeto
IMGS do HTML da prestação, como "iN": "data:image/jpeg;base64,...".

Uso:
  py scripts/embed-danfe.py i178 caminho/para/nota.pdf [i179 outra.pdf ...]

Regras de compressão seguem o CLAUDE.md (thumbnail ~1100px, quality ~68, alvo 20-200KB).
Insere logo após `const IMGS = {`. Se a chave já existir no HTML, aborta (evita duplicar).
"""
import base64
import io
import os
import sys

import fitz  # PyMuPDF
from PIL import Image

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML = os.path.join(REPO, "NGHairBrooklin_prestacaocontas",
                    "prestacao-contas-nghair-brooklin.html")
MAX_H = 1100
QUALITY = 68


def pdf_to_jpeg_b64(pdf_path):
    doc = fitz.open(pdf_path)
    page = doc[0]
    # render a ~150 DPI
    pix = page.get_pixmap(matrix=fitz.Matrix(150 / 72, 150 / 72))
    img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
    if img.height > MAX_H:
        w = int(img.width * MAX_H / img.height)
        img = img.resize((w, MAX_H), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=QUALITY, optimize=True)
    data = buf.getvalue()
    b64 = base64.b64encode(data).decode("ascii")
    return f"data:image/jpeg;base64,{b64}", len(data)


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    args = sys.argv[1:]
    if len(args) < 2 or len(args) % 2:
        sys.exit("uso: py scripts/embed-danfe.py iN arquivo.pdf [iM arquivo2.pdf ...]")
    pairs = [(args[i], args[i + 1]) for i in range(0, len(args), 2)]

    with open(HTML, encoding="utf-8") as f:
        html = f.read()

    anchor = "const IMGS = {"
    if anchor not in html:
        sys.exit("[ERRO] não encontrei 'const IMGS = {' no HTML")

    inserts = []
    for key, pdf in pairs:
        if f'"{key}"' in html:
            sys.exit(f"[ERRO] chave {key} já existe no HTML — escolha outra")
        if not os.path.exists(pdf):
            sys.exit(f"[ERRO] PDF não encontrado: {pdf}")
        uri, nbytes = pdf_to_jpeg_b64(pdf)
        inserts.append(f'\n  "{key}": "{uri}",')
        print(f"  {key}  <- {os.path.basename(pdf)}  ({nbytes // 1024} KB)")

    html = html.replace(anchor, anchor + "".join(inserts), 1)
    with open(HTML, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"[ok] {len(pairs)} imagem(ns) injetada(s) no IMGS")


if __name__ == "__main__":
    main()
