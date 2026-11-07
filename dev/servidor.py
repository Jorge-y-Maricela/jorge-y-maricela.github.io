#!/usr/bin/env python3
"""
Servidor de prueba local para la invitación (solo macOS).

- Sirve la página en http://localhost:8642
- Usa la lista real de invitados.tsv.
- Simula la aplicación web de Google Apps Script en /api ejecutando el
  apps-script/Code.gs real (vía dev/motor.js) sobre una hoja simulada en
  dev/estado.json, con algunos invitados de ejemplo.

Uso:  python3 dev/servidor.py            (reinicia los datos de ejemplo)
      python3 dev/servidor.py --conservar (mantiene dev/estado.json)
"""
import json
import os
import subprocess
import sys
import tempfile
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ESTADO = os.path.join(RAIZ, "dev", "estado.json")
MOTOR = os.path.join(RAIZ, "dev", "motor.js")
PUERTO = int(os.environ.get("PORT", "8642"))
candado = threading.Lock()

INVITADOS = os.path.join(RAIZ, "invitados.tsv")


def leer_invitados():
    """Lee invitados.tsv (la misma lista que se pega en la hoja de Google)."""
    invitados = []
    with open(INVITADOS, encoding="utf-8") as f:
        next(f)  # encabezados
        for linea in f:
            codigo, nombre, pases, telefono = (linea.rstrip("\n").split("\t") + [""] * 4)[:4]
            if nombre:
                invitados.append([codigo, nombre, int(pases), telefono])
    return invitados


def motor(peticion):
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
        json.dump(peticion, f)
        ruta = f.name
    try:
        with candado:
            r = subprocess.run(
                ["osascript", "-l", "JavaScript", MOTOR, ESTADO, ruta],
                capture_output=True, text=True, timeout=20,
            )
        if r.returncode != 0:
            raise RuntimeError(r.stderr.strip())
        return r.stdout.strip()
    finally:
        os.unlink(ruta)


def sembrar():
    with open(ESTADO, "w") as f:
        json.dump({"hojas": {}}, f)
    motor({"tipo": "FUNCION", "funcion": "prepararHojas"})
    estado = json.load(open(ESTADO))
    estado["hojas"]["Invitados"] += [fila + [""] * 6 for fila in leer_invitados()]
    json.dump(estado, open(ESTADO, "w"))
    motor({"tipo": "FUNCION", "funcion": "generarEnlaces"})


class Manejador(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=RAIZ, **k)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def responder(self, cuerpo, tipo="application/json; charset=utf-8", codigo=200):
        datos = cuerpo.encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", tipo)
        self.send_header("Content-Length", str(len(datos)))
        self.end_headers()
        self.wfile.write(datos)

    def do_GET(self):
        url = urlparse(self.path)
        if url.path == "/api":
            q = {k: v[0] for k, v in parse_qs(url.query).items()}
            if q.get("lento"):
                import time; time.sleep(float(q["lento"]))
            return self.responder(motor({"tipo": "GET", "parametros": q}))
        if url.path == "/api/estado":
            return self.responder(motor({"tipo": "ESTADO"}))
        if url.path == "/config.js":
            # En local, la invitación usa el servidor simulado.
            with open(os.path.join(RAIZ, "config.js"), encoding="utf-8") as f:
                js = f.read()
            js += "\n;window.INVITACION.rsvp.endpoint = '/api';\n"
            return self.responder(js, "text/javascript; charset=utf-8")
        return super().do_GET()

    def do_POST(self):
        if urlparse(self.path).path != "/api":
            return self.responder('{"ok":false}', codigo=404)
        largo = int(self.headers.get("Content-Length", "0"))
        cuerpo = self.rfile.read(largo).decode("utf-8")
        return self.responder(motor({"tipo": "POST", "cuerpo": cuerpo}))

    def log_message(self, formato, *args):
        sys.stderr.write("· " + (formato % args) + "\n")


if __name__ == "__main__":
    if "--conservar" not in sys.argv or not os.path.exists(ESTADO):
        sembrar()
    estado = json.load(open(ESTADO))
    print(f"Invitación en http://localhost:{PUERTO}")
    for fila in estado["hojas"]["Invitados"][1:]:
        print(f"  {fila[1]:<34} http://localhost:{PUERTO}/?i={fila[0]}")
    sys.stdout.flush()
    ThreadingHTTPServer(("127.0.0.1", PUERTO), Manejador).serve_forever()
