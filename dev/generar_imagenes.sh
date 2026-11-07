#!/bin/bash
# Genera img/og.jpg (vista previa al compartir) e íconos con Chrome sin ventana.
# Requiere el servidor de prueba encendido: python3 dev/servidor.py
set -euo pipefail
cd "$(dirname "$0")/.."
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
BASE="http://localhost:8642/dev/og.html"
TMP="$(mktemp -d)"
mkdir -p img

captura() { # url ancho alto salida
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --virtual-time-budget=8000 --window-size="$2,$3" --screenshot="$4" "$1" >/dev/null 2>&1
}

captura "$BASE" 1200 630 "$TMP/og.png"
captura "$BASE?modo=icono" 180 180 "$TMP/icono.png"

python3 - "$TMP" <<'EOF'
import sys
from PIL import Image
tmp = sys.argv[1]
Image.open(f"{tmp}/og.png").convert("RGB").save("img/og.jpg", quality=86, optimize=True, progressive=True)
ic = Image.open(f"{tmp}/icono.png").convert("RGB")
ic.save("img/icono-180.png", optimize=True)
ic.resize((48, 48), Image.LANCZOS).save("img/favicon-48.png", optimize=True)
EOF
rm -rf "$TMP"
ls -l img
