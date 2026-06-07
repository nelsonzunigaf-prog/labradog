import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock de la sesión de Better Auth y de next/headers (sin servidor real).
const { getSessionMock } = vi.hoisted(() => ({ getSessionMock: vi.fn() }));

vi.mock('./auth', () => ({
  auth: { api: { getSession: getSessionMock } },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

import { getActor } from './actor';

describe('getActor (sesión real de Better Auth)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sin sesión → null', async () => {
    getSessionMock.mockResolvedValue(null);
    expect(await getActor()).toBeNull();
  });

  it('sesión válida y activa → {id, rol}', async () => {
    getSessionMock.mockResolvedValue({
      user: { id: 'u1', rol: 'admin', estado: 'activo' },
    });
    expect(await getActor()).toEqual({ id: 'u1', rol: 'admin' });
  });

  it('mapea rol paseador', async () => {
    getSessionMock.mockResolvedValue({
      user: { id: 'u2', rol: 'paseador', estado: 'activo' },
    });
    expect(await getActor()).toEqual({ id: 'u2', rol: 'paseador' });
  });

  it('cuenta con estado != activo → null (soft-delete)', async () => {
    getSessionMock.mockResolvedValue({
      user: { id: 'u3', rol: 'paseador', estado: 'inactivo' },
    });
    expect(await getActor()).toBeNull();
  });
});
