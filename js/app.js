/*
 * Invitación de boda: arma la página a partir de config.js y maneja
 * el sobre, la cuenta regresiva, el calendario y la confirmación.
 */
(function () {
  'use strict';

  const C = window.INVITACION;
  const D = window.Decoracion;
  const $ = (sel, raiz) => (raiz || document).querySelector(sel);
  const $$ = (sel, raiz) => Array.from((raiz || document).querySelectorAll(sel));
  const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const esc = (v) =>
    String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------------------------------------------------------------- Parámetros
  const params = new URLSearchParams(location.search);
  const codigo = (params.get('i') || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
  // ?ahora=2026-12-12T10:00 permite revisar cómo se ve la página en otra fecha.
  const ahoraSimulado = params.get('ahora') ? new Date(params.get('ahora')) : null;
  const ahora = () => (ahoraSimulado && !isNaN(ahoraSimulado) ? new Date(ahoraSimulado.getTime() + (performance.now() | 0)) : new Date());

  // ---------------------------------------------------------------- Fechas
  const inicio = new Date(C.fecha);
  const fin = new Date(C.finEvento);
  const limite = C.rsvp.fechaLimite ? new Date(C.rsvp.fechaLimite + 'T23:59:59-06:00') : null;

  function partesFecha(fecha) {
    const f = new Intl.DateTimeFormat('es-MX', {
      timeZone: C.zonaHoraria, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    }).formatToParts(fecha);
    const p = {};
    f.forEach((x) => (p[x.type] = x.value));
    const num = new Intl.DateTimeFormat('en-CA', { timeZone: C.zonaHoraria, year: 'numeric', month: '2-digit', day: '2-digit' }).format(fecha);
    const [a, m, d] = num.split('-').map(Number);
    const periodo = (p.dayPeriod || '').replace(/\./g, '').replace(/\s/g, '').toLowerCase();
    return { diaSemana: p.weekday, dia: d, mes: p.month, mesNum: m, anio: a, hora: `${p.hour}:${p.minute} ${periodo}` };
  }
  const F = partesFecha(inicio);
  const fechaCorta = `${String(F.dia).padStart(2, '0')} · ${String(F.mesNum).padStart(2, '0')} · ${F.anio}`;
  const fechaLimiteTexto = limite
    ? new Intl.DateTimeFormat('es-MX', { timeZone: C.zonaHoraria, day: 'numeric', month: 'long' }).format(limite)
    : '';

  function etapa() {
    const t = ahora();
    if (t < inicio) return 'antes';
    if (t < fin) return 'hoy';
    return 'despues';
  }

  const N = C.novios;
  const nombres = `${N.el.nombre} &amp; ${N.ella.nombre}`;

  // ---------------------------------------------------------------- Secciones
  function seccion(clase, contenido, extra) {
    return `<section class="seccion ${clase}" ${extra || ''}><div class="seccion__dentro">${contenido}</div></section>`;
  }

  function titulo(texto, icono) {
    return `${icono ? `<div class="seccion__icono">${D.icono(icono)}</div>` : ''}<h2 class="titulo">${texto}</h2>`;
  }

  function portada() {
    const fin_ = etapa() === 'despues';
    return `
    <header class="portada" id="inicio">
      <div class="portada__rama portada__rama--arriba">${D.rama({ largo: 250, arco: -30, hojas: 13, tam: 30, semilla: 4 })}</div>
      <div class="portada__rama portada__rama--abajo">${D.rama({ largo: 230, arco: -26, hojas: 12, tam: 28, semilla: 9 })}</div>
      <div class="portada__marco"></div>
      <div class="portada__contenido">
        <p class="portada__antes revelar">${fin_ ? 'Gracias por acompañarnos' : 'Nos casamos'}</p>
        <div class="portada__monograma revelar">
          ${D.corona({ radio: 64, hojas: 13, tam: 19, hueco: 62, semilla: 5 })}
          <span>${esc(N.iniciales[0])}<i>&amp;</i>${esc(N.iniciales[1])}</span>
        </div>
        <h1 class="portada__nombres revelar">
          <span>${esc(N.el.nombre)}</span>
          <span class="portada__y">&amp;</span>
          <span>${esc(N.ella.nombre)}</span>
        </h1>
        <div class="portada__fecha revelar">
          <span>${esc(F.diaSemana)}</span>
          <strong>${fechaCorta}</strong>
          <span>${esc(F.hora)}</span>
        </div>
        <p class="portada__lugar revelar">${D.icono('ubicacion')} ${esc(C.ciudad)}</p>
        <div class="portada__invitado revelar" id="portada-invitado" hidden></div>
      </div>
      <a class="portada__bajar" href="#frase" aria-label="Ver la invitación">${D.icono('flecha')}</a>
    </header>`;
  }

  function frase() {
    return seccion('seccion--frase', `
      <div class="frase revelar">
        <div class="frase__rama">${D.rama({ largo: 120, arco: -10, hojas: 7, tam: 18, semilla: 2, bayas: false })}</div>
        <p>${esc(C.frase)}</p>
      </div>`, 'id="frase"');
  }

  function padres() {
    const bloque = (rol, lista) => `
      <div class="padres__grupo revelar">
        <p class="etiqueta">${rol}</p>
        ${lista.map((n) => `<p class="padres__nombre">${esc(n)}</p>`).join('')}
      </div>`;
    return seccion('seccion--padres', `
      <p class="padres__intro revelar">Con la bendición de Dios<br>y de nuestros padres</p>
      <div class="padres">
        ${bloque('Padres de la novia', C.padres.novia)}
        <div class="padres__divisor" aria-hidden="true"></div>
        ${bloque('Padres del novio', C.padres.novio)}
      </div>
      ${D.separador()}
      <p class="padres__honor revelar">tenemos el honor de invitarte a celebrar nuestro matrimonio</p>
      <p class="padres__novios revelar">
        <span>${esc(N.el.completo)}</span>
        <i>&amp;</i>
        <span>${esc(N.ella.completo)}</span>
      </p>`);
  }

  function calendario() {
    const dias = new Date(Date.UTC(F.anio, F.mesNum, 0)).getUTCDate();
    const primero = (new Date(Date.UTC(F.anio, F.mesNum - 1, 1)).getUTCDay() + 6) % 7; // lunes = 0
    const cab = ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d) => `<span class="cal__cab">${d}</span>`).join('');
    let celdas = '';
    for (let i = 0; i < primero; i++) celdas += '<span></span>';
    for (let d = 1; d <= dias; d++) {
      celdas += d === F.dia
        ? `<span class="cal__dia cal__dia--boda" aria-current="date">${D.icono('corazon')}<b>${d}</b></span>`
        : `<span class="cal__dia">${d}</span>`;
    }
    return `
      <div class="cal revelar" role="img" aria-label="Calendario de ${esc(F.mes)} ${F.anio} con el día ${F.dia} marcado">
        <p class="cal__mes">${esc(F.mes)} ${F.anio}</p>
        <div class="cal__rejilla" aria-hidden="true">${cab}${celdas}</div>
      </div>`;
  }

  function fecha() {
    const e = etapa();
    const cuenta = e === 'antes'
      ? `<div class="cuenta revelar" id="cuenta" aria-live="off">
          ${['días', 'horas', 'min', 'seg'].map((u) => `<div class="cuenta__caja"><b data-u="${u}">0</b><span>${u}</span></div>`).join('')}
        </div>`
      : `<p class="cuenta__mensaje revelar">${e === 'hoy' ? '¡Hoy es el gran día!' : '¡Gracias por ser parte de nuestra historia!'}</p>`;
    return seccion('seccion--fecha', `
      ${titulo('Reserva la fecha', 'calendario')}
      <div class="fecha-grande revelar">
        <span class="fecha-grande__lado">${esc(F.diaSemana)}</span>
        <span class="fecha-grande__dia">${F.dia}</span>
        <span class="fecha-grande__lado">${esc(F.mes)}<br>${F.anio}</span>
      </div>
      ${e === 'antes' ? '<p class="etiqueta etiqueta--centro revelar">Faltan</p>' : ''}
      ${cuenta}
      ${calendario()}
      ${e === 'antes' ? `
      <div class="botones revelar">
        <a class="boton boton--linea" id="cal-google" target="_blank" rel="noopener">${D.icono('calendario')}Google Calendar</a>
        <button class="boton boton--linea" id="cal-ics" type="button">${D.icono('calendario')}Apple / Outlook</button>
      </div>` : ''}`, 'id="fecha"');
  }

  function eventos() {
    return C.eventos.map((ev) => {
      const [lat, lng] = ev.coordenadas || [];
      const mapa = lat
        ? `<div class="mapa">
            <a class="mapa__respaldo" href="${esc(ev.mapa)}" target="_blank" rel="noopener">${D.icono('ubicacion')}<span>${esc(ev.lugar)}</span><em>Abrir el mapa</em></a>
            <iframe title="Mapa de ${esc(ev.lugar)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
              data-src="https://www.google.com/maps/embed?origin=mfe&pb=!1m3!2m1!1s${lat},${lng}!6i16"></iframe>
          </div>`
        : '';
      return seccion('seccion--evento', `
        ${titulo(esc(ev.titulo), ev.icono)}
        <div class="evento revelar">
          <p class="evento__hora">${esc(ev.hora)}</p>
          <p class="evento__lugar">${esc(ev.lugar)}</p>
          <p class="evento__dir">${ev.direccion.map(esc).join('<br>')}</p>
          ${mapa}
          <div class="botones">
            <a class="boton boton--oro" href="${esc(ev.mapa)}" target="_blank" rel="noopener">${D.icono('ubicacion')}Google Maps</a>
            ${lat ? `<a class="boton boton--linea" href="https://waze.com/ul?ll=${lat},${lng}&navigate=yes" target="_blank" rel="noopener">${D.icono('ubicacion')}Waze</a>` : ''}
          </div>
        </div>`);
    }).join('');
  }

  function itinerario() {
    if (!C.itinerario.length) return '';
    return seccion('seccion--itinerario', `
      ${titulo('Itinerario', 'reloj')}
      <ol class="linea">
        ${C.itinerario.map((p) => `
          <li class="linea__paso revelar">
            <span class="linea__icono">${D.icono(p.icono || 'corazon')}</span>
            <span class="linea__hora">${esc(p.hora)}</span>
            <span class="linea__titulo">${esc(p.titulo)}</span>
          </li>`).join('')}
      </ol>`);
  }

  function padrinos() {
    if (!C.padrinos.length) return '';
    return seccion('seccion--padrinos', `
      ${titulo('Nuestros padrinos', 'anillos')}
      <div class="padrinos">
        ${C.padrinos.map((p) => `
          <div class="padres__grupo revelar">
            <p class="etiqueta">${esc(p.titulo)}</p>
            ${p.nombres.map((n) => `<p class="padres__nombre">${esc(n)}</p>`).join('')}
          </div>`).join(D.separador())}
      </div>`);
  }

  function vestimenta() {
    if (!C.vestimenta) return '';
    return seccion('seccion--vestimenta', `
      ${titulo('Código de vestimenta', 'gancho')}
      <p class="vestimenta__tipo revelar">${esc(C.vestimenta.tipo)}</p>
      ${C.vestimenta.nota ? `<p class="nota revelar"><span class="nota__punto" aria-hidden="true"></span>${esc(C.vestimenta.nota)}</p>` : ''}`);
  }

  function regalos() {
    const R = C.regalos;
    if (!R) return '';
    const tarjetas = [];
    if (R.lluviaDeSobres) {
      tarjetas.push(`
        <div class="regalo revelar">
          ${D.icono('sobre')}
          <h3>Lluvia de sobres</h3>
          <p>El día del evento habrá un buzón para tu sobre.</p>
        </div>`);
    }
    (R.mesas || []).forEach((m) => {
      tarjetas.push(`
        <div class="regalo revelar">
          ${D.icono('regalo')}
          <h3>${esc(m.tienda)}</h3>
          ${m.evento ? `<p>Evento <b>${esc(m.evento)}</b></p>` : ''}
          ${m.url ? `<a class="boton boton--linea boton--chico" href="${esc(m.url)}" target="_blank" rel="noopener">${D.icono('externo')}Ver mesa</a>` : ''}
        </div>`);
    });
    if (R.transferencia) {
      const T = R.transferencia;
      tarjetas.push(`
        <div class="regalo regalo--ancho revelar">
          ${D.icono('banco')}
          <h3>Transferencia</h3>
          <p>${esc(T.banco)} · ${esc(T.titular)}</p>
          <p class="regalo__clabe">${esc(T.clabe)}</p>
          <button class="boton boton--linea boton--chico" type="button" data-copiar="${esc(T.clabe)}">${D.icono('copiar')}Copiar CLABE</button>
        </div>`);
    }
    if (!tarjetas.length) return '';
    return seccion('seccion--regalos', `
      ${titulo('Mesa de regalos', 'regalo')}
      <p class="texto revelar">${esc(R.texto)}</p>
      <div class="regalos regalos--${tarjetas.length}">${tarjetas.join('')}</div>`);
  }

  function galeria() {
    if (!C.fotos.length) return '';
    return seccion('seccion--galeria', `
      ${titulo('Nuestra historia', 'corazon')}
      <div class="galeria">
        ${C.fotos.map((f, i) => `
          <button class="galeria__foto revelar" type="button" data-foto="${i}" aria-label="Ver foto: ${esc(f.alt)}">
            <img src="${esc(f.src)}" alt="${esc(f.alt)}" loading="lazy" decoding="async">
          </button>`).join('')}
      </div>`);
  }

  function confirmacion() {
    const e = etapa();
    if (e !== 'antes') return '';
    // El enlace general es solo la invitación: confirman únicamente los invitados con pase.
    if (C.rsvp.soloConEnlace && !codigo) return '';
    return seccion('seccion--rsvp', `
      ${titulo('Confirma tu asistencia', 'sobre')}
      ${limite ? `<p class="rsvp__limite revelar">Por favor confírmanos antes del <b>${esc(fechaLimiteTexto)}</b></p>` : ''}
      <div class="rsvp revelar" id="rsvp" aria-live="polite"></div>`, 'id="confirmar"');
  }

  function cierre() {
    const e = etapa();
    return `
    <footer class="cierre">
      <div class="cierre__rama">${D.rama({ largo: 200, arco: -20, hojas: 11, tam: 24, semilla: 13 })}</div>
      <p class="cierre__antes revelar">${e === 'despues' ? 'Con todo nuestro cariño' : 'Te esperamos'}</p>
      <p class="cierre__nombres revelar">${nombres}</p>
      <p class="cierre__fecha revelar">${String(F.dia).padStart(2, '0')}.${String(F.mesNum).padStart(2, '0')}.${F.anio}</p>
    </footer>`;
  }

  function render() {
    $('#contenido').innerHTML =
      portada() + frase() + padres() + fecha() + eventos() + itinerario() + padrinos() +
      vestimenta() + regalos() + galeria() + confirmacion() + cierre();
  }

  // ---------------------------------------------------------------- Sobre
  function iniciarSobre() {
    const escena = $('#sobre-escena');
    if (sessionStorage.getItem('sobre-abierto') || params.has('sin-sobre')) {
      return Promise.resolve(false);
    }
    $('#sobre-nombres').innerHTML = nombres;
    $('#sobre-sello').innerHTML = D.sello(N.iniciales);
    $('#sobre-carta').innerHTML = `
      <span class="carta__antes">Nos casamos</span>
      <span class="carta__nombres">${nombres}</span>
      <span class="carta__fecha">${fechaCorta}</span>`;
    escena.hidden = false;
    document.documentElement.classList.add('bloqueado');

    return new Promise((resolver) => {
      $('#sobre').addEventListener('click', () => {
        if (escena.classList.contains('abierto')) return;
        escena.classList.add('abierto');
        sessionStorage.setItem('sobre-abierto', '1');
        empezarMusica();
        const espera = reducirMovimiento ? 200 : 2300;
        setTimeout(() => {
          escena.classList.add('fuera');
          document.documentElement.classList.remove('bloqueado');
          resolver(true);
          setTimeout(() => { escena.hidden = true; }, 900);
        }, espera);
      });
    });
  }

  // ---------------------------------------------------------------- Música
  let audio = null;
  function empezarMusica() {
    if (!C.musica) return;
    const boton = $('#boton-musica');
    if (!audio) {
      audio = new Audio(C.musica);
      audio.loop = true;
      audio.volume = 0.6;
      boton.hidden = false;
      boton.addEventListener('click', () => {
        if (audio.paused) audio.play().catch(() => {}); else audio.pause();
      });
      const pintar = () => {
        const sonando = !audio.paused;
        boton.innerHTML = D.icono(sonando ? 'musica' : 'silencio');
        boton.setAttribute('aria-pressed', String(sonando));
        boton.setAttribute('aria-label', sonando ? 'Pausar la música' : 'Reproducir la música');
        boton.classList.toggle('sonando', sonando);
      };
      audio.addEventListener('play', pintar);
      audio.addEventListener('pause', pintar);
      pintar();
    }
    audio.play().catch(() => {});
  }

  // ---------------------------------------------------------------- Cuenta regresiva
  function iniciarCuenta() {
    const caja = $('#cuenta');
    if (!caja) return;
    const campos = {};
    $$('b[data-u]', caja).forEach((b) => (campos[b.dataset.u] = b));
    const tic = () => {
      let s = Math.max(0, Math.floor((inicio - ahora()) / 1000));
      if (s === 0) { location.reload(); return; }
      const d = Math.floor(s / 86400); s -= d * 86400;
      const h = Math.floor(s / 3600); s -= h * 3600;
      const m = Math.floor(s / 60); s -= m * 60;
      campos['días'].textContent = d;
      campos.horas.textContent = String(h).padStart(2, '0');
      campos.min.textContent = String(m).padStart(2, '0');
      campos.seg.textContent = String(s).padStart(2, '0');
    };
    tic();
    setInterval(tic, 1000);
  }

  // ---------------------------------------------------------------- Calendario (agendar)
  const ev0 = C.eventos[0];
  const lugarTexto = `${ev0.lugar}, ${ev0.direccion.join(', ')}`;
  const tituloEvento = `Boda de ${N.el.nombre} & ${N.ella.nombre}`;
  const utc = (f) => f.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  function iniciarAgendar() {
    const g = $('#cal-google');
    if (!g) return;
    const u = new URL('https://calendar.google.com/calendar/render');
    u.searchParams.set('action', 'TEMPLATE');
    u.searchParams.set('text', tituloEvento);
    u.searchParams.set('dates', `${utc(inicio)}/${utc(fin)}`);
    u.searchParams.set('location', lugarTexto);
    u.searchParams.set('details', `${ev0.hora} · ${ev0.lugar}. Mapa: ${ev0.mapa}`);
    g.href = u.toString();

    $('#cal-ics').addEventListener('click', () => {
      const e = (t) => t.replace(/([,;\\])/g, '\\$1');
      const ics = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Boda JM//Invitacion//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:boda-${utc(inicio)}@invitacion`,
        `DTSTAMP:${utc(new Date())}`,
        `DTSTART:${utc(inicio)}`,
        `DTEND:${utc(fin)}`,
        `SUMMARY:${e(tituloEvento)}`,
        `LOCATION:${e(lugarTexto)}`,
        `DESCRIPTION:${e(`Mapa: ${ev0.mapa}`)}`,
        'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', `DESCRIPTION:${e(tituloEvento)}`, 'END:VALARM',
        'END:VEVENT', 'END:VCALENDAR',
      ].join('\r\n');
      const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
      const a = Object.assign(document.createElement('a'), { href: url, download: 'boda-jorge-maricela.ics' });
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    });
  }

  // ---------------------------------------------------------------- Avisos y extras
  let avisoT;
  function aviso(texto) {
    const a = $('#aviso');
    a.textContent = texto;
    a.classList.add('visible');
    clearTimeout(avisoT);
    avisoT = setTimeout(() => a.classList.remove('visible'), 2600);
  }

  function iniciarExtras() {
    document.addEventListener('click', (e) => {
      const copiar = e.target.closest('[data-copiar]');
      if (copiar) {
        navigator.clipboard.writeText(copiar.dataset.copiar).then(() => aviso('Copiado'), () => aviso('No se pudo copiar'));
      }
      const foto = e.target.closest('[data-foto]');
      if (foto) {
        const f = C.fotos[+foto.dataset.foto];
        const visor = $('#visor');
        $('img', visor).src = f.src;
        $('img', visor).alt = f.alt;
        visor.showModal();
      }
    });
    const visor = $('#visor');
    visor.addEventListener('click', (e) => {
      if (e.target === visor || e.target.closest('.visor__cerrar')) visor.close();
    });

    // El mapa se carga solo cuando se acerca a la pantalla.
    const mapas = $$('iframe[data-src]');
    if (mapas.length) {
      const io = new IntersectionObserver((entradas) => {
        entradas.forEach((en) => {
          if (en.isIntersecting) { en.target.src = en.target.dataset.src; io.unobserve(en.target); }
        });
      }, { rootMargin: '600px 0px' });
      mapas.forEach((m) => io.observe(m));
    }
  }

  function iniciarRevelado() {
    const elementos = $$('.revelar');
    if (reducirMovimiento || !('IntersectionObserver' in window)) {
      elementos.forEach((el) => el.classList.add('visto'));
      return;
    }
    const io = new IntersectionObserver((entradas) => {
      entradas.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('visto'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    elementos.forEach((el) => io.observe(el));
  }

  // ================================================================ Confirmación
  const CLAVE_LOCAL = 'boda-jm-respuesta' + (codigo ? '-' + codigo : '');
  const rsvp = {
    invitado: null,     // { codigo, nombre, pases, respuesta }
    respuesta: null,    // { nombre, asiste, personas }
    aviso: '',
  };

  const api = {
    activa: Boolean(C.rsvp.endpoint),
    async pedir(url, opciones) {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 20000);
      try {
        const r = await fetch(url, Object.assign({ signal: ctl.signal, redirect: 'follow' }, opciones));
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return await r.json();
      } finally {
        clearTimeout(t);
      }
    },
    invitado(cod) {
      const u = new URL(C.rsvp.endpoint, location.href);
      u.searchParams.set('accion', 'invitado');
      u.searchParams.set('codigo', cod);
      return this.pedir(u.toString());
    },
    confirmar(datos) {
      return this.pedir(C.rsvp.endpoint, {
        method: 'POST',
        // text/plain evita la verificación previa (CORS) que Apps Script no admite.
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(Object.assign({ accion: 'confirmar' }, datos)),
      });
    },
  };

  const whatsappNumero = (C.rsvp.whatsapp || '').replace(/\D/g, '');
  function enlaceWhatsapp(r) {
    const tel = whatsappNumero.length === 10 ? '52' + whatsappNumero : whatsappNumero;
    const texto = r.asiste
      ? `¡Hola! Soy ${r.nombre}. Confirmo mi asistencia a la boda de ${N.el.nombre} y ${N.ella.nombre} el ${F.dia} de ${F.mes}. Seremos ${r.personas} ${r.personas === 1 ? 'persona' : 'personas'}.`
      : `¡Hola! Soy ${r.nombre}. Muchas gracias por la invitación a la boda de ${N.el.nombre} y ${N.ella.nombre}; lamentablemente no podré asistir.`;
    return `https://wa.me/${tel}?text=${encodeURIComponent(texto + (r.mensaje ? `\n\n${r.mensaje}` : ''))}`;
  }

  const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;
  const caja = () => $('#rsvp');

  function pintarCargando() {
    caja().innerHTML = `<div class="rsvp__cargando"><span class="puntos"><i></i><i></i><i></i></span>Buscando tu invitación…</div>`;
  }

  function maxPersonas() {
    return rsvp.invitado ? rsvp.invitado.pases : C.rsvp.pasesSinCodigo;
  }

  function pintarFormulario(previo) {
    const inv = rsvp.invitado;
    const max = maxPersonas();
    const cerrado = limite && ahora() > limite;
    const p = previo || {};

    if (cerrado) {
      caja().innerHTML = `
        <div class="rsvp__tarjeta">
          <p class="rsvp__grande">La fecha para confirmar ya pasó</p>
          <p>Si aún necesitas avisarnos algo, escríbenos directamente.</p>
          ${whatsappNumero ? `<a class="boton boton--oro" href="${enlaceWhatsapp({ nombre: inv ? inv.nombre : '', asiste: true, personas: 1 })}" target="_blank" rel="noopener">${D.icono('whatsapp')}Escribir por WhatsApp</a>` : ''}
        </div>`;
      return;
    }

    caja().innerHTML = `
      ${inv ? `
        <div class="rsvp__saludo">
          <p class="rsvp__para">Invitación para</p>
          <p class="rsvp__nombre">${esc(inv.nombre)}</p>
          <p class="rsvp__pases">Hemos reservado <b>${plural(inv.pases, 'lugar', 'lugares')}</b> en su honor</p>
        </div>` : ''}
      ${rsvp.aviso ? `<p class="rsvp__aviso">${esc(rsvp.aviso)}</p>` : ''}
      <form class="rsvp__form" novalidate>
        ${inv ? '' : `
        <label class="campo">
          <span>Nombre completo</span>
          <input name="nombre" type="text" required maxlength="80" autocomplete="name" value="${esc(p.nombre || '')}" placeholder="Como aparece en tu invitación">
        </label>`}
        <fieldset class="opciones">
          <legend>¿Nos acompañarás?</legend>
          <label class="opcion">
            <input type="radio" name="asiste" value="si" ${p.asiste === true ? 'checked' : ''}>
            <span>${D.icono('copas')}Sí, ahí estaré</span>
          </label>
          <label class="opcion">
            <input type="radio" name="asiste" value="no" ${p.asiste === false ? 'checked' : ''}>
            <span>${D.icono('sobre')}No podré asistir</span>
          </label>
        </fieldset>
        <div class="personas" ${p.asiste === true ? '' : 'hidden'}>
          <span class="personas__pregunta" id="personas-etiqueta">¿Cuántas personas asistirán?</span>
          <div class="contador" role="group" aria-labelledby="personas-etiqueta">
            <button type="button" class="contador__btn" data-paso="-1" aria-label="Una persona menos">${D.icono('menos')}</button>
            <output class="contador__valor" name="personas" aria-live="polite">${Math.min(p.personas || max, max)}</output>
            <button type="button" class="contador__btn" data-paso="1" aria-label="Una persona más">${D.icono('mas')}</button>
          </div>
          <span class="personas__max">${max === 1 ? 'Invitación individual' : `máximo ${max}`}</span>
        </div>
        <label class="campo">
          <span>Mensaje para los novios <em>(opcional)</em></span>
          <textarea name="mensaje" rows="3" maxlength="500" placeholder="Unas palabras para Jorge y Maricela…">${esc(p.mensaje || '')}</textarea>
        </label>
        <label class="trampa" aria-hidden="true">Sitio web<input name="sitio" tabindex="-1" autocomplete="off"></label>
        <p class="rsvp__error" role="alert"></p>
        <button class="boton boton--oro boton--ancho" type="submit">Enviar confirmación</button>
        ${!api.activa && whatsappNumero ? '<p class="rsvp__nota">Se abrirá WhatsApp con tu mensaje listo para enviar.</p>' : ''}
      </form>`;

    const form = $('form', caja());
    const bloque = $('.personas', form);
    const valor = $('.contador__valor', form);
    const actualizarBotones = () => {
      const n = +valor.textContent;
      $('[data-paso="-1"]', form).disabled = n <= 1;
      $('[data-paso="1"]', form).disabled = n >= max;
    };
    actualizarBotones();

    form.addEventListener('change', (e) => {
      if (e.target.name === 'asiste') bloque.hidden = e.target.value !== 'si';
    });
    $$('[data-paso]', form).forEach((b) => b.addEventListener('click', () => {
      valor.textContent = Math.max(1, Math.min(max, +valor.textContent + +b.dataset.paso));
      actualizarBotones();
    }));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      enviar(form);
    });
  }

  async function enviar(form) {
    const err = $('.rsvp__error', form);
    const boton = $('button[type="submit"]', form);
    const fd = new FormData(form);
    const elegido = fd.get('asiste');
    const datos = {
      codigo: rsvp.invitado ? rsvp.invitado.codigo : '',
      nombre: rsvp.invitado ? rsvp.invitado.nombre : String(fd.get('nombre') || '').trim(),
      asiste: elegido === 'si',
      personas: elegido === 'si' ? +$('.contador__valor', form).textContent : 0,
      mensaje: String(fd.get('mensaje') || '').trim(),
      sitio: String(fd.get('sitio') || ''),
    };

    err.textContent = '';
    if (!rsvp.invitado && datos.nombre.length < 3) {
      err.textContent = 'Escribe tu nombre completo, por favor.';
      $('input[name="nombre"]', form).focus();
      return;
    }
    if (!elegido) {
      err.textContent = 'Elige si nos acompañarás.';
      return;
    }

    // Sin servidor configurado: se confirma por WhatsApp.
    if (!api.activa) {
      if (whatsappNumero) {
        window.open(enlaceWhatsapp(datos), '_blank', 'noopener');
        terminar(datos, { porWhatsapp: true });
      } else {
        err.textContent = 'La confirmación todavía no está activa. Inténtalo más tarde, por favor.';
      }
      return;
    }

    boton.disabled = true;
    boton.classList.add('cargando');
    boton.textContent = 'Enviando…';
    try {
      const r = await api.confirmar(datos);
      if (!r.ok) {
        const textos = {
          personas: `El número de personas no puede ser mayor a ${r.max || maxPersonas()}.`,
          nombre: 'Escribe tu nombre completo, por favor.',
          no_encontrado: 'No encontramos tu invitación. Revisa el enlace que te enviaron.',
          ocupado: 'Hay muchas confirmaciones en este momento. Intenta de nuevo en unos segundos.',
        };
        throw new Error(textos[r.error] || 'No se pudo guardar tu respuesta. Intenta de nuevo.');
      }
      terminar(Object.assign({}, datos, r.respuesta || {}), {});
    } catch (ex) {
      err.innerHTML = esc(ex.name === 'AbortError' || ex instanceof TypeError
        ? 'No hay conexión. Revisa tu internet e inténtalo de nuevo.'
        : ex.message) +
        (whatsappNumero ? ` <a href="${enlaceWhatsapp(datos)}" target="_blank" rel="noopener">También puedes confirmar por WhatsApp.</a>` : '');
      boton.disabled = false;
      boton.classList.remove('cargando');
      boton.textContent = 'Enviar confirmación';
    }
  }

  function terminar(datos, opciones) {
    rsvp.respuesta = { nombre: datos.nombre, asiste: datos.asiste, personas: datos.personas, mensaje: datos.mensaje };
    try { localStorage.setItem(CLAVE_LOCAL, JSON.stringify(rsvp.respuesta)); } catch (_) { /* modo privado */ }
    pintarHecho(opciones);
    $('#confirmar').scrollIntoView({ behavior: reducirMovimiento ? 'auto' : 'smooth', block: 'start' });
  }

  function pintarHecho(opciones) {
    const r = rsvp.respuesta;
    const primerNombre = r.nombre;
    caja().innerHTML = `
      <div class="rsvp__tarjeta rsvp__tarjeta--hecho">
        <div class="rsvp__sello">${D.icono(r.asiste ? 'anillos' : 'corazon')}</div>
        <p class="rsvp__grande">${r.asiste ? '¡Gracias por confirmar!' : 'Gracias por avisarnos'}</p>
        <p class="rsvp__quien">${esc(primerNombre)}</p>
        <p>${r.asiste
          ? `Confirmaste <b>${plural(r.personas, 'lugar', 'lugares')}</b>.<br>¡Te esperamos el ${esc(F.diaSemana)} ${F.dia} de ${esc(F.mes)}!`
          : 'Lamentamos que no puedas acompañarnos. ¡Te llevaremos en el corazón ese día!'}</p>
        ${opciones && opciones.porWhatsapp ? '<p class="rsvp__nota">Recuerda enviar el mensaje que se abrió en WhatsApp.</p>' : ''}
        <div class="botones">
          ${r.asiste && $('#cal-google') ? `<a class="boton boton--linea" href="#fecha">${D.icono('calendario')}Agendar la fecha</a>` : ''}
          ${whatsappNumero && !(opciones && opciones.porWhatsapp) ? `<a class="boton boton--linea" href="${enlaceWhatsapp(r)}" target="_blank" rel="noopener">${D.icono('whatsapp')}Avisar por WhatsApp</a>` : ''}
        </div>
        <button class="enlace" type="button" id="cambiar">Cambiar mi respuesta</button>
      </div>`;
    $('#cambiar').addEventListener('click', () => {
      rsvp.aviso = '';
      pintarFormulario(rsvp.respuesta);
    });
  }

  function mostrarInvitadoEnPortada() {
    const inv = rsvp.invitado;
    const el = $('#portada-invitado');
    if (!inv || !el) return;
    el.innerHTML = `<span>Invitación para</span><strong>${esc(inv.nombre)}</strong><em>${plural(inv.pases, 'lugar reservado', 'lugares reservados')}</em>`;
    el.hidden = false;
  }

  function pintarMensaje(titulo, texto, reintentar) {
    caja().innerHTML = `
      <div class="rsvp__tarjeta">
        <p class="rsvp__grande">${esc(titulo)}</p>
        <p>${esc(texto)}</p>
        ${reintentar ? '<button class="boton boton--linea" type="button" id="reintentar">Intentar de nuevo</button>' : ''}
      </div>`;
    const b = $('#reintentar');
    if (b) b.addEventListener('click', () => iniciarConfirmacion());
  }

  async function iniciarConfirmacion() {
    if (!caja()) return;
    let local = null;
    try { local = JSON.parse(localStorage.getItem(CLAVE_LOCAL) || 'null'); } catch (_) { /* nada */ }

    const solo = C.rsvp.soloConEnlace;
    if (solo && !api.activa) {
      pintarMensaje('Muy pronto', 'Aquí podrás confirmar tu asistencia en unos días.');
      return;
    }

    if (codigo && api.activa) {
      pintarCargando();
      try {
        const r = await api.invitado(codigo);
        if (r.ok && r.invitado) {
          rsvp.invitado = r.invitado;
          mostrarInvitadoEnPortada();
          const prev = r.invitado.respuesta;
          if (prev) {
            rsvp.respuesta = { nombre: r.invitado.nombre, asiste: prev.asiste, personas: prev.personas, mensaje: prev.mensaje };
            pintarHecho();
            return;
          }
        } else if (solo) {
          pintarMensaje('No encontramos tu invitación', 'Revisa que hayas abierto el mismo enlace que te enviamos.');
          return;
        } else {
          rsvp.aviso = 'No encontramos tu invitación personal, pero puedes confirmar con tu nombre.';
        }
      } catch (_) {
        if (solo) {
          pintarMensaje('No pudimos cargar tu invitación', 'Revisa tu conexión a internet.', true);
          return;
        }
        rsvp.aviso = 'No pudimos cargar tu invitación personal. Puedes confirmar con tu nombre.';
      }
    }
    // Con enlace personal manda lo que dice el servidor; sin él, lo guardado en este teléfono.
    if (local && !rsvp.invitado) {
      rsvp.respuesta = local;
      pintarHecho();
      return;
    }
    pintarFormulario();
  }

  // ---------------------------------------------------------------- Arranque
  render();
  iniciarCuenta();
  iniciarAgendar();
  iniciarExtras();
  iniciarConfirmacion();
  iniciarSobre().then((abrio) => {
    document.body.classList.add('listo');
    iniciarRevelado();
    if (abrio) $('#contenido').focus({ preventScroll: true });
  });
})();
