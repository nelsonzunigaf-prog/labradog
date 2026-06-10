import { describe, it, expect } from 'vitest';
import {
  crearTutorSchema,
  actualizarTutorSchema,
  entrevistaSchema,
  anexoSchema,
} from './tutores';

const tutorValido = {
  nombre: 'Ana Pérez',
  telefono: '+56912345678',
  email: 'ana@example.cl',
  direccionRetiro: 'Av. Siempre Viva 123',
  planDefault: 'plus',
  cobroPeriodicidad: 'mensual',
  cobroTiempo: 'postpago',
  estado: 'activo',
};

describe('crearTutorSchema', () => {
  it('acepta una ficha válida', () => {
    expect(crearTutorSchema.safeParse(tutorValido).success).toBe(true);
  });

  it('acepta email vacío (el tutor no siempre tiene email)', () => {
    expect(crearTutorSchema.safeParse({ ...tutorValido, email: '' }).success).toBe(true);
  });

  it('rechaza plan fuera del catálogo', () => {
    expect(crearTutorSchema.safeParse({ ...tutorValido, planDefault: 'premium' }).success).toBe(
      false,
    );
  });

  it('rechaza nombre vacío y email malformado', () => {
    expect(crearTutorSchema.safeParse({ ...tutorValido, nombre: '' }).success).toBe(false);
    expect(crearTutorSchema.safeParse({ ...tutorValido, email: 'no-es-email' }).success).toBe(
      false,
    );
  });

  it('estado por defecto activo', () => {
    const { estado, ...sinEstado } = tutorValido;
    void estado;
    const r = crearTutorSchema.parse(sinEstado);
    expect(r.estado).toBe('activo');
  });
});

describe('actualizarTutorSchema', () => {
  it('exige id uuid y version entera no negativa', () => {
    expect(
      actualizarTutorSchema.safeParse({
        ...tutorValido,
        id: '550e8400-e29b-41d4-a716-446655440000',
        version: 1,
      }).success,
    ).toBe(true);
    expect(
      actualizarTutorSchema.safeParse({ ...tutorValido, id: 'no-uuid', version: 1 }).success,
    ).toBe(false);
    expect(
      actualizarTutorSchema.safeParse({
        ...tutorValido,
        id: '550e8400-e29b-41d4-a716-446655440000',
        version: -1,
      }).success,
    ).toBe(false);
  });
});

describe('entrevistaSchema', () => {
  const base = { id: '550e8400-e29b-41d4-a716-446655440000', version: 2 };

  it('acepta red flags de la taxonomía', () => {
    expect(
      entrevistaSchema.safeParse({ ...base, redFlags: ['presiona_tiempo', 'oculta_informacion'] })
        .success,
    ).toBe(true);
  });

  it('rechaza red flags fuera de la taxonomía', () => {
    expect(entrevistaSchema.safeParse({ ...base, redFlags: ['inventada'] }).success).toBe(false);
  });

  it('redFlags por defecto vacío', () => {
    expect(entrevistaSchema.parse(base).redFlags).toEqual([]);
  });
});

describe('anexoSchema', () => {
  it('acepta un anexo válido sin PDF', () => {
    expect(
      anexoSchema.safeParse({
        tutorId: '550e8400-e29b-41d4-a716-446655440000',
        tipo: 'limites_servicio',
        fechaAceptacion: '2026-06-09',
        medio: 'papel',
      }).success,
    ).toBe(true);
  });

  it('rechaza tipo de anexo desconocido', () => {
    expect(
      anexoSchema.safeParse({
        tutorId: '550e8400-e29b-41d4-a716-446655440000',
        tipo: 'otro',
        fechaAceptacion: '2026-06-09',
        medio: 'papel',
      }).success,
    ).toBe(false);
  });
});
