from pathlib import Path
import base64
import hashlib
import re


SOURCE = Path("NGHairBrooklin_prestacaocontas/prestacao-contas-nghair-brooklin.html")
PUBLIC_TOP = Path("public/NGHairBrooklin_prestacaocontas.html")
PUBLIC_INDEX = Path("public/NGHairBrooklin_prestacaocontas/index.html")
ASSETS_DIR = Path("public/NGHairBrooklin_prestacaocontas/assets")


DATA_URL_RE = re.compile(
    r"data:image/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=\n\r]+)"
)

PASSWORD_GATE = """<script>
(function(){
  var KEY='ngh_prest_auth_v1';
  var PASS='rodrigomello$$';
  if(sessionStorage.getItem(KEY)==='1')return;
  document.documentElement.style.visibility='hidden';
  document.addEventListener('DOMContentLoaded',function(){
    var ov=document.createElement('div');
    ov.style.cssText='position:fixed;inset:0;background:#1a1a1a;color:#fff;z-index:99999;display:flex;align-items:center;justify-content:center;font-family:Inter,sans-serif;visibility:visible;';
    ov.innerHTML='<form id=\"pwF\" style=\"background:#222;padding:36px 32px;border-radius:12px;max-width:360px;width:90%;border:1px solid #333;\">'
      +'<div style=\"font-family:JetBrains Mono,monospace;font-size:11px;letter-spacing:.18em;color:#b8965a;text-transform:uppercase;margin-bottom:12px;\">Acesso restrito</div>'
      +'<h2 style=\"font-family:DM Serif Display,serif;font-weight:400;font-size:22px;margin-bottom:18px;\">Prestação de Contas</h2>'
      +'<input id=\"pwI\" type=\"password\" placeholder=\"Digite a senha\" autofocus style=\"width:100%;padding:12px 14px;border-radius:8px;border:1px solid #444;background:#111;color:#fff;font-size:14px;margin-bottom:12px;outline:none;\">'
      +'<div id=\"pwE\" style=\"color:#e57373;font-size:12px;min-height:16px;margin-bottom:10px;\"></div>'
      +'<button type=\"submit\" style=\"width:100%;padding:12px;border:0;border-radius:8px;background:#b8965a;color:#1a1a1a;font-weight:600;cursor:pointer;font-size:14px;\">Entrar</button>'
      +'</form>';
    document.body.appendChild(ov);
    document.documentElement.style.visibility='visible';
    document.getElementById('pwF').addEventListener('submit',function(e){
      e.preventDefault();
      if(document.getElementById('pwI').value===PASS){sessionStorage.setItem(KEY,'1');ov.remove();}
      else{document.getElementById('pwE').textContent='Senha incorreta';}
    });
  });
})();
</script>
"""


def inject_password_gate(html: str) -> str:
    if "ngh_prest_auth_v1" in html:
        return html
    return html.replace("</title>", "</title>\n" + PASSWORD_GATE, 1)


def convert_html(source_html: str, asset_prefix: str) -> str:
    def replace(match: re.Match[str]) -> str:
        extension = match.group(1).lower()
        if extension == "jpeg":
            extension = "jpg"

        encoded = re.sub(r"\s+", "", match.group(2))
        image_bytes = base64.b64decode(encoded)
        digest = hashlib.sha1(image_bytes).hexdigest()[:16]
        filename = f"image-{digest}.{extension}"
        asset_path = ASSETS_DIR / filename

        if not asset_path.exists():
            asset_path.write_bytes(image_bytes)

        return f"{asset_prefix}{filename}"

    return DATA_URL_RE.sub(replace, source_html)


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Arquivo fonte não encontrado: {SOURCE}")

    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_INDEX.parent.mkdir(parents=True, exist_ok=True)

    source_html = SOURCE.read_text(encoding="utf-8", errors="ignore")
    source_html = inject_password_gate(source_html)
    PUBLIC_TOP.write_text(
        convert_html(source_html, "NGHairBrooklin_prestacaocontas/assets/"),
        encoding="utf-8",
    )
    PUBLIC_INDEX.write_text(convert_html(source_html, "assets/"), encoding="utf-8")

    for output in (PUBLIC_TOP, PUBLIC_INDEX):
        html = output.read_text(encoding="utf-8", errors="ignore")
        if "data:image/" in html:
            raise SystemExit(f"Ainda existem imagens base64 em {output}")


if __name__ == "__main__":
    main()