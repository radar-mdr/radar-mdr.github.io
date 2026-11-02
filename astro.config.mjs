// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITIO } from './src/config.ts';

// https://astro.build/config
export default defineConfig({
  // El dominio se cambia en src/config.ts (SITIO.dominio).
  site: SITIO.dominio,
  // Todas las páginas con barra final: evita la redirección 301 en cada clic interno.
  trailingSlash: 'always',
  // Astro 7 compacta por defecto con las reglas de JSX ('jsx'), que se comen el espacio entre
  // un texto y un enlace o <strong> en otra línea («bajoCC BY 4.0»). true = como en Astro 5.
  compressHTML: true,
  integrations: [sitemap()],
});
