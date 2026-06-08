import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mocks de las dependencias de las actions (no tocan BD ni Better Auth real).
const { getActorMock } = vi.hoisted(() => ({ getActorMock: vi.fn() }));
const { buscarPorEmailMock, crearCuentaEnEquipoMock, cambiarEstadoCuentaMock } = vi.hoisted(() => ({
  buscarPorEmailMock: vi.fn(),
  crearCuentaEnEquipoMock: vi.fn(),
  cambiarEstadoCuentaMock: vi.fn(),
}));
const { requestPasswordResetMock } = vi.hoisted(() => ({ requestPasswordResetMock: vi.fn() }));

vi.mock('@/lib/actor', () => ({ getActor: getActorMock }));
vi.mock('@/lib/auth', () => ({
  auth: { api: { requestPasswordReset: requestPasswordResetMock } },
}));
vi.mock('@/lib/db/queries/usuarios', () => ({
  buscarPorEmail: buscarPorEmailMock,
  crearCuentaEnEquipo: crearCuentaEnEquipoMock,
  cambiarEstadoCuenta: cambiarEstadoCuentaMock,
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { crearCuenta, desactivarCuenta } from './cuentas';

describe('actions de cuentas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getActorMock.mockResolvedValue({ id: 'admin1', rol: 'admin' });
  });

  it('crearCuenta: email ya existente → {ok:false} con mensaje claro', async () => {
    buscarPorEmailMock.mockResolvedValue({ id: 'u-existente' });

    const r = await crearCuenta({ nombre: 'Ana', email: 'Ana@Labradog.cl', rol: 'paseador' });

    expect(r).toEqual({ ok: false, error: 'Ya existe una cuenta con ese email.' });
    expect(crearCuentaEnEquipoMock).not.toHaveBeenCalled();
  });

  it('crearCuenta: flujo OK → crea, envía invitación y normaliza email', async () => {
    buscarPorEmailMock.mockResolvedValue(null);
    crearCuentaEnEquipoMock.mockResolvedValue({ id: 'u-nuevo' });

    const r = await crearCuenta({ nombre: '  Ana  ', email: 'Ana@Labradog.CL', rol: 'paseador' });

    expect(r).toEqual({ ok: true, data: { id: 'u-nuevo' } });
    expect(crearCuentaEnEquipoMock).toHaveBeenCalledWith(
      { email: 'ana@labradog.cl', nombre: 'Ana', rol: 'paseador' },
      { id: 'admin1', rol: 'admin' },
    );
    expect(requestPasswordResetMock).toHaveBeenCalledWith({
      body: { email: 'ana@labradog.cl', redirectTo: '/reset-password' },
    });
  });

  it('desactivarCuenta: no permite auto-desactivarse (AC6)', async () => {
    const r = await desactivarCuenta({ userId: 'admin1' });

    expect(r).toEqual({ ok: false, error: 'No puedes desactivar tu propia cuenta.' });
    expect(cambiarEstadoCuentaMock).not.toHaveBeenCalled();
  });

  it('desactivarCuenta: a otro usuario → OK', async () => {
    const r = await desactivarCuenta({ userId: 'otro' });

    expect(r).toEqual({ ok: true, data: { ok: true } });
    expect(cambiarEstadoCuentaMock).toHaveBeenCalledWith('otro', 'inactivo', {
      id: 'admin1',
      rol: 'admin',
    });
  });

  it('crearCuenta: rol no admin → {ok:false, No autorizado}', async () => {
    getActorMock.mockResolvedValue({ id: 'p1', rol: 'paseador' });

    const r = await crearCuenta({ nombre: 'Ana', email: 'ana@labradog.cl', rol: 'paseador' });

    expect(r).toEqual({ ok: false, error: 'No autorizado' });
    expect(crearCuentaEnEquipoMock).not.toHaveBeenCalled();
  });
});
