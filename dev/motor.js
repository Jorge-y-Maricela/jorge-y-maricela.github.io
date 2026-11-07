/*
 * Ejecuta apps-script/Code.gs fuera de Google, con una hoja de cálculo simulada
 * guardada en un archivo JSON. Sirve para probar la confirmación en local.
 *
 * Uso (macOS):
 *   osascript -l JavaScript dev/motor.js <estado.json> <peticion.json>
 *
 * peticion.json:
 *   { "tipo": "GET",  "parametros": { "accion": "invitado", "codigo": "ABC123" } }
 *   { "tipo": "POST", "cuerpo": "{...}" }
 *   { "tipo": "FUNCION", "funcion": "prepararHojas" }
 *   { "tipo": "ESTADO" }   -> devuelve las hojas
 */
ObjC.import('Foundation');

function leer(ruta) {
  const s = $.NSString.stringWithContentsOfFileEncodingError(ruta, $.NSUTF8StringEncoding, null);
  return s.isNil() ? null : s.js;
}
function escribir(ruta, texto) {
  $(texto).writeToFileAtomicallyEncodingError(ruta, true, $.NSUTF8StringEncoding, null);
}

// ---------------------------------------------------------------- Simulación de Google
function crearMocks(estado) {
  const nada = new Proxy(function () {}, {
    get: (t, k) => (k === 'then' ? undefined : () => nada),
    apply: () => nada,
  });

  function rango(hoja, fila, col, nf, nc) {
    let p; // el propio rango, para encadenar .setValues().setFontWeight()...
    const r = {
      getValues() {
        const out = [];
        for (let i = 0; i < nf; i++) {
          const f = hoja.filas[fila - 1 + i] || [];
          const linea = [];
          for (let j = 0; j < nc; j++) {
            const v = f[col - 1 + j];
            linea.push(v === undefined || v === null ? '' : v);
          }
          out.push(linea);
        }
        return out;
      },
      setValues(vals) {
        if (vals.length !== nf || vals[0].length !== nc) throw new Error(`setValues: tamaño ${vals.length}x${vals[0].length} no coincide con ${nf}x${nc}`);
        vals.forEach((f, i) => {
          const idx = fila - 1 + i;
          while (hoja.filas.length <= idx) hoja.filas.push([]);
          f.forEach((v, j) => { hoja.filas[idx][col - 1 + j] = v instanceof Date ? v.toISOString() : v; });
        });
        return p;
      },
      setValue(v) { return r.setValues([[v]]); },
    };
    p = new Proxy(r, { get: (t, k) => (k in t ? t[k] : () => p) });
    return p;
  }

  function hojaMock(nombre) {
    const h = {
      filas: estado.hojas[nombre],
      getName: () => nombre,
      getLastRow() {
        let n = h.filas.length;
        while (n > 0 && !(h.filas[n - 1] || []).some((v) => v !== '' && v != null)) n--;
        return n;
      },
      getRange(f, c, nf, nc) { return rango(h, f, c, nf || 1, nc || 1); },
      appendRow(arr) {
        const n = h.getLastRow();
        h.filas.length = n;
        h.filas.push(arr.map((v) => (v instanceof Date ? v.toISOString() : v)));
      },
    };
    return new Proxy(h, { get: (t, k) => (k in t ? t[k] : () => nada) });
  }

  const libro = {
    getSheetByName: (n) => (estado.hojas[n] ? hojaMock(n) : null),
    insertSheet: (n) => { estado.hojas[n] = []; return hojaMock(n); },
  };

  return {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => libro,
      getUi: () => { throw new Error('Sin interfaz'); },
    },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: (texto) => ({ setMimeType: () => ({ contenido: texto }) }),
    },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
    console: { log: () => {}, error: () => {} },
  };
}

function run(argv) {
  const [rutaEstado, rutaPeticion] = argv;
  const raiz = rutaEstado.replace(/\/dev\/[^/]+$/, '');
  const codigo = leer(raiz + '/apps-script/Code.gs');
  const estado = JSON.parse(leer(rutaEstado) || '{"hojas":{}}');
  const peticion = JSON.parse(leer(rutaPeticion));

  const mocks = crearMocks(estado);
  const global = globalThis;
  Object.keys(mocks).forEach((k) => { global[k] = mocks[k]; });
  (0, eval)(codigo);

  let salida;
  if (peticion.tipo === 'GET') {
    salida = global.doGet({ parameter: peticion.parametros || {} }).contenido;
  } else if (peticion.tipo === 'POST') {
    salida = global.doPost({ postData: { contents: peticion.cuerpo } }).contenido;
  } else if (peticion.tipo === 'FUNCION') {
    global[peticion.funcion]();
    salida = JSON.stringify({ ok: true });
  } else {
    salida = JSON.stringify(estado);
  }
  escribir(rutaEstado, JSON.stringify(estado, null, 1));
  return salida;
}
