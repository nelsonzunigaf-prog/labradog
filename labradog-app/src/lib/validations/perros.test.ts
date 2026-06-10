import { describe, it, expect } from 'vitest';
import { actualizarPerroSchema, compatibilidadSchema, crearPerroSchema } from './perros';

const UUID_A = '550e8400-e29b-41d4-a716-446655440000';
const UUID_B = '550e8400-e29b-41d4-a716-446655440001';

const perroValido = {
  tutorId: UUID_A,
  nombre: 'Kira',
  raza: 'Border Collie',
  grupoRaza: 'pastora',
  edad: 3,
  talla: 'mediana',
};

describe('crearPerroSchema', () => {
  it('acepta un perro válido y aplica defaults', () => {
    const r = crearPerroSchema.parse(perroValido);
    expect(r.notasCriticas).toBe(false);
    expect(r.estado).toBe('activo');
  });

  it('rechaza grupo de raza fuera de la taxonomía', () => {
    expect(crearPerroSchema.safeParse({ ...perroValido, grupoRaza: 'toy' }).success).toBe(false);
  });

  it('rechaza talla inválida', () => {
    expect(crearPerroSchema.safeParse({ ...perroValido, talla: 'gigante' }).success).toBe(false);
  });

  it('rechaza edad negativa o irreal; acepta sin edad', () => {
    expect(crearPerroSchema.safeParse({ ...perroValido, edad: -1 }).success).toBe(false);
    expect(crearPerroSchema.safeParse({ ...perroValido, edad: 100 }).success).toBe(false);
    const { edad, ...sinEdad } = perroValido;
    void edad;
    expect(crearPerroSchema.safeParse(sinEdad).success).toBe(true);
  });

  it('rechaza nombre o raza vacíos', () => {
    expect(crearPerroSchema.safeParse({ ...perroValido, nombre: '' }).success).toBe(false);
    expect(crearPerroSchema.safeParse({ ...perroValido, raza: '' }).success).toBe(false);
  });
});

describe('actualizarPerroSchema', () => {
  it('exige id y version; no acepta tutorId (el perro no cambia de tutor)', () => {
    const { tutorId, ...sinTutor } = perroValido;
    void tutorId;
    expect(
      actualizarPerroSchema.safeParse({ ...sinTutor, id: UUID_A, version: 2 }).success,
    ).toBe(true);
    expect(
      actualizarPerroSchema.safeParse({ ...sinTutor, id: UUID_A, version: -1 }).success,
    ).toBe(false);
  });
});

describe('compatibilidadSchema', () => {
  it('acepta dos perros distintos', () => {
    expect(compatibilidadSchema.safeParse({ perroAId: UUID_A, perroBId: UUID_B }).success).toBe(
      true,
    );
  });

  it('rechaza compatibilidad consigo mismo', () => {
    expect(compatibilidadSchema.safeParse({ perroAId: UUID_A, perroBId: UUID_A }).success).toBe(
      false,
    );
  });
});
