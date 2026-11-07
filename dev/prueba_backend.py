#!/usr/bin/env python3
"""Pruebas del Code.gs real sobre la hoja simulada.  Uso: python3 dev/prueba_backend.py"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import servidor as s  # noqa: E402

s.ESTADO = os.path.join(os.path.dirname(s.ESTADO), "estado-prueba.json")
fallos = 0


def ok(cond, texto):
    global fallos
    print(("  ✓ " if cond else "  ✗ ") + texto)
    if not cond:
        fallos += 1


def get(**p):
    return json.loads(s.motor({"tipo": "GET", "parametros": p}))


def post(**d):
    return json.loads(s.motor({"tipo": "POST", "cuerpo": json.dumps(d)}))


def hojas():
    return json.loads(s.motor({"tipo": "ESTADO"}))["hojas"]


s.sembrar()
h = hojas()
inv = h["Invitados"]
lista = s.leer_invitados()
print("Preparar hojas y generar enlaces")
ok(set(h) == {"Invitados", "Respuestas", "Resumen"}, "crea las tres pestañas")
ok(inv[0][0] == "Código" and len(inv) == len(lista) + 1, f"encabezados + {len(lista)} invitados")
codigos = [f[0] for f in inv[1:]]
ok(codigos == [f[0] for f in lista], f"respeta los códigos de invitados.tsv: {codigos}")
ok(inv[1][4] == f"https://jorge-y-maricela.github.io/?i={codigos[0]}", "enlace personal")
ok(all(f[5] == "" for f in inv[1:]), "sin teléfono no hay enlace de WhatsApp")
ok(h["Resumen"][5][1].startswith("=SUMIF(Invitados!G2:G"), "fórmulas del resumen")

# Un invitado nuevo sin código y con teléfono
estado = json.load(open(s.ESTADO))
estado["hojas"]["Invitados"].append(["", "Invitado Nuevo", "", "961 123 4567"] + [""] * 6)
json.dump(estado, open(s.ESTADO, "w"))
s.motor({"tipo": "FUNCION", "funcion": "generarEnlaces"})
inv = hojas()["Invitados"]
ok([f[0] for f in inv[1:-1]] == codigos, "volver a generar no cambia los códigos")
ok(len(inv[-1][0]) == 6 and inv[-1][2] == 1, "al nuevo le crea código y 1 pase por omisión")
ok(inv[-1][5].startswith("https://wa.me/529611234567?text="), "enlace de WhatsApp con 52 + teléfono")
nombre0, pases0 = lista[0][1], lista[0][2]

print("Consultar invitado")
r = get(accion="invitado", codigo=codigos[0].lower())
ok(r["ok"] and r["invitado"]["nombre"] == nombre0 and r["invitado"]["pases"] == pases0, "encuentra por código (sin importar mayúsculas)")
r2 = get(accion="invitado", codigo=inv[-1][0])
ok("telefono" not in json.dumps(r2) and "9611234567" not in json.dumps(r2), "no expone el teléfono")
ok(r["invitado"]["respuesta"] is None, "sin respuesta todavía")
ok(get(accion="invitado", codigo="ZZZZZZ") == {"ok": False, "error": "no_encontrado"}, "código inexistente")
ok(get(accion="invitado", codigo="<script>")["ok"] is False, "código inválido")

print("Confirmar con código")
ok(post(codigo=codigos[0], asiste=True, personas=pases0 + 1)["error"] == "personas", "rechaza más personas que pases")
ok(post(codigo=codigos[0], asiste=True, personas=0)["error"] == "personas", "rechaza 0 personas si asiste")
ok(post(codigo=codigos[0], asiste="tal vez")["error"] == "asiste", "rechaza respuesta inválida")
r = post(codigo=codigos[0], asiste=True, personas=pases0, mensaje="=HYPERLINK(\"x\")  ¡Felicidades!")
ok(r == {"ok": True, "respuesta": {"nombre": nombre0, "asiste": True, "personas": pases0}}, "guarda la confirmación")
fila = hojas()["Invitados"][1]
ok(fila[6] == "Sí asiste" and fila[7] == pases0, "marca la respuesta en Invitados")
ok(fila[8].startswith("'="), "neutraliza fórmulas en el mensaje")
r = get(accion="invitado", codigo=codigos[0])
ok(r["invitado"]["respuesta"]["asiste"] is True and r["invitado"]["respuesta"]["personas"] == pases0, "la consulta devuelve la respuesta previa")
post(codigo=codigos[0], asiste=False)
fila = hojas()["Invitados"][1]
ok(fila[6] == "No asiste" and fila[7] == 0, "permite cambiar la respuesta")

print("Confirmar sin código")
ok(post(nombre="Carlos Ruiz", asiste=True, personas=1)["error"] == "codigo_requerido", "sin enlace personal no se puede confirmar")
ok(post(nombre="bot", asiste=True, personas=9, sitio="spam.com")["ok"], "el bot recibe 'ok'...")
res = hojas()["Respuestas"]
ok(len(res) == 3 and all(f[1] != "sin código" for f in res[1:]), "...pero no se guarda nada sin código; historial en Respuestas")
ok(json.loads(s.motor({"tipo": "POST", "cuerpo": "no es json"}))["error"] == "formato", "cuerpo inválido")

os.unlink(s.ESTADO)
print(f"\n{'TODO BIEN' if not fallos else f'{fallos} FALLO(S)'}")
sys.exit(1 if fallos else 0)
