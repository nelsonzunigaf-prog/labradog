import { describe, it, expect } from 'vitest';
import { ETIQUETAS_TIPO_EVALUACION, TIPOS_EVALUACION } from './capacitacion';

describe('tipos de evaluación de capacitación (catálogo del método)', () => {
  it('expone la taxonomía oficial', () => {
    expect(TIPOS_EVALUACION).toEqual(['test', 'practica', 'test_y_practica', 'examen_final']);
  });

  it('cada tipo tiene etiqueta humana', () => {
    for (const t of TIPOS_EVALUACION) {
      expect(ETIQUETAS_TIPO_EVALUACION[t]).toBeTruthy();
    }
  });
});
