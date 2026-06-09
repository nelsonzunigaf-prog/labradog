import { describe, it, expect } from 'vitest';
import {
  ESTADOS_PASEO,
  TRANSICIONES,
  esTerminal,
  puedeTransicionar,
  transicionar,
  type EstadoPaseo,
} from './paseo-estados';

describe('máquina de estados del paseo', () => {
  it('expone los 5 estados del método en orden de flujo', () => {
    expect(ESTADOS_PASEO).toEqual([
      'pendiente',
      'checklist_completa',
      'en_curso',
      'completado',
      'cancelado',
    ]);
  });

  it('acepta todas las transiciones válidas declaradas', () => {
    for (const desde of ESTADOS_PASEO) {
      for (const hacia of TRANSICIONES[desde]) {
        expect(puedeTransicionar(desde, hacia)).toBe(true);
        expect(transicionar(desde, hacia)).toBe(hacia);
      }
    }
  });

  it('rechaza TODA transición no declarada (producto cartesiano completo)', () => {
    for (const desde of ESTADOS_PASEO) {
      for (const hacia of ESTADOS_PASEO) {
        const esValida = TRANSICIONES[desde].includes(hacia);
        if (esValida) continue;
        expect(puedeTransicionar(desde, hacia)).toBe(false);
        expect(() => transicionar(desde, hacia)).toThrow(/Transición inválida/);
      }
    }
  });

  it('marca completado y cancelado como terminales; el resto no', () => {
    const terminales: EstadoPaseo[] = ['completado', 'cancelado'];
    for (const estado of ESTADOS_PASEO) {
      expect(esTerminal(estado)).toBe(terminales.includes(estado));
    }
  });

  it('permite cancelar desde cualquier estado no terminal', () => {
    expect(puedeTransicionar('pendiente', 'cancelado')).toBe(true);
    expect(puedeTransicionar('checklist_completa', 'cancelado')).toBe(true);
    expect(puedeTransicionar('en_curso', 'cancelado')).toBe(true);
    // No se puede cancelar lo ya terminal
    expect(puedeTransicionar('completado', 'cancelado')).toBe(false);
    expect(puedeTransicionar('cancelado', 'cancelado')).toBe(false);
  });

  it('no permite saltarse pasos del flujo feliz', () => {
    expect(puedeTransicionar('pendiente', 'en_curso')).toBe(false);
    expect(puedeTransicionar('pendiente', 'completado')).toBe(false);
    expect(puedeTransicionar('checklist_completa', 'completado')).toBe(false);
  });
});
