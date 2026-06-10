import { describe, it, expect } from 'vitest';
import {
  ESPECIALIDADES_CAMINATA,
  ETIQUETAS_ESPECIALIDAD,
  ETIQUETAS_RED_FLAG,
  RED_FLAGS_TUTOR,
  evaluarRedFlags,
} from './fichas';

describe('evaluarRedFlags (regla 2+ del método)', () => {
  it('0 red flags → no sugiere rechazo', () => {
    expect(evaluarRedFlags([])).toEqual({ cantidad: 0, sugerirRechazo: false });
  });

  it('1 red flag → no sugiere rechazo', () => {
    expect(evaluarRedFlags(['presiona_tiempo'])).toEqual({
      cantidad: 1,
      sugerirRechazo: false,
    });
  });

  it('2 red flags → sugiere rechazo', () => {
    expect(evaluarRedFlags(['presiona_tiempo', 'oculta_informacion'])).toEqual({
      cantidad: 2,
      sugerirRechazo: true,
    });
  });

  it('3 red flags → sugiere rechazo', () => {
    expect(
      evaluarRedFlags(['presiona_tiempo', 'oculta_informacion', 'rechaza_protocolos']),
    ).toEqual({ cantidad: 3, sugerirRechazo: true });
  });

  it('duplicados cuentan una sola vez', () => {
    expect(evaluarRedFlags(['presiona_tiempo', 'presiona_tiempo'])).toEqual({
      cantidad: 1,
      sugerirRechazo: false,
    });
  });

  it('cada red flag de la taxonomía tiene etiqueta humana', () => {
    for (const rf of RED_FLAGS_TUTOR) {
      expect(ETIQUETAS_RED_FLAG[rf]).toBeTruthy();
    }
  });
});

describe('especialidades de caminata (catálogo del método)', () => {
  it('expone la taxonomía oficial', () => {
    expect(ESPECIALIDADES_CAMINATA).toEqual(['energetica', 'senior', 'olfatoria']);
  });

  it('cada especialidad tiene etiqueta humana', () => {
    for (const e of ESPECIALIDADES_CAMINATA) {
      expect(ETIQUETAS_ESPECIALIDAD[e]).toBeTruthy();
    }
  });
});
