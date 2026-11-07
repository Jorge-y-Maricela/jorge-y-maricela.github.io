# Invitación de boda · Jorge & Maricela

Invitación web en blanco y dorado.

- **Enlace general** (familia): solo la invitación, sin confirmar asistencia.
- **Enlaces personales** (los 7 invitados de `invitados.tsv`): la misma invitación, con su nombre, sus pases y la confirmación de asistencia, que se guarda en una Hoja de cálculo de Google.

- Viernes 11 de diciembre de 2026, 5:00 pm
- Salón La Terraza, Calle San Miguel, Fracc. Villarreal, Chiapa de Corzo, Chiapas

## Qué incluye

| Sección | Detalle |
|---|---|
| Sobre de bienvenida | Sobre blanco con forro dorado y sello de cera «J & M». Se abre al tocarlo. |
| Portada | Nombres, monograma con corona de hojas, fecha, hora y ciudad. Con enlace personal muestra «Invitación para *Nombre* · N lugares reservados». |
| Frase y padres | Padres de la novia y del novio, y nombres completos de los novios. |
| Fecha | Cuenta regresiva, calendario de diciembre con el día marcado y botones para agendar (Google Calendar y archivo .ics para iPhone y Outlook). |
| Lugar | Mapa, botones de Google Maps y de Waze. |
| Vestimenta | Formal. |
| Confirmación | Solo en los enlaces personales: sí o no, número de personas (sin pasar de sus pases) y mensaje para los novios. Se puede cambiar la respuesta. |
| Después de la boda | La página cambia sola a «Gracias por acompañarnos» y quita la confirmación. |

Opcionales, que se activan en `config.js`: itinerario, padrinos, regalos, galería de fotos y música.

## 1. Revisar los datos

Todo el contenido está en **`config.js`**. Revisen las líneas marcadas con `⚠ POR CONFIRMAR`:

- `rsvp.fechaLimite`: vacía; se puede confirmar hasta el día de la boda.
- `itinerario`, `padrinos`, `fotos` y `musica`: vacíos. Si se quedan vacíos, esas secciones no aparecen.
- `rsvp.whatsapp`: WhatsApp de la novia, como respaldo para avisar por WhatsApp.

`finEvento` (3:00 am) no se muestra: solo marca el fin en el calendario de los invitados.

## 2. Activar las confirmaciones (Google Sheets, gratis)

1. Creen una Hoja de cálculo nueva en Google Drive, por ejemplo «Boda – Invitados».
2. En el menú, vayan a **Extensiones → Apps Script**. Borren lo que haya, peguen todo el contenido de `apps-script/Code.gs` y guarden.
3. En `Code.gs`, cambien `URL_INVITACION` por la dirección real de la invitación (paso 3).
4. Recarguen la hoja. Aparece el menú **💍 Boda**. Elijan **1. Preparar hojas** y acepten los permisos que pide Google.
5. Abran `invitados.tsv`, copien todo **menos la primera línea** y péguenlo en la celda **A2** de la pestaña **Invitados**. Son los 7 invitados con pase, cada uno con su código ya asignado. Si tienen sus teléfonos, escríbanlos en la columna D (10 dígitos).
   Para agregar a alguien más, escriban su nombre y pases en una fila nueva y dejen el código vacío.
6. Elijan **💍 Boda → 2. Generar códigos y enlaces**. Cada invitado recibe un código, su enlace personal y un enlace «Enviar por WhatsApp» con el mensaje ya escrito. Se puede volver a usar cuando agreguen invitados, sin cambiar los códigos que ya existen.
7. En Apps Script elijan **Implementar → Nueva implementación → Aplicación web**, con estos valores:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**

   Copien la URL que termina en `/exec` y péguenla en `config.js` → `rsvp.endpoint`.

Las respuestas llegan solas a la hoja:

- **Invitados**: cada invitación queda marcada como «Sí asiste» o «No asiste», con número de personas y mensaje.
- **Respuestas**: historial de todo lo que se ha enviado.
- **Resumen**: total de personas confirmadas, pendientes y quienes no asistirán.

Si después cambian `Code.gs`, hay que ir a **Implementar → Administrar implementaciones → Editar → Nueva versión**.

## 3. Publicar la invitación

La invitación son archivos estáticos (`index.html`, `config.js`, `css/`, `js/`, `img/`). Se puede publicar gratis en:

- **Netlify Drop** (https://app.netlify.com/drop): arrastren la carpeta y listo.
- **Cloudflare Pages** o **GitHub Pages**.

No suban la carpeta `dev/`; solo sirve para pruebas.

Con la dirección final, sustituyan `https://TU-DOMINIO.com/` en:

- `index.html`: las etiquetas `og:url` y `og:image`. Sin esto, WhatsApp no muestra la imagen de vista previa.
- `config.js`: `sitio.url`.
- `apps-script/Code.gs`: `URL_INVITACION`.

## 4. Enviar las invitaciones

En la pestaña **Invitados**, toquen el enlace de la columna **Enviar por WhatsApp** de cada invitado. Se abre WhatsApp con el mensaje y su enlace personal; solo hay que enviarlo.

A la familia mándenle el **enlace general** (la dirección sin `?i=`): ve toda la invitación, pero sin la sección de confirmar.

Para que cualquiera con el enlace general también pueda confirmar escribiendo su nombre, cambien `soloConEnlace` a `false` en `config.js` y `PERMITIR_SIN_CODIGO` a `true` en `Code.gs`.

## Probar en la computadora (macOS)

```bash
python3 dev/servidor.py
```

Esto abre la invitación en http://localhost:8642 con una hoja simulada, que ejecuta el `Code.gs` real, cargada con los invitados de `invitados.tsv`. Sus enlaces aparecen en la terminal.

Para ver cómo se ve la página en otra fecha, agreguen `?ahora=2026-12-12T10:00:00-06:00`.

Otras herramientas de prueba:

- `python3 dev/prueba_backend.py`: pruebas automáticas de la lógica de confirmaciones.
- `dev/generar_imagenes.sh`: vuelve a crear la imagen para compartir y los íconos. Necesita el servidor encendido.
