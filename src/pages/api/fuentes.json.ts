// GET /api/fuentes.json
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const fuentes = (await getCollection('fuentes')).map((f) => f.data);

  return new Response(
    JSON.stringify(
      {
        actualizado: new Date().toISOString().slice(0, 10),
        licencia: 'CC BY 4.0 — cita con enlace',
        total: fuentes.length,
        fuentes,
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
