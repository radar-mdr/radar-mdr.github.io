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
  goatcounterCodigo: '',
};

export const dominioConfigurado = !SITIO.dominio.includes('example.com');

/** Días tras los que una verificación se considera caducada. */
export const DIAS_VERIFICACION_CADUCADA = 90;
