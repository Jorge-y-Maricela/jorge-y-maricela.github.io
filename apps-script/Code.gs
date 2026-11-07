/**
 * ============================================================================
 *  CONFIRMACIONES · Boda de Jorge & Maricela
 * ============================================================================
 *  Este script vive dentro de una Hoja de cálculo de Google y hace dos cosas:
 *
 *   1. Menú «💍 Boda» en la hoja para preparar las pestañas y generar el
 *      enlace personal de cada invitado (con su botón para mandarlo por WhatsApp).
 *   2. Aplicación web que la invitación usa para leer los pases de cada
 *      invitado y guardar su confirmación.
 *
 *  Instrucciones completas en LEEME.md.
 * ============================================================================
 */

const AJUSTES = {
  // Dirección donde está publicada la invitación (con / al final).
  URL_INVITACION: 'https://jorgerealg-star.github.io/boda-jorge-maricela/',
  // false: solo confirman los invitados con enlace personal (los de la pestaña Invitados).
  PERMITIR_SIN_CODIGO: false,
  // Lugares máximos para quien confirma sin enlace personal (si se permite).
  PASES_SIN_CODIGO: 2,
  // Mensaje para enviar la invitación. {nombre} y {enlace} se reemplazan solos.
  MENSAJE_WHATSAPP:
    '¡Hola, {nombre}! 💍\n\n' +
    'Con mucha alegría queremos invitarte a nuestra boda el viernes 11 de diciembre de 2026 en Chiapa de Corzo.\n\n' +
    'Esta es tu invitación personal; ahí mismo puedes confirmar tu asistencia:\n{enlace}\n\n' +
    'Con cariño, Jorge & Maricela',
  HOJA_INVITADOS: 'Invitados',
  HOJA_RESPUESTAS: 'Respuestas',
  HOJA_RESUMEN: 'Resumen',
};

const COL = { CODIGO: 1, NOMBRE: 2, PASES: 3, TELEFONO: 4, ENLACE: 5, WHATSAPP: 6, RESPUESTA: 7, PERSONAS: 8, MENSAJE: 9, FECHA: 10 };
const ENCABEZADOS_INVITADOS = [
  'Código', 'Nombre en la invitación', 'Pases', 'Teléfono (10 dígitos)', 'Enlace personal',
  'Enviar por WhatsApp', 'Respuesta', 'Personas confirmadas', 'Mensaje', 'Respondió el',
];
const ENCABEZADOS_RESPUESTAS = ['Fecha', 'Código', 'Nombre', 'Asiste', 'Personas', 'Mensaje'];
const SI = 'Sí asiste';
const NO = 'No asiste';
const SIN_CODIGO = 'sin código';

// ============================================================================
//  Menú de la hoja
// ============================================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('💍 Boda')
    .addItem('1. Preparar hojas', 'prepararHojas')
    .addItem('2. Generar códigos y enlaces', 'generarEnlaces')
    .addToUi();
}

/** Crea las pestañas Invitados, Respuestas y Resumen (no borra nada que ya exista). */
function prepararHojas() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();

  const inv = hoja_(libro, AJUSTES.HOJA_INVITADOS, ENCABEZADOS_INVITADOS);
  inv.setFrozenRows(1);
  [90, 260, 60, 150, 300, 300, 110, 110, 280, 150].forEach((w, i) => inv.setColumnWidth(i + 1, w));
  inv.getRange(2, COL.TELEFONO, 999, 1).setNumberFormat('@');
  inv.getRange(2, COL.CODIGO, 999, 1).setNumberFormat('@');

  const res = hoja_(libro, AJUSTES.HOJA_RESPUESTAS, ENCABEZADOS_RESPUESTAS);
  res.setFrozenRows(1);
  [160, 90, 240, 70, 80, 400].forEach((w, i) => res.setColumnWidth(i + 1, w));

  let resumen = libro.getSheetByName(AJUSTES.HOJA_RESUMEN);
  if (!resumen) resumen = libro.insertSheet(AJUSTES.HOJA_RESUMEN);
  const I = AJUSTES.HOJA_INVITADOS, R = AJUSTES.HOJA_RESPUESTAS;
  resumen.getRange(1, 1, 9, 2).setValues([
    ['Resumen', ''],
    ['Invitaciones', `=COUNTA(${I}!B2:B)`],
    ['Pases reservados', `=SUM(${I}!C2:C)`],
    ['Invitaciones que ya respondieron', `=COUNTA(${I}!G2:G)`],
    ['Invitaciones sin respuesta', `=B2-B4`],
    ['Personas que asistirán (con enlace)', `=SUMIF(${I}!G2:G,"${SI}",${I}!H2:H)`],
    ['Personas que asistirán (sin enlace)', `=SUMIFS(${R}!E2:E,${R}!B2:B,"${SIN_CODIGO}",${R}!D2:D,"Sí")`],
    ['TOTAL DE PERSONAS', `=B6+B7`],
    ['Invitaciones que no asistirán', `=COUNTIF(${I}!G2:G,"${NO}")`],
  ]);
  resumen.getRange(1, 1).setFontWeight('bold').setFontSize(14);
  resumen.getRange(8, 1, 1, 2).setFontWeight('bold');
  resumen.setColumnWidth(1, 280);

  aviso_('Listo. Escribe tus invitados en la pestaña «Invitados» (nombre, pases y teléfono) y luego usa «2. Generar códigos y enlaces».');
}

