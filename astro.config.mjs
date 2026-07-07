// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://example.com', // TODO: sustituir por el dominio real cuando se compre
  integrations: [sitemap()],
});
