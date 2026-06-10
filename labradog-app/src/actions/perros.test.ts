import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getActorMock } = vi.hoisted(() => ({ getActorMock: vi.fn() }));
const {
  crearPerroMock,
  actualizarPerroMock,
  marcarCompatibilidadMock,
  quitarCompatibilidadMock,
  actualizarFotoPerroMock,
  ErrorDistintoTutorMock,
} = vi.hoisted(() => {
  class ErrorDistintoTutorMock extends Error {}
  return {
    crearPerroMock: vi.fn(),
    actualizarPerroMock: vi.fn(),
    marcarCompatibilidadMock: vi.fn(),
    quitarCompatibilidadMock: vi.fn(),
    actualizarFotoPerroMock: vi.fn(),
    ErrorDistintoTutorMock,
  };
});
const { obtenerTutorMock } = vi.hoisted(() => ({ obtenerTutorMock: vi.fn() }));

vi.mock('@/lib/actor', () => ({ getActor: getActorMock }));
vi.mock('@/lib/db/queries/perros', () => ({
  crearPerro: crearPerroMock,
  actualizarPerro: actualizarPerroMock,
  marcarCompatibilidad: marcarCompatibilidadMock,
  quitarCompatibilidad: quitarCompatibilidadMock,
  actualizarFotoPerro: actualizarFotoPerroMock,
  ErrorDistintoTutor: ErrorDistintoTutorMock,
}));
vi.mock('@/lib/db/queries/tutores', () => ({ obtenerTutor: obtenerTutorMock }));
vi.mock('@/lib/storage', () => ({ subirArchivo: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { actualizarPerro, crearPerro, marcarCompatibilidad } from './perros';

const UUID_A = '550e8400-e29b-41d4-a716-446655440000';
const UUID_B = '550e8400-e29b-41d4-a716-446655440001';

const perroValido = {
  tutorId: UUID_A,
  nombre: 'Kira',
  raza: 'Border Collie',
  grupoRaza: 'pastora' as const,
  talla: 'mediana' as const,
  notasCriticas: false,
  estado: 'activo' as const,
};

describe('actions de perros', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getActorMock.mockResolvedValue({ id: 'admin1', rol: 'admin' });
  });

  it('crearPerro: flujo OK → {ok:true, data:{id}}', async () => {
    obtenerTutorMock.mockResolvedValue({ id: UUID_A });
    crearPerroMock.mockResolvedValue({ id: 'perro-nuevo' });

    const r = await crearPerro(perroValido);

    expect(r).toEqual({ ok: true, data: { id: 'perro-nuevo' } });
  });

  it('crearPerro: tutor inexistente → {ok:false}', async () => {
    obtenerTutorMock.mockResolvedValue(null);

    const r = await crearPerro(perroValido);

    expect(r).toEqual({ ok: false, error: 'El tutor no existe.' });
    expect(crearPerroMock).not.toHaveBeenCalled();
  });

  it('actualizarPerro: conflicto de version → "Este registro cambió, recarga." (AC2)', async () => {
    actualizarPerroMock.mockResolvedValue(null);

    const r = await actualizarPerro({ ...perroValido, tutorId: undefined, id: UUID_A, version: 1 });

    expect(r).toEqual({ ok: false, error: 'Este registro cambió, recarga.' });
  });

  it('marcarCompatibilidad: perros de distinto tutor → mensaje de negocio (AC4)', async () => {
    marcarCompatibilidadMock.mockRejectedValue(new ErrorDistintoTutorMock());

    const r = await marcarCompatibilidad({ perroAId: UUID_A, perroBId: UUID_B });

    expect(r).toEqual({
      ok: false,
      error: 'Solo se puede marcar compatibilidad entre perros del mismo tutor.',
    });
  });

  it('marcarCompatibilidad: mismo perro → rechazado por schema', async () => {
    const r = await marcarCompatibilidad({ perroAId: UUID_A, perroBId: UUID_A });

    expect(r.ok).toBe(false);
    expect(marcarCompatibilidadMock).not.toHaveBeenCalled();
  });

  it('crearPerro: rol paseador → No autorizado', async () => {
    getActorMock.mockResolvedValue({ id: 'p1', rol: 'paseador' });

    const r = await crearPerro(perroValido);

    expect(r).toEqual({ ok: false, error: 'No autorizado' });
  });
});
