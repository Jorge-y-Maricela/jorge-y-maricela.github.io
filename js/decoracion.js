/*
 * Ilustraciones de la invitación generadas como SVG: ramas, corona de hojas,
 * sello de cera e íconos de línea. Todo usa `currentColor`, así que el color
 * se controla desde CSS.
 */
(function () {
  'use strict';

  // Generador pseudoaleatorio con semilla: las ramas salen igual en cada visita.
  function azar(semilla) {
    let s = semilla >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  const r1 = (n) => Math.round(n * 10) / 10;

  // Hoja en forma de almendra que apunta hacia +x, con nervadura central.
  function hoja(x, y, angulo, largo, ancho) {
    const L = largo, W = ancho;
    const contorno =
      `M0 0C${r1(L * 0.28)} ${r1(-W)} ${r1(L * 0.72)} ${r1(-W * 0.85)} ${r1(L)} 0` +
      `C${r1(L * 0.72)} ${r1(W * 0.85)} ${r1(L * 0.28)} ${r1(W)} 0 0Z`;
    const nervio = `M${r1(L * 0.06)} 0Q${r1(L * 0.5)} ${r1(-W * 0.12)} ${r1(L * 0.86)} 0`;
    return (
      `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(angulo)})">` +
      `<path class="hoja" d="${contorno}"/><path class="nervio" d="${nervio}"/></g>`
    );
  }

  // Punto y tangente de una curva cuadrática.
  function cuadratica(p0, p1, p2, t) {
    const u = 1 - t;
    return {
      x: u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
      y: u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
      dx: 2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]),
      dy: 2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]),
    };
  }

  /**
   * Rama horizontal con hojas alternas.
   * largo: longitud del tallo · arco: curvatura (negativo = hacia arriba)
   */
  function rama(o) {
    o = Object.assign({ largo: 260, arco: -34, hojas: 13, tam: 30, semilla: 7, bayas: true }, o || {});
    const rnd = azar(o.semilla);
    const pad = o.tam * 1.2;
    const p0 = [pad, pad + Math.abs(o.arco)];
    const p2 = [pad + o.largo, pad + Math.abs(o.arco)];
    const p1 = [pad + o.largo / 2, p0[1] + o.arco * 2];
    let g = `<path class="tallo" d="M${p0[0]} ${p0[1]}Q${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]}"/>`;
    for (let i = 0; i < o.hojas; i++) {
      const t = 0.08 + (0.86 * i) / (o.hojas - 1);
      const p = cuadratica(p0, p1, p2, t);
      const base = (Math.atan2(p.dy, p.dx) * 180) / Math.PI;
      const lado = i % 2 === 0 ? -1 : 1;
      const escala = 1 - 0.42 * t + (rnd() - 0.5) * 0.12;
      const ang = base + lado * (46 - 18 * t + (rnd() - 0.5) * 12);
      g += hoja(p.x, p.y, ang, o.tam * escala, o.tam * 0.36 * escala);
      if (o.bayas && i % 3 === 1) {
        const a = ((ang - lado * 70) * Math.PI) / 180;
        const d = o.tam * 0.45 * escala;
        g += `<circle class="baya" cx="${r1(p.x + Math.cos(a) * d)}" cy="${r1(p.y + Math.sin(a) * d)}" r="${r1(o.tam * 0.07)}"/>`;
      }
    }
    const fin = cuadratica(p0, p1, p2, 1);
    g += hoja(p2[0], p2[1], (Math.atan2(fin.dy, fin.dx) * 180) / Math.PI, o.tam * 0.6, o.tam * 0.22);
    const ancho = o.largo + pad * 2 + o.tam * 0.6;
    const alto = Math.abs(o.arco) * 2 + pad * 2;
    return `<svg class="rama" viewBox="0 0 ${r1(ancho)} ${r1(alto)}" aria-hidden="true" focusable="false">${g}</svg>`;
  }

  /** Corona de dos ramas que se unen abajo y dejan un hueco arriba. */
  function corona(o) {
    o = Object.assign({ radio: 90, hojas: 15, tam: 22, hueco: 58, semilla: 3 }, o || {});
    const rnd = azar(o.semilla);
    const c = o.radio + o.tam * 1.3;
    let g = '';
    [-1, 1].forEach((lado) => {
      // Ángulos en grados (90 = abajo). La mitad izquierda crece hacia 180°,
      // la derecha decrece hacia 0°; `hueco` es el espacio libre arriba.
      const inicio = 90 - lado * 6;
      const finReal = 90 - lado * (180 - o.hueco);
      const a0 = (inicio * Math.PI) / 180, a1 = (finReal * Math.PI) / 180;
      const barrido = lado === -1 ? 1 : 0;
      g += `<path class="tallo" d="M${r1(c + o.radio * Math.cos(a0))} ${r1(c + o.radio * Math.sin(a0))}` +
        `A${o.radio} ${o.radio} 0 0 ${barrido} ${r1(c + o.radio * Math.cos(a1))} ${r1(c + o.radio * Math.sin(a1))}"/>`;
      for (let i = 0; i < o.hojas; i++) {
        const t = i / (o.hojas - 1);
        const ang = inicio + (finReal - inicio) * t;
        const a = (ang * Math.PI) / 180;
        const x = c + o.radio * Math.cos(a), y = c + o.radio * Math.sin(a);
        const tangente = ang + (lado === -1 ? 90 : -90);
        const tuerce = i % 2 === 0 ? 1 : -1;
        const escala = 1 - 0.38 * t + (rnd() - 0.5) * 0.1;
        g += hoja(x, y, tangente + tuerce * (38 + (rnd() - 0.5) * 10), o.tam * escala, o.tam * 0.36 * escala);
        if (i % 4 === 2) {
          const ab = ((tangente - tuerce * 60) * Math.PI) / 180;
          g += `<circle class="baya" cx="${r1(x + Math.cos(ab) * o.tam * 0.42)}" cy="${r1(y + Math.sin(ab) * o.tam * 0.42)}" r="${r1(o.tam * 0.08)}"/>`;
        }
      }
    });
    const lado = c * 2;
    return `<svg class="corona" viewBox="0 0 ${r1(lado)} ${r1(lado)}" aria-hidden="true" focusable="false">${g}</svg>`;
  }

  /** Sello de cera dorado con las iniciales. */
  function sello(iniciales) {
    const [a, b] = iniciales;
    // Borde irregular de cera
    const rnd = azar(11);
    let d = '';
    const n = 28;
    for (let i = 0; i <= n; i++) {
      const ang = (i / n) * Math.PI * 2;
      const r = 47 + (rnd() - 0.5) * 3.2 + (i % 2 ? 1.2 : -0.6);
      d += (i ? 'L' : 'M') + r1(50 + Math.cos(ang) * r) + ' ' + r1(50 + Math.sin(ang) * r);
    }
    return `<svg class="sello" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="cera" cx="38%" cy="32%" r="75%">
          <stop offset="0" stop-color="#F3E3B5"/><stop offset=".45" stop-color="#C9A462"/>
          <stop offset=".8" stop-color="#9C7536"/><stop offset="1" stop-color="#7A5824"/>
        </radialGradient>
        <radialGradient id="cera-centro" cx="45%" cy="40%" r="70%">
          <stop offset="0" stop-color="#D9BC7E"/><stop offset="1" stop-color="#A88346"/>
        </radialGradient>
      </defs>
      <path d="${d}Z" fill="url(#cera)"/>
      <circle cx="50" cy="50" r="35" fill="url(#cera-centro)" stroke="#8A6A30" stroke-opacity=".55" stroke-width="1.2"/>
      <circle cx="50" cy="50" r="31" fill="none" stroke="#F6E9C4" stroke-opacity=".55" stroke-width=".7" stroke-dasharray="1.2 2.2"/>
      <text x="50" y="58" text-anchor="middle" font-family="Parisienne, cursive" font-size="27" fill="#6E4F1D" fill-opacity=".85">${a}<tspan font-size="17" dy="-2"> &amp; </tspan><tspan dy="2">${b}</tspan></text>
    </svg>`;
  }

  const trazo = 'fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"';
  const iconos = {
    anillos: `<svg viewBox="0 0 48 48" ${trazo}><circle cx="18" cy="29" r="10"/><circle cx="30" cy="29" r="10"/><path d="M14 13l4-5h12l4 5-10 6z"/><path d="M18 8l6 11 6-11"/></svg>`,
    copas: `<svg viewBox="0 0 48 48" ${trazo}><path d="M11 6h10l-1 11a4 4 0 0 1-8 0z"/><path d="M16 21v15M11 36h10"/><path d="M27 6h10l-1 11a4 4 0 0 1-8 0z"/><path d="M32 21v15M27 36h10"/><path d="M12 12h8M28 12h8"/><path d="M24 3v-1M19 4l-1-1M29 4l1-1"/></svg>`,
    iglesia: `<svg viewBox="0 0 48 48" ${trazo}><path d="M24 4v8M21 7h6"/><path d="M14 22l10-10 10 10"/><path d="M16 20v22h16V20"/><path d="M8 42V28l8-6M40 42V28l-8-6"/><path d="M21 42v-7a3 3 0 0 1 6 0v7"/><path d="M5 42h38"/></svg>`,
    reloj: `<svg viewBox="0 0 48 48" ${trazo}><circle cx="24" cy="25" r="16"/><path d="M24 15v10l7 4"/><path d="M18 5h12M24 5v4"/></svg>`,
    calendario: `<svg viewBox="0 0 48 48" ${trazo}><rect x="7" y="10" width="34" height="30" rx="3"/><path d="M7 18h34M16 6v8M32 6v8"/><path d="M24 33s-6-3.6-6-7.2A3.1 3.1 0 0 1 24 24a3.1 3.1 0 0 1 6 1.8C30 29.4 24 33 24 33z"/></svg>`,
    ubicacion: `<svg viewBox="0 0 48 48" ${trazo}><path d="M24 43s13-12.4 13-23a13 13 0 0 0-26 0c0 10.6 13 23 13 23z"/><circle cx="24" cy="20" r="5"/></svg>`,
    gancho: `<svg viewBox="0 0 48 48" ${trazo}><path d="M20 13a4 4 0 1 1 6 3.5c-1.2.7-2 1.6-2 3V21"/><path d="M24 21L5 34h38z"/></svg>`,
    sobre: `<svg viewBox="0 0 48 48" ${trazo}><rect x="6" y="12" width="36" height="25" rx="2"/><path d="M6 14l18 13 18-13"/><path d="M24 22.5s-3-1.8-3-3.6a1.5 1.5 0 0 1 3-.9 1.5 1.5 0 0 1 3 .9c0 1.8-3 3.6-3 3.6z"/></svg>`,
    regalo: `<svg viewBox="0 0 48 48" ${trazo}><rect x="8" y="18" width="32" height="8" rx="1"/><path d="M11 26v15h26V26M24 18v23"/><path d="M24 18c-3-6-10-8-10-3s7 3 10 3zM24 18c3-6 10-8 10-3s-7 3-10 3z"/></svg>`,
    banco: `<svg viewBox="0 0 48 48" ${trazo}><path d="M6 17L24 7l18 10z"/><path d="M10 20v15M18 20v15M30 20v15M38 20v15M6 39h36"/></svg>`,
    corazon: `<svg viewBox="0 0 48 48" ${trazo}><path d="M24 40S7 29.5 7 18a8.5 8.5 0 0 1 17-3 8.5 8.5 0 0 1 17 3c0 11.5-17 22-17 22z"/></svg>`,
    cena: `<svg viewBox="0 0 48 48" ${trazo}><circle cx="24" cy="25" r="11"/><circle cx="24" cy="25" r="6"/><path d="M6 8v8a3 3 0 0 0 3 3v20M9 8v8M12 8v8"/><path d="M40 8c-3 2-4 6-4 11h4v20"/></svg>`,
    musica: `<svg viewBox="0 0 48 48" ${trazo}><path d="M18 36V10l20-4v26"/><circle cx="13" cy="36" r="5"/><circle cx="33" cy="32" r="5"/><path d="M18 17l20-4"/></svg>`,
    silencio: `<svg viewBox="0 0 48 48" ${trazo}><path d="M18 36V10l20-4v26"/><circle cx="13" cy="36" r="5"/><circle cx="33" cy="32" r="5"/><path d="M6 6l36 36"/></svg>`,
    whatsapp: `<svg viewBox="0 0 48 48" ${trazo}><path d="M8 40l2.6-8A16 16 0 1 1 17 38z"/><path d="M18 17c0 7 5 13 13 13l2-3-4-2-2 2c-2-1-4-3-5-5l2-2-2-4z"/></svg>`,
    copiar: `<svg viewBox="0 0 48 48" ${trazo}><rect x="16" y="16" width="24" height="24" rx="3"/><path d="M32 16v-5a3 3 0 0 0-3-3H11a3 3 0 0 0-3 3v18a3 3 0 0 0 3 3h5"/></svg>`,
    flecha: `<svg viewBox="0 0 48 48" ${trazo}><path d="M24 8v32M12 28l12 12 12-12"/></svg>`,
    menos: `<svg viewBox="0 0 48 48" ${trazo}><path d="M12 24h24"/></svg>`,
    mas: `<svg viewBox="0 0 48 48" ${trazo}><path d="M12 24h24M24 12v24"/></svg>`,
    externo: `<svg viewBox="0 0 48 48" ${trazo}><path d="M28 8h12v12M40 8L22 26"/><path d="M34 28v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V16a2 2 0 0 1 2-2h10"/></svg>`,
  };

  function icono(nombre, clase) {
    const svg = iconos[nombre] || iconos.corazon;
    return svg.replace('<svg ', `<svg class="icono ${clase || ''}" aria-hidden="true" focusable="false" `);
  }

  /** Separador: línea fina con rombo al centro. */
  function separador() {
    return `<div class="separador" aria-hidden="true"><span></span><i></i><span></span></div>`;
  }

  window.Decoracion = { rama, corona, sello, icono, separador };
})();
