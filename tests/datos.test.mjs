// Reglas de los datos que el esquema Zod no puede comprobar (src/content.config.ts valida
// la forma; aquí se valida la coherencia). Si una prueba falla, lo normal es que el dato
// esté mal, no la prueba.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { rolesDe, clasesDe, CLASES_PS, CLASES_IVD } from '../src/lib/asistente.ts';
import { incoherencias, hitosVencidos } from '../src/lib/tramitacion.ts';

const leer = (nombre) => JSON.parse(readFileSync(new URL(`../src/data/${nombre}.json`, import.meta.url), 'utf8'));
const COLECCIONES = ['plazos', 'obligaciones', 'guias', 'organismos', 'herramientas', 'requisitos-eqms', 'fuentes', 'glosario', 'propuestas', 'erratas'];
const datos = Object.fromEntries(COLECCIONES.map((c) => [c, leer(c)]));
const hoy = new Date().toISOString().slice(0, 10);

test('ningún id se repite dentro de su colección', () => {
  for (const [nombre, filas] of Object.entries(datos)) {
    const ids = filas.map((f) => f.id);
    const repetidos = ids.filter((id, i) => ids.indexOf(id) !== i);
    assert.deepEqual(repetidos, [], `ids repetidos en ${nombre}.json`);
  }
});

test('todas las URL de los datos empiezan por https://', () => {
  const malas = [];
  const recorrer = (valor, ruta) => {
    if (typeof valor === 'string') {
      if (/^(\w+:\/\/|(javascript|data|mailto|file):)/i.test(valor) && !valor.startsWith('https://')) malas.push(`${ruta}: ${valor}`);
    } else if (Array.isArray(valor)) valor.forEach((v, i) => recorrer(v, `${ruta}[${i}]`));
    else if (valor && typeof valor === 'object') for (const [k, v] of Object.entries(valor)) recorrer(v, `${ruta}.${k}`);
  };
  for (const [nombre, filas] of Object.entries(datos)) recorrer(filas, nombre);
  assert.deepEqual(malas, []);
});

test('ninguna fecha de verificación está en el futuro', () => {
  for (const [nombre, filas] of Object.entries(datos)) {
    for (const f of filas) {
      if (f.fecha_verificacion) assert.ok(f.fecha_verificacion <= hoy, `${nombre}/${f.id}: verificado el ${f.fecha_verificacion}`);
    }
  }
});

test('cada plazo tiene historial (ALCOA+), ordenado y no posterior a su verificación', () => {
  for (const p of datos.plazos) {
    assert.ok(p.historial?.length > 0, `${p.id}: sin historial (al menos la entrada de alta)`);
    const fechas = p.historial.map((h) => h.fecha);
    assert.deepEqual(fechas, [...fechas].sort(), `${p.id}: historial desordenado`);
    assert.ok(fechas.at(-1) <= p.fecha_verificacion, `${p.id}: hay un cambio posterior a fecha_verificacion; actualízala`);
  }
});

test('el asistente conoce todos los roles y clases que usan los plazos', () => {
  // Si falla: has usado un rol o una clase nuevos. Añádelos a src/lib/asistente.ts (y una
  // pregunta u opción en que-me-aplica.astro si hace falta) o el asistente los esconderá.
  const perfiles = [
    { rol: 'fabricante', producto: 'hce', ia: 'si' },
    { rol: 'organismo', ia: 'si' },
    { rol: 'sanitario', ia: 'si' },
    { rol: 'representante', producto: 'ps', clase: 'I', ia: 'si' },
    { rol: 'importador', producto: 'ps', clase: 'I', ia: 'si' },
    ...CLASES_PS.flatMap((clase) => ['no', 'si', 'medida'].map((implantable) => ({ rol: 'fabricante', producto: 'ps', clase, implantable, ia: 'si' }))),
    ...CLASES_IVD.map((clase) => ({ rol: 'fabricante', producto: 'ivd', clase, ia: 'si' })),
  ];
  const roles = new Set([...perfiles.flatMap(rolesDe), 'Estado miembro / Comisión']);
  const clases = new Set(['todas', 'SaMD / IA', ...perfiles.flatMap((p) => [...clasesDe(p).seguras, ...Object.keys(clasesDe(p).condicionales)])]);
  for (const p of datos.plazos) {
    for (const r of p.roles_afectados) assert.ok(roles.has(r), `${p.id}: rol desconocido «${r}»`);
    for (const c of p.clases_producto) assert.ok(clases.has(c), `${p.id}: clase desconocida «${c}»`);
  }
});

