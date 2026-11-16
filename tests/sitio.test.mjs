// Comprobaciones sobre el sitio ya construido (dist/) y sobre el código fuente.
// Hace falta haber ejecutado antes `npm run build`; `npm run verificar` lo hace todo en orden.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(RAIZ, 'dist');
const hayDist = existsSync(join(DIST, 'index.html'));
const omitir = hayDist ? false : 'no existe dist/: ejecuta antes npm run build';

function archivos(dir, filtro) {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    return statSync(ruta).isDirectory() ? archivos(ruta, filtro) : filtro(ruta) ? [ruta] : [];
  });
}
const paginas = hayDist ? archivos(DIST, (r) => r.endsWith('.html')).filter((r) => !r.includes(`${sep}pagefind${sep}`)) : [];
const corto = (ruta) => relative(DIST, ruta).split(sep).join('/');
const plazos = JSON.parse(readFileSync(join(RAIZ, 'src', 'data', 'plazos.json'), 'utf8'));

test('el build genera las páginas y los ficheros que se enlazan desde fuera', { skip: omitir }, () => {
  assert.ok(paginas.length >= 25, `solo ${paginas.length} páginas`);
  for (const f of ['calendario.ics', 'rss.xml', 'robots.txt', 'sitemap-index.xml', 'api/plazos.json', 'api/fuentes.json', 'api/organismos.json', 'que-me-aplica/index.html', 'pagefind/pagefind-ui.js']) {
    assert.ok(existsSync(join(DIST, f)), `falta ${f}`);
  }
});

test('todas las páginas llevan Content-Security-Policy y cubre cada script y estilo inline', { skip: omitir }, () => {
  // Si falla con «sin hash»: hay un <script is:inline> o un define:vars. Los scripts de página
  // tienen que ser <script> normales para que Astro calcule su hash (ver astro.config.mjs).
  for (const ruta of paginas) {
    const html = readFileSync(ruta, 'utf8');
    const csp = html.match(/http-equiv="content-security-policy" content="([^"]*)"/i)?.[1];
    assert.ok(csp, `${corto(ruta)}: sin CSP`);
    const directiva = (nombre) => csp.split(';').find((d) => d.trim().startsWith(nombre)) ?? '';
    for (const [patron, nombre] of [[/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g, 'script-src'], [/<style([^>]*)>([\s\S]*?)<\/style>/g, 'style-src']]) {
      for (const [, atributos, contenido] of html.matchAll(patron)) {
        if (/type="application\/(ld\+)?json"/.test(atributos)) continue; // datos, no código
        const hash = `sha256-${createHash('sha256').update(contenido).digest('base64')}`;
        assert.ok(directiva(nombre).includes(hash), `${corto(ruta)}: bloque inline sin hash en ${nombre}: ${contenido.slice(0, 60)}`);
      }
    }
    const sinScripts = html.replace(/<script[\s\S]*?<\/script>/g, '');
    assert.ok(!/\son[a-z]+="/.test(sinScripts), `${corto(ruta)}: atributo on…="" (la CSP lo bloquea)`);
    assert.ok(!/\sstyle="/.test(sinScripts), `${corto(ruta)}: atributo style="" (la CSP lo bloquea)`);
  }
});

test('los enlaces internos llevan a páginas que existen', { skip: omitir }, () => {
  const rotos = new Set();
  for (const ruta of paginas) {
    for (const [, destino] of readFileSync(ruta, 'utf8').matchAll(/\shref="(\/[^"#?]*)/g)) {
      const fichero = join(DIST, decodeURIComponent(destino));
      const existe = destino.endsWith('/') ? existsSync(join(fichero, 'index.html')) : existsSync(fichero);
      if (!existe) rotos.add(`${corto(ruta)} → ${destino}`);
    }
  }
  assert.deepEqual([...rotos], []);
});

test('el calendario lleva un evento por cada plazo que no está en tramitación', { skip: omitir }, () => {
  const ics = readFileSync(join(DIST, 'calendario.ics'), 'utf8');
  const esperados = plazos.filter((p) => p.estado !== 'en_tramitacion').length;
  assert.equal((ics.match(/BEGIN:VEVENT/g) ?? []).length, esperados);
  assert.equal((ics.match(/TRIGGER:-P30D/g) ?? []).length, esperados);
  for (const linea of ics.split('\r\n')) assert.ok(Buffer.byteLength(linea) <= 75, `línea de más de 75 octetos: ${linea.slice(0, 40)}`);
});

test('el asistente pinta una tarjeta por plazo, con los datos que necesita su lógica', { skip: omitir }, () => {
  const html = readFileSync(join(DIST, 'que-me-aplica', 'index.html'), 'utf8');
  for (const p of plazos.filter((p) => p.estado !== 'en_tramitacion')) {
    assert.ok(html.includes(`data-id="${p.id}"`), `falta la tarjeta de ${p.id}`);
  }
  for (const atributo of ['data-norma', 'data-tipo', 'data-estado', 'data-fecha', 'data-roles', 'data-clases']) assert.ok(html.includes(atributo));
  assert.match(html, /orientativo/i, 'el asistente tiene que avisar de que el resultado es orientativo');
});

test('el rastreador y la portada muestran todas las propuestas, con su ficha oficial', { skip: omitir }, () => {
  const propuestas = JSON.parse(readFileSync(join(RAIZ, 'src', 'data', 'propuestas.json'), 'utf8'));
  const rastreador = readFileSync(join(DIST, 'en-tramitacion', 'index.html'), 'utf8');
  const portada = readFileSync(join(DIST, 'index.html'), 'utf8');
  for (const p of propuestas) {
    assert.ok(rastreador.includes(`id="${p.id}"`), `falta ${p.id} en /en-tramitacion/`);
    assert.ok(rastreador.includes(`href="${p.ficha_oficial.replaceAll('&', '&amp;')}"`), `falta el enlace a la ficha oficial de ${p.id}`);
    assert.ok(portada.includes(`/en-tramitacion/#${p.id}`), `la portada no enlaza a ${p.id}`);
  }
});

test('el único correo que aparece en la web es el de contacto del proyecto', { skip: omitir }, () => {
  const config = readFileSync(join(RAIZ, 'src', 'config.ts'), 'utf8');
  const contacto = config.match(/email: '([^']+)'/)[1];
  const otros = new Set();
  for (const ruta of archivos(DIST, (r) => /\.(html|xml|json|ics|txt)$/.test(r)).filter((r) => !r.includes(`${sep}pagefind${sep}`))) {
    for (const [correo] of readFileSync(ruta, 'utf8').matchAll(/[\w.+-]+@[\w-]+\.[a-z]{2,}(?:\.[a-z]{2,})?/gi)) {
      if (correo !== contacto && !correo.endsWith('@radar-mdr-aiact')) otros.add(`${corto(ruta)}: ${correo}`);
    }
  }
  assert.deepEqual([...otros], []);
});

test('el código fuente no usa scripts que la CSP dejaría sin hash', () => {
  const malos = [];
  for (const ruta of archivos(join(RAIZ, 'src'), (r) => r.endsWith('.astro'))) {
    const fuente = readFileSync(ruta, 'utf8');
    for (const [etiqueta] of fuente.matchAll(/<script\b[^>]*>/g)) {
      const externo = /\bsrc=/.test(etiqueta);
      if ((/\bis:inline\b/.test(etiqueta) && !externo) || /\bdefine:vars\b/.test(etiqueta)) malos.push(`${relative(RAIZ, ruta)}: ${etiqueta}`);
    }
  }
  assert.deepEqual(malos, []);
});