/** Pone código, enlace personal y enlace de WhatsApp a cada invitado que no los tenga. */
function generarEnlaces() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(AJUSTES.HOJA_INVITADOS);
  if (!hoja) { aviso_('Primero usa «1. Preparar hojas».'); return; }
  const filas = hoja.getLastRow() - 1;
  if (filas < 1) { aviso_('La pestaña «Invitados» está vacía.'); return; }

  const datos = hoja.getRange(2, 1, filas, COL.WHATSAPP).getValues();
  const usados = {};
  datos.forEach((f) => { if (f[COL.CODIGO - 1]) usados[String(f[COL.CODIGO - 1]).toUpperCase()] = true; });

  let nuevos = 0;
  datos.forEach((f) => {
    const nombre = String(f[COL.NOMBRE - 1] || '').trim();
    if (!nombre) return;
    if (!f[COL.CODIGO - 1]) {
      f[COL.CODIGO - 1] = codigoNuevo_(usados);
      nuevos++;
    }
    const pases = parseInt(f[COL.PASES - 1], 10);
    f[COL.PASES - 1] = pases > 0 ? pases : 1;
    const enlace = AJUSTES.URL_INVITACION + '?i=' + f[COL.CODIGO - 1];
    f[COL.ENLACE - 1] = enlace;
    const tel = telefono_(f[COL.TELEFONO - 1]);
    f[COL.WHATSAPP - 1] = tel
      ? 'https://wa.me/' + tel + '?text=' + encodeURIComponent(
          AJUSTES.MENSAJE_WHATSAPP.replace('{nombre}', nombre).replace('{enlace}', enlace))
      : '';
  });
  hoja.getRange(2, 1, filas, COL.WHATSAPP).setValues(datos);
  aviso_(`Listo: ${nuevos} código(s) nuevo(s). Toca el enlace de la columna «Enviar por WhatsApp» para mandar cada invitación.`);
}

// ============================================================================
//  Aplicación web (la usa la invitación)
// ============================================================================

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.accion === 'invitado') {
    const inv = buscarInvitado_(p.codigo);
    return json_(inv ? { ok: true, invitado: publico_(inv) } : { ok: false, error: 'no_encontrado' });
  }
  return json_({ ok: true, servicio: 'confirmaciones' });
}

function doPost(e) {
  let datos;
  try {
    datos = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'formato' });
  }
  // Campo trampa: los humanos no lo ven; si viene lleno, es un bot.
  if (datos.sitio) return json_({ ok: true, respuesta: { nombre: '', asiste: false, personas: 0 } });

  const candado = LockService.getScriptLock();
  if (!candado.tryLock(15000)) return json_({ ok: false, error: 'ocupado' });
  try {
    return json_(registrar_(datos));
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'interno' });
  } finally {
    candado.releaseLock();
  }
}

