import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock de la librería de navegador: el pipeline real de canvas necesita DOM;
// aquí solo verificamos el contrato de opciones del método.
const { compressMock } = vi.hoisted(() => ({ compressMock: vi.fn() }));

vi.mock('browser-image-compression', () => ({ default: compressMock }));

import { comprimirImagen, OPCIONES_FOTO } from './comprimir-imagen';

describe('comprimirImagen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('llama a imageCompression con los defaults del método (WebP, ≤1600px, ≤400KB)', async () => {
    expect(OPCIONES_FOTO).toEqual({
      maxSizeMB: 0.4,
      maxWidthOrHeight: 1600,
      fileType: 'image/webp',
      useWebWorker: true,
    });

    const fileEntrada = { name: 'perro.jpg' } as unknown as File;
    const fileSalida = { name: 'perro.webp' } as unknown as File;
    compressMock.mockResolvedValue(fileSalida);

    const resultado = await comprimirImagen(fileEntrada);

    expect(compressMock).toHaveBeenCalledWith(fileEntrada, OPCIONES_FOTO);
    expect(resultado).toBe(fileSalida);
  });
});
