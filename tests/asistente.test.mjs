// Lógica del asistente «¿Qué me aplica?» contra los datos reales de plazos.json.
// Si cambias un plazo y falla una prueba, comprueba primero si el asistente debe seguir
// dando ese resultado; solo entonces actualiza la prueba.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { plazosDePerfil, resumenPerfil, CLASES_PS, CLASES_IVD } from '../src/lib/asistente.ts';

const plazos = JSON.parse(readFileSync(new URL('../src/data/plazos.json', import.meta.url), 'utf8'));
const dato = (id) => plazos.find((p) => p.id === id);
const ids = (perfil) => plazosDePerfil(perfil, plazos).map((r) => r.id);
const normas = (perfil) => new Set(ids(perfil).map((id) => dato(id).norma));
const de = (perfil, id) => plazosDePerfil(perfil, plazos).find((r) => r.id === id);

const ALTO_RIESGO_ANEXO_I = '2028-08-02-ai-act-alto-riesgo-anexo-i-embebida';
const TRANSITORIO_2027 = '2027-12-31-mdr-fin-transitorio-alto-riesgo';
const TRANSITORIO_2028 = '2028-12-31-mdr-fin-transitorio-riesgo-medio-bajo';
const EUDAMED_LEGACY = '2026-11-27-eudamed-registro-legacy';
const SSCP = '2027-03-27-eudamed-sscp-productos-anteriores';

const IIA_LEGACY = { rol: 'fabricante', producto: 'ps', clase: 'IIa', implantable: 'no', ia: 'no', legacy: 'si', eeuu: false };

test('los plazos que citan estas pruebas siguen existiendo', () => {
  for (const id of [ALTO_RIESGO_ANEXO_I, TRANSITORIO_2027, TRANSITORIO_2028, EUDAMED_LEGACY, SSCP]) assert.ok(dato(id), `falta ${id}`);
});

test('fabricante de clase IIa legacy sin IA: transitorio de 2028 y EUDAMED, nada más', () => {
  const r = ids(IIA_LEGACY);
  assert.ok(r.includes(TRANSITORIO_2028));
  assert.ok(r.includes(EUDAMED_LEGACY));
  assert.ok(!r.includes(TRANSITORIO_2027));
  for (const norma of ['AI Act', 'QMSR', 'IVDR', 'EHDS']) assert.ok(!normas(IIA_LEGACY).has(norma), `no debería salir ${norma}`);
});

test('sin legacy no salen los fines de transitorio', () => {
  const r = ids({ ...IIA_LEGACY, legacy: 'no' });
  assert.ok(r.every((id) => dato(id).tipo !== 'fin_transitorio'));
  assert.ok(r.includes(EUDAMED_LEGACY));
});

test('«no lo sé» en legacy: el transitorio sale con su condición', () => {
  const r = de({ ...IIA_LEGACY, legacy: 'nose' }, TRANSITORIO_2028);
  assert.ok(r);
  assert.ok(r.condiciones.some((c) => c.includes('legacy')));
});

test('con IA entran los plazos del AI Act, incluido el alto riesgo del anexo I', () => {
  const p = { ...IIA_LEGACY, ia: 'si' };
  assert.ok(normas(p).has('AI Act'));
  const alto = de(p, ALTO_RIESGO_ANEXO_I);
  assert.ok(alto, 'falta el plazo de alto riesgo del anexo I');
  assert.ok(alto.motivos.some((m) => m.includes('IIa')));
  assert.deepEqual(alto.condiciones, []);
});

test('clase I con IA: no entra en el alto riesgo del anexo I, pero sí en los plazos generales de IA', () => {
  const p = { rol: 'fabricante', producto: 'ps', clase: 'I', ia: 'si', legacy: 'no', eeuu: false };
  assert.ok(!ids(p).includes(ALTO_RIESGO_ANEXO_I));
  assert.ok(normas(p).has('AI Act'));
});

test('IA «no lo sé»: los plazos del AI Act salen condicionados', () => {
  const r = de({ ...IIA_LEGACY, ia: 'nose' }, ALTO_RIESGO_ANEXO_I);
  assert.ok(r.condiciones.some((c) => c.includes('IA')));
});

test('la QMSR solo sale si se vende en EE. UU.', () => {
  assert.ok(!normas(IIA_LEGACY).has('QMSR'));
  assert.ok(normas({ ...IIA_LEGACY, eeuu: true }).has('QMSR'));
});

test('IIb implantable: fecha de 2027 segura y la de 2028 solo para los exentos', () => {
  const p = { ...IIA_LEGACY, clase: 'IIb', implantable: 'si' };
  assert.deepEqual(de(p, TRANSITORIO_2027).condiciones, []);
  assert.ok(de(p, TRANSITORIO_2028).condiciones.some((c) => c.includes('exentos')));
  // El SS(C)P solo afecta a implantables y clase III (y a IVD C y D).
  assert.ok(ids(p).includes(SSCP));
  assert.ok(!ids(IIA_LEGACY).includes(SSCP));
});