test('el rastreador solo usa fuentes oficiales de la UE para el estado de cada propuesta', () => {
  // Las fechas que circulan en prensa o en consultoras no valen hasta que las da una institución.
  const oficial = (u) => new URL(u).hostname.endsWith('.europa.eu');
  for (const p of datos.propuestas) {
    assert.ok(oficial(p.fuente_url), `${p.id}: la propuesta tiene que enlazar a su texto oficial`);
    assert.ok(p.ficha_oficial.startsWith('https://oeil.europarl.europa.eu/') && p.ficha_oficial.includes(p.procedimiento), `${p.id}: ficha_oficial tiene que ser la del expediente ${p.procedimiento} en el Observatorio Legislativo`);
    for (const h of p.hitos) assert.ok(oficial(h.fuente_url), `${p.id}: hito «${h.hito}» con fuente no oficial (${h.fuente_url})`);
  }
});

test('los hitos hechos tienen fecha oficial, no futura y en orden', () => {
  for (const p of datos.propuestas) {
    const hechos = p.hitos.filter((h) => h.hecho);
    for (const h of hechos) {
      assert.ok(h.fecha_iso, `${p.id}: hito hecho sin fecha_iso («${h.hito}»)`);
      assert.ok(h.fecha_iso <= hoy, `${p.id}: hito hecho con fecha futura («${h.hito}»)`);
    }
    const fechas = hechos.map((h) => h.fecha_iso);
    assert.deepEqual(fechas, [...fechas].sort(), `${p.id}: hitos hechos desordenados`);
    assert.equal(hechos[0]?.fecha_iso, p.fecha_propuesta, `${p.id}: el primer hito es la propuesta de la Comisión`);
  }
});

test('las etapas de cada propuesta son coherentes y tiene historial', () => {
  for (const p of datos.propuestas) {
    assert.deepEqual(incoherencias(p.etapas), [], `${p.id}: etapas incoherentes`);
    assert.ok(p.historial?.length > 0, `${p.id}: sin historial (al menos la entrada de alta)`);
    assert.ok(p.historial.at(-1).fecha <= p.fecha_verificacion, `${p.id}: hay un cambio posterior a fecha_verificacion`);
    assert.ok(p.resumen_corto.length <= 200, `${p.id}: resumen_corto demasiado largo para la portada`);
  }
});

test('aviso: hitos previstos cuya fecha ya pasó (no hace fallar la prueba)', (t) => {
  for (const p of datos.propuestas) {
    for (const h of hitosVencidos(p.hitos, hoy)) t.diagnostic(`${p.id}: «${h.hito}» estaba previsto el ${h.fecha_iso}; comprueba en ${p.ficha_oficial} si ya ocurrió`);
  }
});

test('las obligaciones enlazan a guías que existen', () => {
  const guias = new Set(datos.guias.map((g) => g.id));
  for (const o of datos.obligaciones) {
    if (o.guia_relacionada) assert.ok(guias.has(o.guia_relacionada), `${o.id}: guía «${o.guia_relacionada}» inexistente`);
  }
});

test('las fichas publicadas son Markdown puro, con resumen de tamaño razonable', () => {
  for (const g of datos.guias.filter((g) => g.estado_ficha === 'publicada')) {
    assert.ok(g.resumen_es, `${g.id}: ficha publicada sin resumen`);
    assert.ok(!/<[a-z/!]/i.test(g.resumen_es), `${g.id}: el resumen lleva HTML (se mostraría como texto)`);
    for (const [, destino] of g.resumen_es.matchAll(/\]\(([^)]+)\)/g)) {
      assert.ok(/^(https:\/\/|\/|#)/.test(destino), `${g.id}: enlace no permitido «${destino}»`);
    }
    const palabras = g.resumen_es.split(/\s+/).length;
    assert.ok(palabras >= 150 && palabras <= 450, `${g.id}: ${palabras} palabras (lo habitual son unas 300)`);
    assert.ok(g.fecha_verificacion, `${g.id}: ficha publicada sin fecha_verificacion`);
  }
});

test('las erratas cerradas tienen fecha de corrección, no anterior a la detección', () => {
  for (const e of datos.erratas) {
    if (e.estado === 'cerrada') assert.ok(e.fecha_correccion, `${e.id}: cerrada sin fecha_correccion`);
    if (e.fecha_correccion) assert.ok(e.fecha_correccion >= e.fecha_deteccion, `${e.id}: corregida antes de detectarse`);
  }
});

test('aviso: datos con más de 90 días sin reverificar (no hace fallar la prueba)', (t) => {
  const limite = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  for (const [nombre, filas] of Object.entries(datos)) {
    const viejos = filas.filter((f) => f.fecha_verificacion && f.fecha_verificacion < limite);
    if (viejos.length > 0) t.diagnostic(`${nombre}.json: ${viejos.length} por reverificar (${viejos.slice(0, 5).map((f) => f.id).join(', ')}${viejos.length > 5 ? '…' : ''})`);
  }
});
