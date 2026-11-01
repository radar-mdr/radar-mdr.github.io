// GET /robots.txt, con el sitemap apuntando al dominio de src/config.ts.
import type { APIRoute } from 'astro';
import { SITIO } from '../config';

export const GET: APIRoute = () =>
  new Response(
    ['User-agent: *', 'Allow: /', '', `Sitemap: ${new URL('/sitemap-index.xml', SITIO.dominio).href}`, ''].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
  );
