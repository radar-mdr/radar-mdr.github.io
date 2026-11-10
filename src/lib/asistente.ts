// Lógica del asistente «¿Qué me aplica?»: de un perfil (rol, producto, clase, IA…) a la lista
// de plazos que le tocan, con el motivo de cada uno. No añade ningún dato regulatorio propio:
// solo cruza las respuestas con los campos de plazos.json (norma, tipo, roles_afectados y
// clases_producto). Sin dependencias de Astro ni del navegador: se prueba con node --test.

export type Rol = 'fabricante' | 'representante' | 'importador' | 'organismo' | 'sanitario';
export type Producto = 'ps' | 'ivd' | 'hce';
export type Terna = 'si' | 'no' | 'nose';

export interface Perfil {
  rol: Rol;
  /** Qué fabrica o comercializa. No se pregunta a organismos notificados ni a centros sanitarios. */
  producto?: Producto;
  /** Valor de clases_producto ('IIa', 'IVD C'…) o 'nose'. */
  clase?: string;
  implantable?: 'no' | 'si' | 'medida';
  ia: Terna;
  /** ¿Sigue en el mercado con certificado o declaración de las Directivas antiguas? */
  legacy?: Terna;
  eeuu?: boolean;
}

/** Los campos de un plazo que usa el asistente. */
export interface PlazoPerfil {
  id: string;
  norma: string;
  tipo: string;
  estado: string;
  fecha: string;
  roles_afectados: string[];
  clases_producto: string[];
}

export interface Resultado {
  id: string;
  /** Por qué sale en la lista. */
  motivos: string[];
  /** De qué depende que aplique de verdad (respuestas «no lo sé» y excepciones). */
  condiciones: string[];
}

export const CLASES_PS = ['I', 'Is/Im/Ir', 'IIa', 'IIb', 'III'];
export const CLASES_IVD = ['IVD A', 'IVD A estéril', 'IVD B', 'IVD C', 'IVD D'];
/** Clases en las que tiene sentido preguntar si el producto es implantable. */
export const CLASES_IMPLANTABLES = ['IIa', 'IIb', 'III'];

const CLASE_IA = 'SaMD / IA';
const CLASE_HCE = 'Sistemas de HCE / apps de bienestar';

const NOMBRE_ROL: Record<Rol, string> = {
  fabricante: 'fabricante',
  representante: 'representante autorizado',
  importador: 'importador',
  organismo: 'organismo notificado',
  sanitario: 'centro o prestador sanitario',
};

/** Roles de plazos.json que cubre el perfil. */
export function rolesDe(p: Perfil): string[] {
  const conIA = p.ia !== 'no';
  switch (p.rol) {
    case 'fabricante':
      if (p.producto === 'hce') return ['fabricante de sistemas de HCE', ...(conIA ? ['proveedor de IA'] : [])];
      return ['fabricante', ...(conIA ? ['proveedor de IA'] : [])];
    case 'representante':
      return ['representante autorizado'];
    case 'importador':
      return ['importador'];
    case 'organismo':
      return ['organismo notificado'];
    case 'sanitario':
      return ['prestador sanitario', ...(conIA ? ['desplegador'] : [])];
  }
}

/**
 * Clases de plazos.json que cubre el perfil. `seguras` son las suyas; `condicionales` son
 * clases que solo le tocan si se cumple la condición indicada.
 */
export function clasesDe(p: Perfil): { seguras: string[]; condicionales: Record<string, string> } {
  const seguras: string[] = [];
  const condicionales: Record<string, string> = {};
  if (p.rol === 'sanitario') seguras.push(CLASE_HCE);
  if (p.rol === 'organismo' || p.rol === 'sanitario') return { seguras, condicionales };

  if (p.producto === 'hce') {
    seguras.push(CLASE_HCE);
  } else if (!p.clase || p.clase === 'nose') {
    const duda = 'Depende de la clase de tu producto: confírmala antes de dar la fecha por buena';
    const todas =
      p.producto === 'ivd'
        ? CLASES_IVD
        : [...CLASES_PS, 'IIa implantable', 'IIb implantable', 'III a medida implantable'];
    for (const c of todas) condicionales[c] = duda;
  } else if (p.clase === 'IIa' && p.implantable && p.implantable !== 'no') {
    seguras.push('IIa', 'IIa implantable');
  } else if (p.clase === 'IIb' && p.implantable && p.implantable !== 'no') {
    seguras.push('IIb implantable');
    condicionales['IIb'] =
      'Solo si tu implantable es de los exentos del plazo de 2027 (suturas, grapas, tornillos, placas y similares)';
  } else if (p.clase === 'III' && p.implantable === 'medida') {
    seguras.push('III a medida implantable');
  } else {
    seguras.push(p.clase);
  }
  return { seguras, condicionales };
}

