/**
 * Ajustes del sitio en un solo sitio. Los campos vacíos desactivan la función
 * correspondiente en vez de pintar enlaces rotos: rellénalos cuando existan.
 */
export const SITIO = {
  nombre: 'Radar MDR × AI Act',
  // Dominio público sin barra final. Mientras sea example.com no se muestran
  // los enlaces de suscripción webcal:// ni el og:url absoluto correcto.
  dominio: 'https://example.com',

  autor: 'Alfonso Obreja',
  // Pasa a contacto@<tu-dominio> en cuanto tengas dominio con correo.
  email: 'radar.mdr.aiact@gmail.com',
  linkedin: 'https://www.linkedin.com/in/alfonsoobreja-eastman',
  // URL pública del repositorio (vacío = no se enlaza).
  repositorio: '',

  // Usuario de Buttondown (vacío = formulario de alta por correo).
  buttondownUsuario: '',
  // Código de GoatCounter, p. ej. "radar-mdr" para radar-mdr.goatcounter.com
  // (vacío = sin analítica). GoatCounter no usa cookies.
  goatcounterCodigo: '',
};

export const dominioConfigurado = !SITIO.dominio.includes('example.com');

/** Días tras los que una verificación se considera caducada. */
export const DIAS_VERIFICACION_CADUCADA = 90;
