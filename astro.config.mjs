// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://alfonsoyewu-sketch.github.io', // GitHub Pages (sitio de usuario, en la raíz)
  integrations: [sitemap()],
});
