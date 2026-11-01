// GET /api/organismos.json
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const organismos = (await getCollection('organismos')).map((o) => o.data);

  return new Response(
    JSON.stringify(
      {
        actualizado: organismos.map((o) => o.fecha_verificacion).sort().at(-1),
        licencia: 'CC BY 4.0 — cita con enlace; fuente primaria: NANDO (Comisión Europea)',
        total: organismos.length,
        organismos,
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
