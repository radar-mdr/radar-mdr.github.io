// GET /api/plazos.json
// API pública de solo lectura. Cuesta cero mantenerla (es estática) y
// posiciona el Radar como infraestructura, no como blog. La versión Pro de
// 2027 (alertas + API autenticada) nace de aquí.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const plazos = (await getCollection('plazos'))
    .map((p) => p.data)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  return new Response(
    JSON.stringify(
      {
        actualizado: new Date().toISOString().slice(0, 10),
        licencia: 'CC BY 4.0 — cita con enlace al Radar; fuentes oficiales enlazadas en cada registro',
        total: plazos.length,
        plazos,
      },
      null,
      2
    ),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
};
