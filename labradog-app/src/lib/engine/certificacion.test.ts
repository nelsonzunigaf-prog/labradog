import { describe, it, expect } from 'vitest';
import { calcularAvance, calcularEstadosEtapas, puedeAbrirEtapa } from './certificacion';

const NUMEROS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function estados(aprobados: number[]) {
  return calcularEstadosEtapas(NUMEROS, new Set(aprobados));
}

function estadoDe(numero: number, aprobados: number[]) {
  return estados(aprobados).find((e) => e.numero === numero)?.estado;
}

describe('calcularEstadosEtapas (regla de desbloqueo secuencial, FR-011)', () => {
  it('sin aprobaciones: la 1 es actual y 2-10 bloqueadas', () => {
    const resultado = estados([]);
    expect(resultado[0]).toEqual({ numero: 1, estado: 'actual' });
    for (const e of resultado.slice(1)) {
      expect(e.estado).toBe('bloqueada');
    }
  });

  it('con 1-3 aprobadas: la 4 es actual, 5-10 bloqueadas', () => {
    expect(estadoDe(3, [1, 2, 3])).toBe('aprobada');
    expect(estadoDe(4, [1, 2, 3])).toBe('actual');
    expect(estadoDe(5, [1, 2, 3])).toBe('bloqueada');
    expect(estadoDe(10, [1, 2, 3])).toBe('bloqueada');
  });

  it('con 1-8 aprobadas: la 9 es actual y el módulo razas (10) sigue bloqueado', () => {
    const aprobados = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(estadoDe(9, aprobados)).toBe('actual');
    expect(estadoDe(10, aprobados)).toBe('bloqueada');
  });

  it('FR-011: aprobar la etapa 9 desbloquea el módulo razas (10)', () => {
    const aprobados = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    expect(estadoDe(10, aprobados)).toBe('actual');
  });

  it('todo aprobado: todas aprobadas, ninguna actual', () => {
    const resultado = estados(NUMEROS);
    expect(resultado.every((e) => e.estado === 'aprobada')).toBe(true);
  });

  it('huecos {1,3}: la 2 es actual, la 3 se muestra aprobada y 4+ bloqueadas', () => {
    expect(estadoDe(1, [1, 3])).toBe('aprobada');
    expect(estadoDe(2, [1, 3])).toBe('actual');
    expect(estadoDe(3, [1, 3])).toBe('aprobada');
    expect(estadoDe(4, [1, 3])).toBe('bloqueada');
  });

  it('input desordenado: ordena por numero antes de aplicar la regla', () => {
    const resultado = calcularEstadosEtapas([10, 2, 1, 9, 3, 4, 5, 6, 7, 8], new Set([1]));
    expect(resultado.map((e) => e.numero)).toEqual(NUMEROS);
    expect(resultado[1]).toEqual({ numero: 2, estado: 'actual' });
  });

  it('lista vacía de etapas: retorna vacío', () => {
    expect(calcularEstadosEtapas([], new Set([1]))).toEqual([]);
  });
});

describe('puedeAbrirEtapa', () => {
  it('la actual y las aprobadas se pueden abrir; las bloqueadas no', () => {
    const aprobados = new Set([1, 2]);
    expect(puedeAbrirEtapa(1, aprobados)).toBe(true); // aprobada
    expect(puedeAbrirEtapa(3, aprobados)).toBe(true); // actual
    expect(puedeAbrirEtapa(4, aprobados)).toBe(false); // bloqueada
    expect(puedeAbrirEtapa(10, aprobados)).toBe(false);
  });

  it('sin aprobaciones solo se abre la 1', () => {
    expect(puedeAbrirEtapa(1, new Set())).toBe(true);
    expect(puedeAbrirEtapa(2, new Set())).toBe(false);
  });

  it('el módulo razas (10) se abre solo con 1-9 aprobadas', () => {
    expect(puedeAbrirEtapa(10, new Set([1, 2, 3, 4, 5, 6, 7, 8]))).toBe(false);
    expect(puedeAbrirEtapa(10, new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]))).toBe(true);
  });
});

describe('calcularAvance', () => {
  it('cuenta aprobadas sobre el total', () => {
    expect(calcularAvance(new Set(), 10)).toEqual({ aprobadas: 0, total: 10 });
    expect(calcularAvance(new Set([1, 2, 3]), 10)).toEqual({ aprobadas: 3, total: 10 });
    expect(calcularAvance(new Set(NUMEROS), 10)).toEqual({ aprobadas: 10, total: 10 });
  });
});
