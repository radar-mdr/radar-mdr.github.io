// Lógica del rastreador «En tramitación» (src/lib/tramitacion.ts).
import test from 'node:test';
import assert from 'node:assert/strict';
import { ETAPAS, faseActual, etapasHechas, proximoHito, proximaFecha, hitosVencidos, incoherencias } from '../src/lib/tramitacion.ts';

const etapas = (cambios = {}) => ({
  propuesta: 'hecho', parlamento: 'pendiente', consejo: 'pendiente', acuerdo: 'pendiente', adopcion: 'pendiente', publicacion: 'pendiente',
  ...cambios,
});
const HITOS = [
  { fecha: '16-12-2025', fecha_iso: '2025-12-16', hito: 'Propuesta', hecho: true },
  { fecha: 'Sin fecha oficial', hito: 'Votación en comisión', hecho: false },
  { fecha: '18-1-2027 (indicativa)', fecha_iso: '2027-01-18', hito: 'Pleno', hecho: false },
];

test('las seis etapas del procedimiento legislativo ordinario, en orden', () => {
  assert.deepEqual(ETAPAS.map((e) => e.clave), ['propuesta', 'parlamento', 'consejo', 'acuerdo', 'adopcion', 'publicacion']);
});

test('fase actual: las etapas en curso, o la primera pendiente', () => {
  assert.equal(faseActual(etapas({ parlamento: 'en_curso' })), 'Posición del Parlamento');
  assert.equal(faseActual(etapas({ parlamento: 'en_curso', consejo: 'en_curso' })), 'Posición del Parlamento · Posición del Consejo');
  assert.equal(faseActual(etapas()), 'Pendiente: posición del parlamento');
  const todo = Object.fromEntries(ETAPAS.map((e) => [e.clave, 'hecho']));
  assert.equal(faseActual(todo), 'Publicada en el DOUE');
  assert.equal(etapasHechas(todo), 6);
  assert.equal(etapasHechas(etapas({ consejo: 'hecho' })), 2);
});

test('próximo paso: el primero sin hacer en orden, aunque no tenga fecha', () => {
  // La votación en comisión va antes que el pleno, aunque solo el pleno tenga fecha.
  assert.equal(proximoHito(HITOS).hito, 'Votación en comisión');
  assert.equal(proximoHito(HITOS.filter((h) => h.hecho)), undefined);
});

test('próxima fecha oficial: el hito sin hacer con fecha más cercana a partir de hoy', () => {
  assert.equal(proximaFecha(HITOS, '2026-11-16').hito, 'Pleno');
  assert.equal(proximaFecha(HITOS, '2027-02-01'), undefined);
});

test('hitos vencidos: previstos con fecha oficial ya pasada', () => {
  assert.deepEqual(hitosVencidos(HITOS, '2026-11-16'), []);
  assert.deepEqual(hitosVencidos(HITOS, '2027-01-19').map((h) => h.hito), ['Pleno']);
});

test('incoherencias: Parlamento y Consejo pueden ir a la vez; lo demás va en orden', () => {
  assert.deepEqual(incoherencias(etapas({ parlamento: 'en_curso', consejo: 'hecho' })), []);
  assert.equal(incoherencias(etapas({ acuerdo: 'en_curso', parlamento: 'hecho' })).length, 1, 'trílogos sin posición del Consejo');
  assert.equal(incoherencias(etapas({ propuesta: 'en_curso', parlamento: 'en_curso' })).length, 1);
  assert.equal(incoherencias(etapas({ parlamento: 'hecho', consejo: 'hecho', acuerdo: 'hecho', adopcion: 'hecho', publicacion: 'hecho' })).length, 0);
});
