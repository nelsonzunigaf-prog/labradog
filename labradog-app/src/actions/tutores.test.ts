import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getActorMock } = vi.hoisted(() => ({ getActorMock: vi.fn() }));
const { crearTutorMock, actualizarTutorMock, registrarEntrevistaMock, registrarAnexoMock } =
  vi.hoisted(() => ({
    crearTutorMock: vi.fn(),
    actualizarTutorMock: vi.fn(),
    registrarEntrevistaMock: vi.fn(),
    registrarAnexoMock: vi.fn(),
  }));

vi.mock('@/lib/actor', () => ({ getActor: getActorMock }));
vi.mock('@/lib/db/queries/tutores', () => ({
  crearTutor: crearTutorMock,
  actualizarTutor: actualizarTutorMock,
  registrarEntrevista: registrarEntrevistaMock,
  registrarAnexo: registrarAnexoMock,
}));
vi.mock('@/lib/storage', () => ({ subirArchivo: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { actualizarTutor, crearTutor } from './tutores';

const fichaValida = {
  nombre: 'Ana Pérez',
  telefono: '+56912345678',
  email: 'ana@example.cl',
  direccionRetiro: 'Av. Siempre Viva 123',
  planDefault: 'plus' as const,
  cobroPeriodicidad: 'mensual' as const,
  cobroTiempo: 'postpago' as const,
  estado: 'activo' as const,
};
const ID = '550e8400-e29b-41d4-a716-446655440000';

describe('actions de tutores', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getActorMock.mockResolvedValue({ id: 'admin1', rol: 'admin' });
  });

  it('crearTutor: flujo OK → {ok:true, data:{id}}', async () => {
    crearTutorMock.mockResolvedValue({ id: 'tutor-nuevo' });

    const r = await crearTutor(fichaValida);

    expect(r).toEqual({ ok: true, data: { id: 'tutor-nuevo' } });
    expect(crearTutorMock).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Ana Pérez', planDefault: 'plus' }),
      { id: 'admin1', rol: 'admin' },
    );
  });

  it('actualizarTutor: conflicto de version → {ok:false} "Este registro cambió, recarga." (AC2)', async () => {
    actualizarTutorMock.mockResolvedValue(null); // version obsoleta

    const r = await actualizarTutor({ ...fichaValida, id: ID, version: 1 });

    expect(r).toEqual({ ok: false, error: 'Este registro cambió, recarga.' });
  });

  it('actualizarTutor: version vigente → {ok:true}', async () => {
    actualizarTutorMock.mockResolvedValue({ id: ID });

    const r = await actualizarTutor({ ...fichaValida, id: ID, version: 3 });

    expect(r).toEqual({ ok: true, data: { id: ID } });
  });

  it('crearTutor: rol no admin → {ok:false, No autorizado}', async () => {
    getActorMock.mockResolvedValue({ id: 'p1', rol: 'paseador' });

    const r = await crearTutor(fichaValida);

    expect(r).toEqual({ ok: false, error: 'No autorizado' });
    expect(crearTutorMock).not.toHaveBeenCalled();
  });
});
