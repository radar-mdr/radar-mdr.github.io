// Endpoint estático: /calendario.ics
// Suscripción de calendario con todos los plazos del Radar.
// Los responsables regulatorios viven en Outlook/Google Calendar:
// "suscríbete al calendario de plazos" convierte mejor que cualquier PDF.
import type { APIRoute } from 'astro';
import { getCollection } from '../lib/coleccion';
import { calendarioICS } from '../lib/ics';
import { SITIO } from '../config';

export const GET: APIRoute = async () => {
  const plazos = (await getCollection('plazos')).map((p) => p.data);
  const cal = calendarioICS(plazos, {
    dominio: SITIO.dominio,
    nombre: 'Radar MDR × AI Act: plazos regulatorios',
    refresco: true,
  });

  return new Response(cal, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="radar-plazos.ics"',
    },
  });
};
