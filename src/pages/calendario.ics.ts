// Endpoint estático: /calendario.ics
// Suscripción de calendario con todos los plazos del Radar.
// Los responsables regulatorios viven en Outlook/Google Calendar:
// "suscríbete al calendario de plazos" convierte mejor que cualquier PDF.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITIO } from '../config';

function esc(t: unknown): string {
  return String(t ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

// RFC 5545 §3.1: las líneas de más de 75 octetos se parten y continúan con un espacio.
const codificador = new TextEncoder();
function plegar(linea: string): string {
  const trozos: string[] = [];
  let actual = '';
  let octetos = 0;
  for (const caracter of linea) {
    const n = codificador.encode(caracter).length;
    const limite = trozos.length === 0 ? 75 : 74; // la continuación ya gasta 1 octeto en el espacio
    if (octetos + n > limite) {
      trozos.push(actual);
      actual = '';
      octetos = 0;
    }
    actual += caracter;
    octetos += n;
  }
  trozos.push(actual);
  return trozos.join('\r\n ');
}

// '2026-05-28' -> '20260528'
function fechaICS(iso: string): string {
  return iso.replaceAll('-', '');
}

// Día siguiente, para DTEND de eventos de día completo (mejor compatibilidad)
function diaSiguiente(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10).replaceAll('-', '');
}

export const GET: APIRoute = async () => {
  const plazos = (await getCollection('plazos')).sort((a, b) => a.data.fecha.localeCompare(b.data.fecha));
  const ahora = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  // Lo que está en tramitación no es una fecha: no entra en el calendario.
  const eventos = plazos
    .filter(({ data: p }) => p.estado !== 'en_tramitacion')
    .flatMap(({ data: p }) => {
      const pendiente = p.estado === 'pendiente_confirmacion' ? ' (fecha por confirmar)' : '';
      const enlace = new URL(`/#${p.id}`, SITIO.dominio).href;
      return [
        'BEGIN:VEVENT',
        `UID:${p.id}@radar-mdr-aiact`,
        `DTSTAMP:${ahora}`,
        `URL:${enlace}`,
        `DTSTART;VALUE=DATE:${fechaICS(p.fecha)}`,
        `DTEND;VALUE=DATE:${diaSiguiente(p.fecha)}`,
        `SUMMARY:${esc(`[${p.norma}] ${p.titulo}${pendiente}`)}`,
        `DESCRIPTION:${esc(
          `${p.descripcion_corta}\n\n${p.referencia_legal}\nAfecta a: ${p.roles_afectados.join(', ')}\nFuente oficial: ${p.fuente_url}\nVerificado: ${p.fecha_verificacion}\nMás en el Radar: ${enlace}`
        )}`,
        `CATEGORIES:${esc(p.norma)}`,
        // Recordatorio 30 días antes (los clientes que lo soporten lo mostrarán)
        'BEGIN:VALARM',
        'TRIGGER:-P30D',
        'ACTION:DISPLAY',
        `DESCRIPTION:${esc(`Quedan 30 días: [${p.norma}] ${p.titulo}`)}`,
        'END:VALARM',
        'END:VEVENT',
      ];
    });

  const cal = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Radar MDR x AI Act//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Radar MDR × AI Act: plazos regulatorios',
    'X-WR-TIMEZONE:Europe/Madrid',
    // Cada cuánto deben volver a leer el calendario las suscripciones
    'REFRESH-INTERVAL;VALUE=DURATION:P1D',
    'X-PUBLISHED-TTL:P1D',
    ...eventos,
    'END:VCALENDAR',
  ]
    .map(plegar)
    .join('\r\n') + '\r\n';

  return new Response(cal, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="radar-plazos.ics"',
    },
  });
};
