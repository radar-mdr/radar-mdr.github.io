// GET /rss.xml
// El feed sale solo de los campos nota_cambio + fecha_verificacion:
// la disciplina de datos se convierte en canal de distribución gratis.
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const plazos = (await getCollection('plazos')).map((p) => p.data);

  const items = plazos
    .filter((p) => p.nota_cambio && p.fecha_verificacion)
    .sort((a, b) => (a.fecha_verificacion < b.fecha_verificacion ? 1 : -1))
    .map((p) => ({
      title: `[${p.norma}] ${p.descripcion_corta}`,
      description: `${p.nota_cambio} · Fuente oficial: ${p.fuente_url} · Verificado: ${p.fecha_verificacion}`,
      link: `${context.site}cambios/#${p.id}`,
      pubDate: new Date(p.fecha_verificacion),
    }));

  return rss({
    title: 'Radar MDR × AI Act — Cambios verificados',
    description:
      'Cambios en plazos y obligaciones regulatorias de tecnología médica e IA clínica (MDR, IVDR, AI Act, FDA QMSR), con fuente oficial y fecha de verificación.',
    site: context.site,
    items,
    customData: '<language>es</language>',
  });
}
