import { describe, it, expect } from 'vitest';
import { aInstanteUtc, aFechaLocal, esFeriado, formatearLocal } from './fechas';

describe('fechas — zona horaria America/Santiago (inmune a DST)', () => {
  it('verano (UTC−3): 2026-01-15 12:00 local → 15:00 UTC', () => {
    expect(aInstanteUtc('2026-01-15', '12:00').toISOString()).toBe('2026-01-15T15:00:00.000Z');
  });

  it('invierno (UTC−4): 2026-07-15 12:00 local → 16:00 UTC', () => {
    expect(aInstanteUtc('2026-07-15', '12:00').toISOString()).toBe('2026-07-15T16:00:00.000Z');
  });

  it('hora por defecto 00:00 cuando no se pasa', () => {
    // 2026-07-01 está en invierno (UTC−4) → 00:00 local = 04:00 UTC
    expect(aInstanteUtc('2026-07-01').toISOString()).toBe('2026-07-01T04:00:00.000Z');
  });

  it('borde fin de verano (sáb 4-abr-2026): 3-abr es −3 y 5-abr es −4', () => {
    // Antes del cambio (verano, −3)
    expect(aInstanteUtc('2026-04-03', '12:00').toISOString()).toBe('2026-04-03T15:00:00.000Z');
    // Después del cambio (invierno, −4)
    expect(aInstanteUtc('2026-04-05', '12:00').toISOString()).toBe('2026-04-05T16:00:00.000Z');
  });

  it('borde inicio de verano (sáb 5-sep-2026): 4-sep es −4 y 6-sep es −3', () => {
    // Antes del cambio (invierno, −4)
    expect(aInstanteUtc('2026-09-04', '12:00').toISOString()).toBe('2026-09-04T16:00:00.000Z');
    // Después del cambio (verano, −3)
    expect(aInstanteUtc('2026-09-06', '12:00').toISOString()).toBe('2026-09-06T15:00:00.000Z');
  });

  it('round-trip aFechaLocal(aInstanteUtc(fecha)) preserva la fecha local', () => {
    expect(aFechaLocal(aInstanteUtc('2026-07-15', '12:00'))).toBe('2026-07-15');
    expect(aFechaLocal(aInstanteUtc('2026-01-15', '00:00'))).toBe('2026-01-15');
  });

  it('aFechaLocal usa la fecha local Santiago, no UTC (cruce de medianoche)', () => {
    // 2026-07-16 00:00 local (−4) = 2026-07-16T04:00:00Z; la fecha local sigue siendo 16
    const instante = aInstanteUtc('2026-07-16', '00:00');
    expect(instante.toISOString()).toBe('2026-07-16T04:00:00.000Z');
    expect(aFechaLocal(instante)).toBe('2026-07-16');
  });

  it('rechaza formatos fuera de YYYY-MM-DD / HH:mm en vez de truncar en silencio', () => {
    expect(() => aInstanteUtc('2026-07-15', '12:00:30')).toThrow(/Formato esperado/);
    expect(() => aInstanteUtc('2026-07-15T12:00')).toThrow(); // 'T' → NaN, rechazado
    expect(() => aInstanteUtc('2026/07/15', '12:00')).toThrow();
  });

  it('formatearLocal renderiza en hora de Santiago', () => {
    // 2026-01-15T15:00:00Z = 12:00 local (verano −3)
    expect(formatearLocal(new Date('2026-01-15T15:00:00.000Z'))).toBe('15-01-2026 12:00');
  });
});

describe('fechas — feriados de Chile', () => {
  it('reconoce un feriado conocido (Independencia 18-sep-2026)', () => {
    expect(esFeriado('2026-09-18')).toBe(true);
  });

  it('un día hábil no es feriado', () => {
    expect(esFeriado('2026-09-17')).toBe(false);
  });

  it('incluye feriados móviles resueltos por año (Viernes Santo 2026 y 2027)', () => {
    expect(esFeriado('2026-04-03')).toBe(true);
    expect(esFeriado('2027-03-26')).toBe(true);
  });
});
