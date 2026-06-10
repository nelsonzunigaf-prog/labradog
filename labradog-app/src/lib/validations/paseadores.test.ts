import { describe, it, expect } from 'vitest';
import { actualizarFichaPaseadorSchema, fichaPaseadorSchema } from './paseadores';

const fichaValida = {
  userId: 'user-abc',
  telefono: '+56955556666',
  especialidades: ['energetica', 'senior'],
  comisionPct: 70,
};

describe('fichaPaseadorSchema', () => {
  it('acepta una ficha válida y aplica defaults', () => {
    const r = fichaPaseadorSchema.parse({ ...fichaValida, especialidades: undefined });
    expect(r.especialidades).toEqual([]);
  });

  it('acepta los bordes del rango de comisión (60 y 80)', () => {
    expect(fichaPaseadorSchema.safeParse({ ...fichaValida, comisionPct: 60 }).success).toBe(true);
    expect(fichaPaseadorSchema.safeParse({ ...fichaValida, comisionPct: 80 }).success).toBe(true);
  });

  it('rechaza comisión fuera del rango con el mensaje del método', () => {
    const r59 = fichaPaseadorSchema.safeParse({ ...fichaValida, comisionPct: 59 });
    const r81 = fichaPaseadorSchema.safeParse({ ...fichaValida, comisionPct: 81 });
    expect(r59.success).toBe(false);
    expect(r81.success).toBe(false);
    if (!r59.success) {
      expect(r59.error.issues[0]?.message).toBe('La comisión va de 60 a 80');
    }
  });

  it('rechaza comisión decimal', () => {
    const r = fichaPaseadorSchema.safeParse({ ...fichaValida, comisionPct: 70.5 });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0]?.message).toBe('La comisión debe ser un entero');
    }
  });

  it('rechaza especialidad fuera de la taxonomía', () => {
    expect(
      fichaPaseadorSchema.safeParse({ ...fichaValida, especialidades: ['acuatica'] }).success,
    ).toBe(false);
  });

  it('rechaza teléfono vacío', () => {
    expect(fichaPaseadorSchema.safeParse({ ...fichaValida, telefono: '' }).success).toBe(false);
  });
});

describe('actualizarFichaPaseadorSchema', () => {
  it('exige id uuid y version; no acepta userId (la ficha no cambia de cuenta)', () => {
    const { userId, ...sinUser } = fichaValida;
    void userId;
    expect(
      actualizarFichaPaseadorSchema.safeParse({
        ...sinUser,
        id: '550e8400-e29b-41d4-a716-446655440000',
        version: 1,
      }).success,
    ).toBe(true);
    expect(
      actualizarFichaPaseadorSchema.safeParse({ ...sinUser, id: 'no-uuid', version: 1 }).success,
    ).toBe(false);
  });
});
