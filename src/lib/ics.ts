// Calendario iCalendar (RFC 5545) a partir de plazos. Lo usan /calendario.ics (todos los
// plazos, generado en el build) y el asistente «¿Qué me aplica?» (solo los del perfil,
// generado en el navegador). Sin dependencias de Astro: se prueba con node --test.

/** Los campos de un plazo que acaban en el calendario. */
export interface PlazoICS {
  id: string;
  norma: string;
  fecha: string;
  titulo: string;
  descripcion_corta: string;
  referencia_legal: string;
  roles_afectados: string[];
  estado: string;
  // Opcional solo para el tipo que infiere Astro del esquema; el esquema la exige siempre.
  fuente_url?: string;
  fecha_verificacion: string;
}

export interface OpcionesICS {
  /** Dominio del sitio sin barra final: los eventos enlazan a <dominio>/#<id>. */
  dominio: string;
  /** Nombre que muestra el calendario en Outlook o Google Calendar. */
  nombre: string;
  /** Momento de generación (DTSTAMP). */
  ahora?: Date;
  /** Solo en el calendario suscribible: cada cuánto lo vuelven a leer los clientes. */
  refresco?: boolean;
}

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

export function calendarioICS(plazos: PlazoICS[], opciones: OpcionesICS): string {
  const ahora = (opciones.ahora ?? new Date()).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  // Lo que está en tramitación no es una fecha: no entra en el calendario.
  const eventos = [...plazos]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .filter((p) => p.estado !== 'en_tramitacion')
    .flatMap((p) => {
      const pendiente = p.estado === 'pendiente_confirmacion' ? ' (fecha por confirmar)' : '';
      const enlace = new URL(`/#${p.id}`, opciones.dominio).href;
      return [
        'BEGIN:VEVENT',
        `UID:${p.id}@radar-mdr-aiact`,
        `DTSTAMP:${ahora}`,
        `URL:${enlace}`,
        `DTSTART;VALUE=DATE:${fechaICS(p.fecha)}`,
        `DTEND;VALUE=DATE:${diaSiguiente(p.fecha)}`,
        `SUMMARY:${esc(`[${p.norma}] ${p.titulo}${pendiente}`)}`,
        `DESCRIPTION:${esc(
          `${p.descripcion_corta}\n\n${p.referencia_legal}\nAfecta a: ${p.roles_afectados.join(', ')}\nFuente oficial: ${p.fuente_url ?? ''}\nVerificado: ${p.fecha_verificacion}\nMás en el Radar: ${enlace}`
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

  return (
    [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Radar MDR x AI Act//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${opciones.nombre}`,
      'X-WR-TIMEZONE:Europe/Madrid',
      // Cada cuánto deben volver a leer el calendario las suscripciones
      ...(opciones.refresco ? ['REFRESH-INTERVAL;VALUE=DURATION:P1D', 'X-PUBLISHED-TTL:P1D'] : []),
      ...eventos,
      'END:VCALENDAR',
    ]
      .map(plegar)
      .join('\r\n') + '\r\n'
  );
}