/** Plazos que le tocan al perfil, por fecha. Lo que está en tramitación no es un plazo. */
export function plazosDePerfil(perfil: Perfil, plazos: PlazoPerfil[]): Resultado[] {
  const roles = rolesDe(perfil);
  const { seguras, condicionales } = clasesDe(perfil);
  const resultados: (Resultado & { fecha: string })[] = [];

  for (const plazo of plazos) {
    if (plazo.estado === 'en_tramitacion') continue;
    const rol = plazo.roles_afectados.find((r) => roles.includes(r));
    if (!rol) continue;

    const motivos: string[] = [];
    const condiciones: string[] = [];
    const esIA = plazo.norma === 'AI Act';

    // 1. Norma: el AI Act solo con IA y la QMSR solo si se vende en EE. UU.
    if (esIA && perfil.ia === 'no') continue;
    if (plazo.norma === 'QMSR' && !perfil.eeuu) continue;

    // 2. Clase. En el AI Act, «SaMD / IA» significa «lleva IA»; si el plazo lista además clases
    //    concretas (alto riesgo del anexo I), manda la clase del producto.
    const propias = plazo.clases_producto.filter((c) => c !== CLASE_IA && c !== 'todas');
    const exigeClase = esIA && propias.length > 0;
    const segura = plazo.clases_producto.find((c) => seguras.includes(c));
    const condicional = plazo.clases_producto.find((c) => c in condicionales);
    if (plazo.clases_producto.includes('todas')) {
      motivos.push(`Afecta a todas las clases y eres ${NOMBRE_ROL[perfil.rol]}`);
    } else if (segura) {
      motivos.push(segura === CLASE_HCE ? `Eres ${NOMBRE_ROL[perfil.rol]} y afecta a los sistemas de historia clínica electrónica` : `Eres ${NOMBRE_ROL[perfil.rol]} y tu producto es de clase ${segura.replace(/^IVD (.+)$/, '$1 (IVD)')}`);
    } else if (condicional) {
      motivos.push(`Eres ${NOMBRE_ROL[perfil.rol]}`);
      condiciones.push(condicionales[condicional]);
    } else if (esIA && !exigeClase && plazo.clases_producto.includes(CLASE_IA)) {
      motivos.push(`Afecta a los sistemas de IA y eres ${rol === 'desplegador' ? 'quien los usa (desplegador)' : NOMBRE_ROL[perfil.rol]}`);
    } else {
      continue;
    }

    // 3. Condiciones que dependen de las respuestas.
    if (esIA) {
      if (perfil.ia === 'si') motivos.push('Tu producto lleva IA');
      else condiciones.push('Solo si tu producto incorpora un sistema de IA');
    }
    if (plazo.norma === 'QMSR') motivos.push('Vendes en EE. UU.');
    if (plazo.tipo === 'fin_transitorio') {
      if (perfil.legacy === 'no') continue;
      if (perfil.legacy === 'si') motivos.push('Sigue en el mercado al amparo de las Directivas (legacy)');
      else condiciones.push('Solo si tu producto sigue en el mercado con certificado o declaración de las Directivas (legacy)');
    }

    resultados.push({ id: plazo.id, fecha: plazo.fecha, motivos, condiciones });
  }

  return resultados
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map(({ id, motivos, condiciones }) => ({ id, motivos, condiciones }));
}

/** Frase que resume el perfil, para el encabezado del resultado y del PDF. */
export function resumenPerfil(p: Perfil): string {
  const partes: string[] = [NOMBRE_ROL[p.rol]];
  if (p.rol !== 'organismo' && p.rol !== 'sanitario') {
    if (p.producto === 'hce') partes.push('software de historia clínica o bienestar');
    else {
      const tipo = p.producto === 'ivd' ? 'producto sanitario para diagnóstico in vitro' : 'producto sanitario';
      const clase = !p.clase || p.clase === 'nose' ? 'clase por confirmar' : `clase ${p.clase.replace(/^IVD /, '')}`;
      const implante = p.implantable === 'si' ? ', implantable' : p.implantable === 'medida' ? ', implantable a medida' : '';
      partes.push(`${tipo} (${clase}${implante})`);
    }
    if (p.legacy === 'si') partes.push('legacy');
    if (p.eeuu) partes.push('vende en EE. UU.');
  }
  partes.push(p.ia === 'si' ? 'con IA' : p.ia === 'no' ? 'sin IA' : 'IA por confirmar');
  return partes.join(' · ');
}
