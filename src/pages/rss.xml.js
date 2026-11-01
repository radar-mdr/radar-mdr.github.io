// GET /rss.xml
// El feed sale del historial de cambios de cada plazo: la disciplina de
// control de cambios se convierte en canal de distribución gratis.
import rss from '@astrojs/rss';
import { eventosDeCambio, etiquetaCampo } from '../lib/cambios';

export async function GET(context) {
  // Las reverificaciones sin cambio de valor no son noticia: se ven en /cambios.
  const eventos = (await eventosDeCambio()).filter((e) => e.campo !== 'fecha_verificacion');

  const fmt = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  const items = eventos.map((e) => ({
    title:
      e.campo === 'alta'
        ? `[${e.norma}] Nuevo plazo (${fmt.format(new Date(e.plazoFecha + 'T00:00:00'))}): ${e.titulo}`
        : `[${e.norma}] ${e.titulo} (${fmt.format(new Date(e.plazoFecha + 'T00:00:00'))}): cambia ${(etiquetaCampo[e.campo] ?? e.campo).toLowerCase()}`,
    description:
      e.campo === 'alta'
        ? `${e.descripcion} ${e.motivo} Fuente: ${e.fuente_url}`
        : `${e.descripcion} Antes: ${e.valor_anterior}. Ahora: ${e.valor_nuevo}. Motivo: ${e.motivo} Fuente: ${e.fuente_url}`,
    // @astrojs/rss usa el enlace como guid: la consulta lo hace único por cambio.
    link: `${context.site}cambios/?c=${encodeURIComponent(e.guid)}#${e.plazoId}`,
    pubDate: new Date(e.fecha + 'T00:00:00Z'),
  }));

  return rss({
    title: 'Radar MDR × AI Act: cambios verificados',
    description:
      'Cambios en plazos regulatorios de tecnología médica e IA clínica (MDR, IVDR, AI Act, QMSR, EHDS), con valor anterior, valor nuevo, motivo y fuente.',
    site: context.site,
    items,
    customData: '<language>es</language>',
  });
}
