/**
 * Ajustes del sitio en un solo sitio. Los campos vacíos desactivan la función
 * correspondiente en vez de pintar enlaces rotos: rellénalos cuando existan.
 */
export const SITIO = {
  nombre: 'Radar MDR × AI Act',
  // Dominio público sin barra final. De aquí salen og:url, sitemap, robots.txt,
  // RSS y calendario. Cámbialo a 'https://radar-mdr.es' solo cuando el dominio
  // esté comprado y resuelva (hoy no existe en DNS).
  dominio: 'https://radar-mdr.github.io',

  autor: 'Alfonso Obreja',
  // Pasa a contacto@<tu-dominio> en cuanto tengas dominio con correo.
  email: 'radar.mdr.aiact@gmail.com',
  linkedin: 'https://www.linkedin.com/in/alfonso-obreja-eastman-663ab034a/',
  // URL pública del repositorio (vacío = no se enlaza).
  repositorio: 'https://github.com/radar-mdr/radar-mdr.github.io',

  // Usuario de Buttondown (vacío = formulario de alta por correo).
  buttondownUsuario: '',
  // Código de GoatCounter, p. ej. "radar-mdr" para radar-mdr.goatcounter.com
  // (vacío = sin analítica). GoatCounter no usa cookies.
  goatcounterCodigo: 'alo04',
  // ID del formulario de Tally de la lista de espera de Radar Pro: lo que va tras
  // tally.so/r/ en el enlace para compartir, p. ej. "mRoDv3" (vacío = alta por correo).
  // El formulario no se carga al abrir /pro: solo cuando la persona pulsa el botón.
  tallyFormId: 'KpzMZM',
  // DOI de Zenodo («Cite all versions», el que no cambia entre versiones), p. ej.
  // '10.5281/zenodo.1234567' (vacío = la cita sale sin DOI).
  doi: '10.5281/zenodo.23860211',
};

export const dominioConfigurado = !SITIO.dominio.includes('example.com');

/** Días tras los que una verificación se considera caducada. */
export const DIAS_VERIFICACION_CADUCADA = 90;
