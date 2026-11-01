import { defineCollection, z } from 'astro:content';
import { file } from 'astro/loaders';

/**
 * Esquema de datos del Radar.
 * El foso competitivo son los campos `estado + fecha_verificacion + historial`:
 * convierten un blog en una base de datos confiable. Un dato corregido nunca
 * se sobrescribe sin dejar rastro (ALCOA+): el valor anterior queda en `historial`.
 */

const normaEnum = z.enum(['MDR', 'IVDR', 'MDR/IVDR', 'AI Act', 'QMSR', 'EHDS']);
const fechaISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha en formato AAAA-MM-DD');
const url = z.string().url();

const entradaHistorial = z.object({
  fecha: fechaISO,
  campo: z.string(),
  valor_anterior: z.string(),
  valor_nuevo: z.string(),
  motivo: z.string(),
  // Obligatoria: un cambio sin fuente no cumple ALCOA+
  fuente_url: url,
});

const plazos = defineCollection({
  loader: file('src/data/plazos.json'),
  schema: z.object({
    id: z.string(),
    norma: normaEnum,
    referencia_legal: z.string(),
    fecha: fechaISO,
    // Título corto para calendario, RSS y encabezados (sin la norma: se añade aparte)
    titulo: z.string().max(70),
    tipo: z.enum(['aplicacion', 'fin_transitorio', 'registro', 'informe_periodico']),
    roles_afectados: z.array(z.string()).min(1),
    clases_producto: z.array(z.string()).min(1),
    descripcion_corta: z.string(),
    estado: z.enum(['vigente', 'aplazado', 'pendiente_confirmacion', 'en_tramitacion']),
    fuente_url: url,
    fuentes_adicionales: z.array(url).default([]),
    fecha_verificacion: fechaISO,
    nota_cambio: z.string().optional(),
    historial: z.array(entradaHistorial).default([]),
  }),
});

const obligaciones = defineCollection({
  loader: file('src/data/obligaciones.json'),
  schema: z.object({
    id: z.string(),
    norma: normaEnum,
    // 'clase': fila de la matriz por clase · 'actor': ficha por agente económico
    ambito: z.enum(['clase', 'actor']),
    tema: z.string(),
    articulo: z.string(),
    rol: z.string(),
    clases_producto: z.array(z.string()).min(1),
    obligacion: z.string(),
    // Detalle por clase para la matriz; la clave es la columna (p. ej. "IIa")
    por_clase: z.record(z.string()).optional(),
    evidencia_requerida: z.string(),
    sancion_asociada: z.string().optional(),
    guia_relacionada: z.string().optional(), // FK → guias.id
    fuente_url: url,
    fecha_verificacion: fechaISO,
  }),
});

const guias = defineCollection({
  loader: file('src/data/guias.json'),
  schema: z.object({
    id: z.string(),
    codigo: z.string(), // p. ej. "MDCG 2025-6"
    titulo: z.string(),
    emisor: z.string(),
    fecha: z.string(),
    temas: z.array(z.string()),
    resumen_es: z.string().nullable(), // ~300 palabras cuando la ficha esté publicada
    relevancia_ia: z.number().int().min(1).max(5),
    enlace_oficial: url,
    estado_ficha: z.enum(['publicada', 'proximamente']),
    fecha_verificacion: fechaISO.optional(),
  }),
});

const organismos = defineCollection({
  loader: file('src/data/organismos.json'),
  schema: z.object({
    id: z.string(),
    numero_nando: z.string(),
    nombre: z.string(),
    pais: z.string(),
    ambito: z.array(z.enum(['MDR', 'IVDR', 'AI Act'])).min(1),
    codigos_designacion: z.array(z.string()).default([]),
    web: url.optional(),
    fuente_url: url,
    fecha_verificacion: fechaISO,
    notas: z.string().optional(),
  }),
});

const herramientas = defineCollection({
  loader: file('src/data/herramientas.json'),
  schema: z.object({
    id: z.string(),
    nombre: z.string(),
    empresa: z.string(),
    precio_desde: z.string(), // texto: permite "estimación" etiquetada
    publico: z.array(z.enum(['startup', 'pyme', 'enterprise'])).min(1),
    modulos: z.array(z.string()),
    especifica_ia: z.boolean(),
    web: url,
    // Regla de neutralidad: con <2 fuentes o sin fecha, la tabla muestra ⚠
    fuentes: z.array(url).default([]),
    estimacion: z.boolean().default(false),
    fecha_verificacion: fechaISO.nullable().optional(),
    // Puntuación contra requisitos-eqms.json: 0 no cubre · 1 parcial · 2 cubre
    puntuacion: z.record(z.number().int().min(0).max(2)).default({}),
    notas: z.string().optional(),
  }),
});

const requisitosEqms = defineCollection({
  loader: file('src/data/requisitos-eqms.json'),
  schema: z.object({
    id: z.string(),
    area: z.string(),
    requisito: z.string(),
    referencia: z.string(),
    que_pedir: z.string(),
  }),
});

const fuentes = defineCollection({
  loader: file('src/data/fuentes.json'),
  schema: z.object({
    id: z.string(),
    nombre: z.string(),
    tipo: z.enum(['legal', 'guia', 'agencia', 'industria', 'norma_tecnica']),
    url: url,
    idioma: z.string(),
    frecuencia_actualizacion: z.string(),
    tiene_rss: z.boolean(),
    nota_publica: z.string().optional(),
    // Recordatorio de trabajo: no se muestra en la web ni sale en la API
    nota_interna: z.string().optional(),
  }),
});

const glosario = defineCollection({
  loader: file('src/data/glosario.json'),
  schema: z.object({
    id: z.string(),
    termino_es: z.string(),
    termino_en: z.string(),
    sigla: z.string().optional(),
    definicion: z.string(),
    referencia: z.string().optional(),
    categoria: z.enum(['MDR/IVDR', 'Calidad', 'Riesgos', 'Clínica', 'IA', 'EE. UU.', 'España']),
  }),
});

const propuestas = defineCollection({
  loader: file('src/data/propuestas.json'),
  schema: z.object({
    id: z.string(),
    titulo: z.string(),
    referencia: z.string(),
    norma: normaEnum,
    fecha_propuesta: fechaISO,
    estado_tramite: z.string(),
    hitos: z.array(
      z.object({ fecha: z.string(), hito: z.string(), hecho: z.boolean() })
    ),
    cambios: z.array(
      z.object({
        tema: z.string(),
        vigente: z.string(),
        propuesta_comision: z.string(),
        nota: z.string().optional(),
      })
    ),
    fuente_url: url,
    fuentes_adicionales: z.array(url).default([]),
    fecha_verificacion: fechaISO,
  }),
});

const erratas = defineCollection({
  loader: file('src/data/erratas.json'),
  schema: z.object({
    id: z.string(),
    fecha_deteccion: fechaISO,
    fecha_correccion: fechaISO.nullable(),
    paginas: z.array(z.string()).min(1),
    dato_erroneo: z.string(),
    correccion: z.string(),
    causa_raiz: z.string(),
    accion_correctiva: z.string(),
    fuente_url: url,
    estado: z.enum(['abierta', 'cerrada']),
  }),
});

export const collections = {
  plazos,
  obligaciones,
  guias,
  organismos,
  herramientas,
  requisitos_eqms: requisitosEqms,
  fuentes,
  glosario,
  propuestas,
  erratas,
};
