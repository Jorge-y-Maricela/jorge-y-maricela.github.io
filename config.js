/*
 * ==========================================================================
 *  DATOS DE LA INVITACIÓN  ·  Boda de Jorge & Maricela
 * ==========================================================================
 *  Todo lo que se ve en la invitación sale de este archivo.
 *  Para cambiar un texto, una hora o un dato, edítalo aquí y guarda.
 *
 *  Las líneas marcadas con  ⚠ POR CONFIRMAR  son valores de ejemplo que
 *  hay que revisar con los novios antes de enviar la invitación.
 * ==========================================================================
 */
window.INVITACION = {
  novios: {
    // Nombre corto (portada) y nombre completo (texto formal)
    el:   { nombre: 'Jorge',    completo: 'Jorge de Jesús Alfaro Pérez' },
    ella: { nombre: 'Maricela', completo: 'Maricela Muñoz Gálvez' },
    iniciales: ['J', 'M'],
  },

  // Fecha y hora de inicio, con zona horaria de Chiapas (UTC-6, sin horario de verano)
  fecha: '2026-12-11T17:00:00-06:00',
  // No se muestra en la invitación: solo marca el fin del evento en el calendario
  // de los invitados (la fiesta es hasta la madrugada).
  finEvento: '2026-12-12T03:00:00-06:00',
  zonaHoraria: 'America/Mexico_City',
  ciudad: 'Chiapa de Corzo, Chiapas',

  frase:
    'Dos caminos que se encontraron para convertirse en uno solo. ' +
    'Queremos compartir contigo el día en que prometemos caminar juntos para siempre.',

  padres: {
    novia: ['Pablo Germán Muñoz Escobar', 'Rosa María Gálvez Gramajo'],
    novio: ['Jorge Alfaro Morales', 'Martha Pérez Vega'],
  },

  // Opcional. Ejemplo:
  // { titulo: 'Padrinos de velación', nombres: ['Nombre Apellido', 'Nombre Apellido'] },
  padrinos: [],

  // Cada evento es una tarjeta con mapa. Si hay misa en otro lugar, agrega otro objeto.
  eventos: [
    {
      titulo: 'Celebración',
      icono: 'copas',               // anillos | iglesia | copas
      hora: '5:00 pm',
      lugar: 'Salón La Terraza',
      direccion: ['Calle San Miguel, Fracc. Villarreal', 'Chiapa de Corzo, Chiapas'],
      mapa: 'https://maps.app.goo.gl/bp7ci8Yhs1ScKUcF9',
      coordenadas: [16.7093504, -93.0349929],
    },
  ],

  // Opcional: si se deja vacío, la sección no aparece.  ⚠ POR CONFIRMAR
  // Ejemplo: { hora: '5:00 pm', titulo: 'Ceremonia', icono: 'anillos' },
  //          { hora: '7:00 pm', titulo: 'Primer baile', icono: 'musica' },
  //          { hora: '8:00 pm', titulo: 'Cena', icono: 'cena' },
  //          { hora: '9:00 pm', titulo: '¡Fiesta!', icono: 'copas' },
  itinerario: [],

  vestimenta: {
    tipo: 'Formal',
    nota: '',
  },

  // Sin sección de regalos. Para activarla, cambia null por algo como:
  // { texto: 'Tu presencia es nuestro mejor regalo…', lluviaDeSobres: true, mesas: [], transferencia: null }
  regalos: null,

  // Fotos opcionales (ruta dentro de /img). Si se deja vacío, la galería no aparece.
  // Ejemplo: [{ src: 'img/fotos/1.webp', alt: 'Jorge y Maricela en ...' }]
  fotos: [],

  // Canción opcional que suena al abrir el sobre. Ejemplo: 'musica/cancion.mp3'
  musica: '',

  rsvp: {
    // URL de la aplicación web de Google Apps Script (ver LEEME.md, paso 2).
    endpoint: '',
    fechaLimite: '2026-11-27',                               // ⚠ POR CONFIRMAR
    // true: solo quien abre su enlace personal (?i=CÓDIGO) ve la confirmación.
    // El enlace general es solo la invitación, sin confirmar asistencia.
    soloConEnlace: true,
    // Lugares máximos sin enlace personal (solo si soloConEnlace es false)
    pasesSinCodigo: 2,
    // Número de WhatsApp de los novios, 10 dígitos, sin espacios. Ej. '9611234567'
    whatsapp: '',
  },

  sitio: {
    // Dirección donde se publique la invitación (ver LEEME.md)
    url: 'https://jorgerealg-star.github.io/boda-jorge-maricela/',
  },
};
