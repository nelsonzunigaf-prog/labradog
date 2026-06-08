import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock de la conexión a BD: las pruebas unitarias no tocan Neon
const { returningMock, valuesMock, insertMock } = vi.hoisted(() => {
  const returningMock = vi.fn();
  const valuesMock = vi.fn(() => ({ returning: returningMock }));
  const insertMock = vi.fn(() => ({ values: valuesMock }));
  return { returningMock, valuesMock, insertMock };
});

vi.mock('./index', () => ({
  db: { insert: insertMock },
}));

import { registrarEvento } from './eventos';
import { eventLog } from './schema';

describe('registrarEvento (writer tipado de event_log)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    returningMock.mockResolvedValue([
      {
        id: 1,
        tipo: 'sistema_inicializado',
        entidad: 'sistema',
        entidadId: '0',
        payload: { version: '0.1.0' },
        actorId: 'sistema',
        actorRol: 'sistema',
        createdAt: new Date('2026-06-06T12:00:00Z'),
      },
    ]);
  });

  it('inserta una fila en event_log con tipo, entidad, payload y actor (id + rol)', async () => {
    await registrarEvento(
      'sistema_inicializado',
      { tabla: 'sistema', id: '0' },
      { version: '0.1.0' },
      { id: 'sistema', rol: 'sistema' },
    );

    expect(insertMock).toHaveBeenCalledWith(eventLog);
    expect(valuesMock).toHaveBeenCalledWith({
      tipo: 'sistema_inicializado',
      entidad: 'sistema',
      entidadId: '0',
      payload: { version: '0.1.0' },
      actorId: 'sistema',
      actorRol: 'sistema',
    });
  });

  it('lanza si la inserción no retorna fila (fallo silencioso del driver)', async () => {
    returningMock.mockResolvedValue([]);

    await expect(
      registrarEvento(
        'sistema_inicializado',
        { tabla: 'sistema', id: '0' },
        { version: '0.1.0' },
        { id: 'sistema', rol: 'sistema' },
      ),
    ).rejects.toThrow('no retornó fila');
  });

  it('retorna la fila insertada', async () => {
    const fila = await registrarEvento(
      'sistema_inicializado',
      { tabla: 'sistema', id: '0' },
      { version: '0.1.0' },
      { id: 'sistema', rol: 'sistema' },
    );

    expect(fila.id).toBe(1);
    expect(fila.tipo).toBe('sistema_inicializado');
  });

  it('usa el ejecutor pasado (tx) en vez del db global, para auditoría atómica', async () => {
    const txReturning = vi.fn().mockResolvedValue([{ id: 9, tipo: 'cuenta_creada' }]);
    const txValues = vi.fn(() => ({ returning: txReturning }));
    const txInsert = vi.fn(() => ({ values: txValues }));
    const tx = { insert: txInsert } as unknown as Parameters<
      Parameters<typeof import('./index').db.transaction>[0]
    >[0];

    await registrarEvento(
      'cuenta_creada',
      { tabla: 'user', id: 'u1' },
      { email: 'x@y.cl', rol: 'paseador' },
      { id: 'admin1', rol: 'admin' },
      tx,
    );

    expect(txInsert).toHaveBeenCalledWith(eventLog);
    expect(insertMock).not.toHaveBeenCalled(); // NO tocó el db global
  });

  it('rechaza tipos de evento desconocidos y payloads incorrectos a nivel de tipos', async () => {
    const llamadaTipoInvalido = () =>
      registrarEvento(
        // @ts-expect-error — tipo de evento no registrado en el catálogo
        'evento_inventado',
        { tabla: 'sistema', id: '0' },
        {},
        { id: 'sistema', rol: 'sistema' },
      );

    const llamadaPayloadInvalido = () =>
      registrarEvento(
        'sistema_inicializado',
        { tabla: 'sistema', id: '0' },
        // @ts-expect-error — payload no coincide con el contrato del evento
        { campoInexistente: true },
        { id: 'sistema', rol: 'sistema' },
      );

    // Las funciones existen (la validación es en compilación, no en runtime)
    expect(typeof llamadaTipoInvalido).toBe('function');
    expect(typeof llamadaPayloadInvalido).toBe('function');
  });
});