test('IIa implantable conserva el transitorio general de la IIa', () => {
  const p = { ...IIA_LEGACY, implantable: 'si' };
  assert.ok(ids(p).includes(TRANSITORIO_2028));
  assert.ok(ids(p).includes(SSCP));
});

test('fabricante de IVD de clase C: sus fechas IVDR y ninguna solo MDR', () => {
  const p = { rol: 'fabricante', producto: 'ivd', clase: 'IVD C', ia: 'no', legacy: 'si', eeuu: false };
  const r = plazosDePerfil(p, plazos);
  assert.ok(r.some((x) => dato(x.id).norma === 'IVDR' && dato(x.id).tipo === 'fin_transitorio'));
  assert.ok(!normas(p).has('MDR'));
  assert.ok(r.some((x) => x.motivos.some((m) => m.includes('C (IVD)'))));
});

test('clase «no lo sé»: salen los plazos de todas las clases, condicionados', () => {
  const p = { rol: 'fabricante', producto: 'ps', clase: 'nose', ia: 'no', legacy: 'si', eeuu: false };
  assert.ok(de(p, TRANSITORIO_2027).condiciones.length > 0);
  assert.ok(de(p, TRANSITORIO_2028).condiciones.length > 0);
  assert.ok(!normas(p).has('IVDR'));
});

test('organismo notificado: solo lo que afecta a los organismos', () => {
  const r = ids({ rol: 'organismo', ia: 'no' });
  assert.ok(r.length > 0);
  for (const id of r) assert.ok(dato(id).roles_afectados.includes('organismo notificado'));
});

test('centro sanitario: EHDS siempre; AI Act solo si usa IA', () => {
  assert.deepEqual([...normas({ rol: 'sanitario', ia: 'no' })], ['EHDS']);
  assert.ok(normas({ rol: 'sanitario', ia: 'si' }).has('AI Act'));
});

test('software de historia clínica: EHDS y nada de MDR ni IVDR', () => {
  const n = normas({ rol: 'fabricante', producto: 'hce', ia: 'no', eeuu: false });
  assert.ok(n.has('EHDS'));
  for (const norma of ['MDR', 'IVDR', 'MDR/IVDR']) assert.ok(!n.has(norma));
  // Con IA le tocan los plazos generales, pero no el alto riesgo de productos sanitarios.
  assert.ok(!ids({ rol: 'fabricante', producto: 'hce', ia: 'si', eeuu: false }).includes(ALTO_RIESGO_ANEXO_I));
});

test('el resultado va por fecha, sin repetidos, con motivo y sin nada en tramitación', () => {
  const perfiles = [
    ...CLASES_PS.map((clase) => ({ ...IIA_LEGACY, clase, ia: 'si', eeuu: true })),
    ...CLASES_IVD.map((clase) => ({ ...IIA_LEGACY, producto: 'ivd', clase })),
  ];
  for (const perfil of perfiles) {
    const r = plazosDePerfil(perfil, plazos);
    const fechas = r.map((x) => dato(x.id).fecha);
    assert.deepEqual(fechas, [...fechas].sort());
    assert.equal(new Set(r.map((x) => x.id)).size, r.length);
    assert.ok(r.every((x) => dato(x.id).estado !== 'en_tramitacion'));
    assert.ok(r.every((x) => x.motivos.length > 0));
  }
});

test('ningún plazo queda escondido: cada uno le sale a algún perfil', () => {
  const perfiles = [
    { rol: 'fabricante', producto: 'hce', ia: 'si', eeuu: true },
    { rol: 'organismo', ia: 'si' },
    { rol: 'sanitario', ia: 'si' },
  ];
  for (const rol of ['fabricante', 'representante', 'importador']) {
    for (const [producto, clases] of [['ps', CLASES_PS], ['ivd', CLASES_IVD]]) {
      for (const clase of clases) {
        for (const implantable of ['no', 'si', 'medida']) perfiles.push({ rol, producto, clase, implantable, ia: 'si', legacy: 'si', eeuu: true });
      }
    }
  }
  const vistos = new Set(perfiles.flatMap((p) => ids(p)));
  // Los plazos que solo afectan a Estados miembros o a la Comisión no tienen perfil en el asistente.
  const ocultos = plazos
    .filter((p) => p.estado !== 'en_tramitacion' && !vistos.has(p.id))
    .filter((p) => p.roles_afectados.some((r) => r !== 'Estado miembro / Comisión'))
    .map((p) => p.id);
  assert.deepEqual(ocultos, []);
});

test('resumen del perfil legible', () => {
  assert.equal(
    resumenPerfil({ ...IIA_LEGACY, ia: 'si', eeuu: true }),
    'fabricante · producto sanitario (clase IIa) · legacy · vende en EE. UU. · con IA'
  );
  assert.equal(resumenPerfil({ rol: 'sanitario', ia: 'nose' }), 'centro o prestador sanitario · IA por confirmar');
});
