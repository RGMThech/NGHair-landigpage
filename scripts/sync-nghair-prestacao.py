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