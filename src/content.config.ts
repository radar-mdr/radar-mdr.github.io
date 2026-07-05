import { defineCollection, z } from 'astro:content';
import { file } from 'astro/loaders';

/**
 * Esquema de datos del Radar (6 entidades).
 * El foso competitivo son los campos `estado + fecha_verificacion + nota_cambio`:
 * convierten un blog en una base de datos confiable.
 */

const normaEnum = z.enum(['MDR', 'IVDR', 'MDR/IVDR', 'AI Act', 'QMSR']);
const fechaISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha en formato AAAA-MM-DD');

const plazos = defineCollection({
  loader: file('src/data/plazos.json'),
  schema: z.object({
    id: z.string(),
    norma: normaEnum,
    referencia_legal: z.string(),
    fecha: fechaISO,
    tipo: z.enum(['aplicacion', 'fin_transitorio', 'registro', 'informe_periodico']),
    roles_afectados: z.array(z.string()).min(1),
    clases_producto: z.array(z.string()).min(1),
    descripcion_corta: z.string(),
    estado: z.enum(['vigente', 'aplazado', 'pendiente_confirmacion']),
    fuente_url: z.string().url(),
    fecha_verificacion: fechaISO,
    nota_cambio: z.string().optional(),
  }),
});

const obligaciones = defineCollection({
  loader: file('src/data/obligaciones.json'),
  schema: z.object({
    id: z.string(),
    norma: normaEnum,
    articulo: z.string(),
    rol: z.string(),
    clases_producto: z.array(z.string()).min(1),
    obligacion: z.string(),
    evidencia_requerida: z.string(),
    sancion_asociada: z.string().optional(),
    guia_relacionada: z.string().optional(), // FK → guias.id
    fuente_url: z.string().url(),
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
    enlace_oficial: z.string().url(),
    estado_ficha: z.enum(['publicada', 'proximamente']),
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
    codigos_designacion: z.array(z.string()),
    web: z.string().url(),
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
    web: z.string().url(),
    // Regla de neutralidad: cada celda necesita >=2 fuentes independientes
    fuentes: z.array(z.string().url()).min(2).optional(),
    fecha_verificacion: fechaISO.optional(),
  }),
});

const fuentes = defineCollection({
  loader: file('src/data/fuentes.json'),
  schema: z.object({
    id: z.string(),
    nombre: z.string(),
    tipo: z.enum(['legal', 'guia', 'agencia', 'industria', 'norma_tecnica']),
    url: z.string().url(),
    idioma: z.string(),
    frecuencia_actualizacion: z.string(),
    tiene_rss: z.boolean(),
    notas: z.string().optional(),
  }),
});

export const collections = { plazos, obligaciones, guias, organismos, herramientas, fuentes };
