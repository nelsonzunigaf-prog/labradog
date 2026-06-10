import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getActorMock } = vi.hoisted(() => ({ getActorMock: vi.fn() }));
const { crearFichaMock, actualizarFichaMock, ErrorCuentaInvalidaMock } = vi.hoisted(() => {
  class ErrorCuentaInvalidaMock extends Error {}
  return {
    crearFichaMock: vi.fn(),
    actualizarFichaMock: vi.fn(),
    ErrorCuentaInvalidaMock,
  };
});

vi.mock('@/lib/actor', () => ({ getActor: getActorMock }));
vi.mock('@/lib/db/queries/paseadores', () => ({
  crearFichaPaseador: crearFichaMock,
  actualizarFichaPaseador: actualizarFichaMock,
  ErrorCuentaInvalida: ErrorCuentaInvalidaMock,
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { actualizarFichaPaseador, crearFichaPaseador } from './paseadores';

const fichaValida = {
  userId: 'user-abc',
  telefono: '+56955556666',
  especialidades: ['energetica' as const],
  comisionPct: 70,
};
const ID = '550e8400-e29b-41d4-a716-446655440000';

describe('actions de paseadores', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getActorMock.mockResolvedValue({ id: 'admin1', rol: 'admin' });
  });

  it('crearFichaPaseador: flujo OK → {ok:true, data:{id}}', async () => {
    crearFichaMock.mockResolvedValue({ id: 'ficha-nueva' });

    const r = await crearFichaPaseador(fichaValida);

    expect(r).toEqual({ ok: true, data: { id: 'ficha-nueva' } });
  });

  it('crearFichaPaseador: comisión 85 → rechazada por schema (AC3), sin tocar la query', async () => {
    const r = await crearFichaPaseador({ ...fichaValida, comisionPct: 85 });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('La comisión va de 60 a 80');
    expect(crearFichaMock).not.toHaveBeenCalled();
  });

  it('crearFichaPaseador: cuenta inválida → mensaje de negocio', async () => {
    crearFichaMock.mockRejectedValue(new ErrorCuentaInvalidaMock());

    const r = await crearFichaPaseador(fichaValida);

    expect(r).toEqual({ ok: false, error: 'La cuenta no existe o no es de un paseador.' });
  });

  it('crearFichaPaseador: ficha duplicada (unique violation) → mensaje claro', async () => {
    crearFichaMock.mockRejectedValue(
      Object.assign(new Error('duplicate key value violates unique constraint'), {
        code: '23505',
      }),
    );

    const r = await crearFichaPaseador(fichaValida);

    expect(r).toEqual({ ok: false, error: 'Esta cuenta ya tiene ficha.' });
  });

  it('actualizarFichaPaseador: conflicto de version → "Este registro cambió, recarga."', async () => {
    actualizarFichaMock.mockResolvedValue(null);

    const r = await actualizarFichaPaseador({
      telefono: '+56955556666',
      especialidades: [],
      comisionPct: 75,
      id: ID,
      version: 1,
    });

    expect(r).toEqual({ ok: false, error: 'Este registro cambió, recarga.' });
  });

  it('rol paseador → No autorizado', async () => {
    getActorMock.mockResolvedValue({ id: 'p1', rol: 'paseador' });

    const r = await crearFichaPaseador(fichaValida);

    expect(r).toEqual({ ok: false, error: 'No autorizado' });
    expect(crearFichaMock).not.toHaveBeenCalled();
  });
});