function registrar_(d) {
  const asiste = d.asiste === true || d.asiste === 'si';
  const noAsiste = d.asiste === false || d.asiste === 'no';
  if (!asiste && !noAsiste) return { ok: false, error: 'asiste' };

  const personas = asiste ? parseInt(d.personas, 10) : 0;
  const mensaje = limpiar_(d.mensaje, 500);
  const ahora = new Date();
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  const respuestas = libro.getSheetByName(AJUSTES.HOJA_RESPUESTAS);

  if (d.codigo) {
    const inv = buscarInvitado_(d.codigo);
    if (!inv) return { ok: false, error: 'no_encontrado' };
    if (asiste && !(personas >= 1 && personas <= inv.pases)) return { ok: false, error: 'personas', max: inv.pases };
    libro.getSheetByName(AJUSTES.HOJA_INVITADOS)
      .getRange(inv.fila, COL.RESPUESTA, 1, 4)
      .setValues([[asiste ? SI : NO, personas, mensaje, ahora]]);
    respuestas.appendRow([ahora, inv.codigo, inv.nombre, asiste ? 'Sí' : 'No', personas, mensaje]);
    return { ok: true, respuesta: { nombre: inv.nombre, asiste: asiste, personas: personas } };
  }

  if (!AJUSTES.PERMITIR_SIN_CODIGO) return { ok: false, error: 'codigo_requerido' };
  const nombre = limpiar_(d.nombre, 80);
  if (nombre.replace(/^'/, '').length < 3) return { ok: false, error: 'nombre' };
  if (asiste && !(personas >= 1 && personas <= AJUSTES.PASES_SIN_CODIGO)) {
    return { ok: false, error: 'personas', max: AJUSTES.PASES_SIN_CODIGO };
  }
  respuestas.appendRow([ahora, SIN_CODIGO, nombre, asiste ? 'Sí' : 'No', personas, mensaje]);
  return { ok: true, respuesta: { nombre: nombre.replace(/^'/, ''), asiste: asiste, personas: personas } };
}

// ============================================================================
//  Utilidades
// ============================================================================

function buscarInvitado_(codigo) {
  const cod = String(codigo || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{4,12}$/.test(cod)) return null;
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(AJUSTES.HOJA_INVITADOS);
  if (!hoja || hoja.getLastRow() < 2) return null;
  const datos = hoja.getRange(2, 1, hoja.getLastRow() - 1, COL.FECHA).getValues();
  for (let i = 0; i < datos.length; i++) {
    const f = datos[i];
    if (String(f[COL.CODIGO - 1]).trim().toUpperCase() !== cod) continue;
    const pases = parseInt(f[COL.PASES - 1], 10);
    const r = f[COL.RESPUESTA - 1];
    return {
      fila: i + 2,
      codigo: cod,
      nombre: String(f[COL.NOMBRE - 1]).trim(),
      pases: pases > 0 ? pases : 1,
      respuesta: r === SI || r === NO
        ? { asiste: r === SI, personas: Number(f[COL.PERSONAS - 1]) || 0, mensaje: String(f[COL.MENSAJE - 1] || '') }
        : null,
    };
  }
  return null;
}

/** Solo lo que la invitación necesita: nunca el teléfono ni la fila. */
function publico_(inv) {
  return { codigo: inv.codigo, nombre: inv.nombre, pases: inv.pases, respuesta: inv.respuesta };
}

function codigoNuevo_(usados) {
  const letras = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sin 0/O, 1/I/L para que no se confundan
  let c;
  do {
    c = '';
    for (let i = 0; i < 6; i++) c += letras.charAt(Math.floor(Math.random() * letras.length));
  } while (usados[c]);
  usados[c] = true;
  return c;
}

function telefono_(v) {
  const d = String(v || '').replace(/\D/g, '');
  if (d.length === 10) return '52' + d;
  if (d.length === 12 && d.indexOf('52') === 0) return d;
  if (d.length === 13 && d.indexOf('521') === 0) return '52' + d.slice(3);
  return '';
}

/** Recorta, quita caracteres de control y evita que el texto se tome como fórmula. */
function limpiar_(v, max) {
  let s = String(v == null ? '' : v).replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, ' ').trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function hoja_(libro, nombre, encabezados) {
  let h = libro.getSheetByName(nombre);
  if (!h) h = libro.insertSheet(nombre);
  h.getRange(1, 1, 1, encabezados.length)
    .setValues([encabezados])
    .setFontWeight('bold')
    .setBackground('#B8955A')
    .setFontColor('#FFFFFF');
  return h;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function aviso_(texto) {
  try {
    SpreadsheetApp.getUi().alert(texto);
  } catch (err) {
    console.log(texto); // Cuando se ejecuta sin la hoja abierta
  }
}
