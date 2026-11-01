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
  const plazos = await getCollection('plazos');
  const ahora = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  // Lo que está en tramitación no es una fecha: no entra en el calendario.
  const eventos = plazos.filter(({ data: p }) => p.estado !== 'en_tramitacion').map(({ data: p }) => {
    const pendiente = p.estado === 'pendiente_confirmacion' ? ' (fecha por confirmar)' : '';
    return [
      'BEGIN:VEVENT',
      `UID:${p.id}@radar-mdr-aiact`,
      `DTSTAMP:${ahora}`,
      `URL:${new URL(`/#${p.id}`, SITIO.dominio).href}`,
      `DTSTART;VALUE=DATE:${fechaICS(p.fecha)}`,
      `DTEND;VALUE=DATE:${diaSiguiente(p.fecha)}`,
      `SUMMARY:${esc(`[${p.norma}] ${p.descripcion_corta}${pendiente}`)}`,
      `DESCRIPTION:${esc(
        `${p.referencia_legal} · Afecta a: ${p.roles_afectados.join(', ')} · Fuente oficial: ${p.fuente_url} · Verificado: ${p.fecha_verificacion}`
      )}`,
      `CATEGORIES:${esc(p.norma)}`,
      // Recordatorio 30 días antes (los clientes que lo soporten lo mostrarán)
      'BEGIN:VALARM',
      'TRIGGER:-P30D',
      'ACTION:DISPLAY',
      `DESCRIPTION:${esc('Quedan 30 días: ' + p.descripcion_corta)}`,
      'END:VALARM',
      'END:VEVENT',
    ].join('\r\n');
  });

  const cal = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Radar MDR x AI Act//ES',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:Radar MDR × AI Act — Plazos regulatorios',
    'X-WR-TIMEZONE:Europe/Madrid',
    ...eventos,
    'END:VCALENDAR',
  ].join('\r\n');

  return new Response(cal, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="radar-plazos.ics"',
    },
  });
};
