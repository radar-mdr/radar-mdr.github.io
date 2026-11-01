import { getCollection } from 'astro:content';

export const etiquetaCampo: Record<string, string> = {
  alta: 'Alta',
  fecha: 'Fecha',
  estado: 'Estado',
  referencia_legal: 'Referencia legal',
  fuente_url: 'Fuente',
  nota_cambio: 'Nota',
  clases_producto: 'Clases afectadas',
  fecha_verificacion: 'Reverificación',
};

export interface EventoCambio {
  guid: string;
  fecha: string;
  plazoId: string;
  plazoFecha: string;
  norma: string;
  titulo: string;
  descripcion: string;
  campo: string;
  valor_anterior: string;
  valor_nuevo: string;
  motivo: string;
  fuente_url: string;
}

/** Todos los cambios del historial de los plazos, del más reciente al más antiguo. */
export async function eventosDeCambio(): Promise<EventoCambio[]> {
  const plazos = await getCollection('plazos');
  return plazos
    .flatMap(({ data: p }) =>
      p.historial.map((h, i) => ({
        guid: `${p.id}#${h.fecha}-${h.campo}-${i}`,
        fecha: h.fecha,
        plazoId: p.id,
        plazoFecha: p.fecha,
        norma: p.norma,
        titulo: p.titulo,
        descripcion: p.descripcion_corta,
        campo: h.campo,
        valor_anterior: h.valor_anterior,
        valor_nuevo: h.valor_nuevo,
        motivo: h.motivo,
        fuente_url: h.fuente_url ?? p.fuente_url,
      }))
    )
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || a.plazoFecha.localeCompare(b.plazoFecha));
}
