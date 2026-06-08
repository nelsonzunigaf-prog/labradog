import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

// Mock del proveedor de sesión (Story 1.2 lo conecta a Better Auth)
const { getActorMock } = vi.hoisted(() => ({ getActorMock: vi.fn() }));

vi.mock('./actor', () => ({
  getActor: getActorMock,
}));

import { crearAction, ErrorNegocio } from './action-wrapper';

const schemaPrueba = z.object({ nombre: z.string().min(1) });

describe('crearAction (wrapper estándar de Server Action)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('input inválido → {ok:false} con mensaje y NO ejecuta el handler', async () => {
    const handler = vi.fn();
    const action = crearAction({ schema: schemaPrueba, roles: ['admin'], handler });

    const resultado = await action({ nombre: '' });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error).toBeTruthy();
    expect(handler).not.toHaveBeenCalled();
  });

  it('sin sesión → {ok:false, error: "No autenticado"}', async () => {
    getActorMock.mockResolvedValue(null);
    const handler = vi.fn();
    const action = crearAction({ schema: schemaPrueba, roles: ['admin'], handler });

    const resultado = await action({ nombre: 'Rocky' });

    expect(resultado).toEqual({ ok: false, error: 'No autenticado' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('rol no permitido → {ok:false, error: "No autorizado"}', async () => {
    getActorMock.mockResolvedValue({ id: 'u1', rol: 'paseador' });
    const handler = vi.fn();
    const action = crearAction({ schema: schemaPrueba, roles: ['admin'], handler });

    const resultado = await action({ nombre: 'Rocky' });

    expect(resultado).toEqual({ ok: false, error: 'No autorizado' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('flujo correcto → {ok:true, data} y el handler recibe input validado + actor', async () => {
    const actor = { id: 'u1', rol: 'admin' as const };
    getActorMock.mockResolvedValue(actor);
    const handler = vi.fn().mockResolvedValue({ id: 'perro-1' });
    const action = crearAction({ schema: schemaPrueba, roles: ['admin'], handler });

    const resultado = await action({ nombre: 'Rocky' });

    expect(resultado).toEqual({ ok: true, data: { id: 'perro-1' } });
    expect(handler).toHaveBeenCalledWith({ nombre: 'Rocky' }, actor);
  });

  it('handler lanza excepción → {ok:false}, nunca throw hacia la UI', async () => {
    getActorMock.mockResolvedValue({ id: 'u1', rol: 'admin' });
    const handler = vi.fn().mockRejectedValue(new Error('explotó la BD'));
    const action = crearAction({ schema: schemaPrueba, roles: ['admin'], handler });

    const resultado = await action({ nombre: 'Rocky' });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error).toBeTruthy();
  });

  it('ErrorNegocio del handler → su mensaje se muestra tal cual', async () => {
    getActorMock.mockResolvedValue({ id: 'u1', rol: 'admin' });
    const handler = vi.fn().mockRejectedValue(new ErrorNegocio('Regla violada: X'));
    const action = crearAction({ schema: schemaPrueba, roles: ['admin'], handler });

    const resultado = await action({ nombre: 'Rocky' });

    expect(resultado).toEqual({ ok: false, error: 'Regla violada: X' });
  });

  it('acepta múltiples roles permitidos', async () => {
    getActorMock.mockResolvedValue({ id: 'u2', rol: 'paseador' });
    const handler = vi.fn().mockResolvedValue('ok');
    const action = crearAction({
      schema: schemaPrueba,
      roles: ['admin', 'paseador'],
      handler,
    });

    const resultado = await action({ nombre: 'Luna' });

    expect(resultado).toEqual({ ok: true, data: 'ok' });
  });
});
