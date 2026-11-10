import {
  getCollection as getCollectionAstro,
  type CollectionEntry,
  type CollectionKey,
} from 'astro:content';

/**
 * getCollection con el orden de los JSON de src/data.
 * Astro 7 guarda las entradas ordenadas por id (para que el build sea reproducible), pero
 * el orden de los ficheros es editorial (fuentes por importancia, obligaciones por artículo,
 * requisitos por área) y las páginas cuentan con él. Úsalo en lugar del de astro:content.
 */

// Colección → posición de cada id en su fichero (requisitos-eqms.json → requisitos_eqms).
const posiciones = new Map(
  Object.entries(
    import.meta.glob<{ id: string }[]>('../data/*.json', { eager: true, import: 'default' })
  ).map(([ruta, datos]) => [
    ruta.replace(/^.*\/|\.json$/g, '').replace(/-/g, '_'),
    new Map(datos.map((d, i) => [d.id, i])),
  ])
);

export async function getCollection<C extends CollectionKey>(
  coleccion: C
): Promise<CollectionEntry<C>[]> {
  const entradas = await getCollectionAstro(coleccion);
  const posicion = posiciones.get(coleccion);
  if (!posicion) return entradas;
  return entradas.sort((a, b) => (posicion.get(a.id) ?? 0) - (posicion.get(b.id) ?? 0));
}
