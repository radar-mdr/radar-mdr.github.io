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
  // Content-Security-Policy en <meta> (GitHub Pages no deja poner cabeceras). Astro añade
  // el hash de sus scripts y estilos; los scripts de página no pueden ser is:inline o se
  // quedarían fuera. Si añades un servicio externo, ponlo aquí o el navegador lo bloqueará.
  security: {
    csp: {
      scriptDirective: {
        // gc.zgo.at: GoatCounter · tally.so: formulario de /pro
        // 'wasm-unsafe-eval': el buscador Pagefind funciona con WebAssembly
        resources: ["'self'", 'https://gc.zgo.at', 'https://tally.so', "'wasm-unsafe-eval'"],
      },
      directives: [
        "default-src 'self'",
        "img-src 'self' data: https://*.goatcounter.com",
        "connect-src 'self' https://*.goatcounter.com",
        'frame-src https://tally.so',
        "form-action 'self' https://buttondown.com",
        "object-src 'none'",
        "base-uri 'self'",
      ],
    },
  },
});
