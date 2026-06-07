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
        createdAt: new Date('2026-06-06T12:00:00Z'),
      },
    ]);
  });

  it('inserta una fila en event_log con tipo, entidad, payload y actor', async () => {
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
    });
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

  it('rechaza tipos de evento desconocidos y payloads incorrectos a nivel de tipos', async () => {
    // @ts-expect-error — tipo de evento no registrado en el catálogo
    const llamadaTipoInvalido = () =>
      registrarEvento(
        'evento_inventado',
        { tabla: 'sistema', id: '0' },
        {},
        { id: 'sistema', rol: 'sistema' },
      );

    // @ts-expect-error — payload no coincide con el contrato del evento
    const llamadaPayloadInvalido = () =>
      registrarEvento(
        'sistema_inicializado',
        { tabla: 'sistema', id: '0' },
        { campoInexistente: true },
        { id: 'sistema', rol: 'sistema' },
      );

    // Las funciones existen (la validación es en compilación, no en runtime)
    expect(typeof llamadaTipoInvalido).toBe('function');
    expect(typeof llamadaPayloadInvalido).toBe('function');
  });
});
