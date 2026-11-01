// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITIO } from './src/config.ts';

// https://astro.build/config
export default defineConfig({
  // El dominio se cambia en src/config.ts (SITIO.dominio).
  site: SITIO.dominio,
  integrations: [sitemap()],
});
