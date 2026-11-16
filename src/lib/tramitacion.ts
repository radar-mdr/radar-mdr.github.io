// Lógica del rastreador «En tramitación»: en qué etapa está cada propuesta y cuál es su
// próximo hito. Sin dependencias de Astro: se prueba con node --test.

export type EstadoEtapa = 'hecho' | 'en_curso' | 'pendiente';
export type Etapas = Record<ClaveEtapa, EstadoEtapa>;

/** Procedimiento legislativo ordinario. Parlamento y Consejo fijan su posición en paralelo. */
export const ETAPAS = [
  { clave: 'propuesta', nombre: 'Propuesta de la Comisión' },
  { clave: 'parlamento', nombre: 'Posición del Parlamento' },
  { clave: 'consejo', nombre: 'Posición del Consejo' },
  { clave: 'acuerdo', nombre: 'Acuerdo en trílogos' },
  { clave: 'adopcion', nombre: 'Adopción formal' },
  { clave: 'publicacion', nombre: 'Publicación en el DOUE' },
] as const;
export type ClaveEtapa = (typeof ETAPAS)[number]['clave'];

export interface Hito {
  fecha: string;
  fecha_iso?: string;
  hito: string;
  hecho: boolean;
}

/** Las etapas en curso, o la primera pendiente si no hay ninguna en curso. */
export function faseActual(etapas: Etapas): string {
  const enCurso = ETAPAS.filter((e) => etapas[e.clave] === 'en_curso').map((e) => e.nombre);
  if (enCurso.length > 0) return enCurso.join(' · ');
  const siguiente = ETAPAS.find((e) => etapas[e.clave] !== 'hecho');
  return siguiente ? `Pendiente: ${siguiente.nombre.toLowerCase()}` : 'Publicada en el DOUE';
}

/** Etapas terminadas, de 0 a 6. */
export function etapasHechas(etapas: Etapas): number {
  return ETAPAS.filter((e) => etapas[e.clave] === 'hecho').length;
}

/**
 * El próximo paso: el primer hito sin hacer en el orden del procedimiento (el de los datos),
 * tenga fecha o no. Una votación en comisión sin fecha va antes que un pleno con fecha.
 */
export function proximoHito<H extends Hito>(hitos: H[]): H | undefined {
  return hitos.find((h) => !h.hecho);
}

/** La próxima fecha oficial (aunque sea indicativa) de un hito sin hacer, a partir de hoy. */
export function proximaFecha<H extends Hito>(hitos: H[], hoy: string): H | undefined {
  return hitos
    .filter((h) => !h.hecho && h.fecha_iso && h.fecha_iso >= hoy)
    .sort((a, b) => a.fecha_iso!.localeCompare(b.fecha_iso!))[0];
}

/** Hitos que se daban por previstos y cuya fecha ya ha pasado: hay que comprobar qué pasó. */
export function hitosVencidos<H extends Hito>(hitos: H[], hoy: string): H[] {
  return hitos.filter((h) => !h.hecho && h.fecha_iso && h.fecha_iso < hoy);
}

/**
 * Incoherencias entre etapas. El Parlamento y el Consejo pueden ir a la vez; el resto va en
 * orden: nada puede estar hecho o en curso si una etapa anterior sigue pendiente.
 */
export function incoherencias(etapas: Etapas): string[] {
  const problemas: string[] = [];
  const orden: ClaveEtapa[][] = [['propuesta'], ['parlamento', 'consejo'], ['acuerdo'], ['adopcion'], ['publicacion']];
  for (let i = 1; i < orden.length; i++) {
    const empezada = orden[i].some((c) => etapas[c] !== 'pendiente');
    const anteriorAbierta = orden[i - 1].filter((c) => etapas[c] !== 'hecho');
    if (empezada && anteriorAbierta.length > 0) {
      problemas.push(`«${orden[i].join(' y ')}» ha empezado, pero «${anteriorAbierta.join(' y ')}» no está hecho`);
    }
  }
  return problemas;
}
