import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock del SDK de S3: las pruebas no tocan R2 real.
const { sendMock, s3ClientMock, putObjectCommandMock } = vi.hoisted(() => {
  const sendMock = vi.fn();
  // Funciones normales (no arrow): se invocan con `new` en storage.ts.
  const s3ClientMock = vi.fn(function () {
    return { send: sendMock };
  });
  const putObjectCommandMock = vi.fn(function (input: unknown) {
    return { input };
  });
  return { sendMock, s3ClientMock, putObjectCommandMock };
});

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: s3ClientMock,
  PutObjectCommand: putObjectCommandMock,
}));

import { subirArchivo, urlPublica } from './storage';

describe('subirArchivo (frontera con R2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('R2_ACCOUNT_ID', 'cuenta123');
    vi.stubEnv('R2_ACCESS_KEY_ID', 'ak');
    vi.stubEnv('R2_SECRET_ACCESS_KEY', 'sk');
    vi.stubEnv('R2_BUCKET', 'labradog-fotos');
    vi.stubEnv('R2_PUBLIC_URL', 'https://fotos.labradog.cl');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('con credenciales: arma PutObjectCommand correcto y resuelve con la URL pública', async () => {
    sendMock.mockResolvedValue({});
    const contenido = new Uint8Array([1, 2, 3]);

    const { url } = await subirArchivo({
      key: 'paseos/p1.webp',
      contenido,
      contentType: 'image/webp',
    });

    expect(putObjectCommandMock).toHaveBeenCalledWith({
      Bucket: 'labradog-fotos',
      Key: 'paseos/p1.webp',
      Body: contenido,
      ContentType: 'image/webp',
    });
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(url).toBe('https://fotos.labradog.cl/paseos/p1.webp');
  });

  it('reintenta ante fallo de red y resuelve en el segundo intento', async () => {
    sendMock
      .mockRejectedValueOnce(new Error('ECONNRESET')) // sin $metadata → reintentable
      .mockResolvedValueOnce({});

    const { url } = await subirArchivo({
      key: 'paseos/p2.webp',
      contenido: new Uint8Array([9]),
      contentType: 'image/webp',
    });

    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(url).toBe('https://fotos.labradog.cl/paseos/p2.webp');
  });

  it('NO reintenta ante 4xx y lanza', async () => {
    sendMock.mockRejectedValue({ $metadata: { httpStatusCode: 403 } });

    await expect(
      subirArchivo({ key: 'x.webp', contenido: new Uint8Array([0]), contentType: 'image/webp' }),
    ).rejects.toThrow(/Falló la subida a R2/);

    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it('urlPublica normaliza barras (trailing slash en base + leading slash en key)', () => {
    vi.stubEnv('R2_PUBLIC_URL', 'https://fotos.labradog.cl/');
    expect(urlPublica('/paseos/p1.webp')).toBe('https://fotos.labradog.cl/paseos/p1.webp');
    expect(urlPublica('paseos/p1.webp')).toBe('https://fotos.labradog.cl/paseos/p1.webp');
  });

  it('sin credenciales (dev): no-op, no llama a send y devuelve URL placeholder', async () => {
    vi.stubEnv('R2_ACCOUNT_ID', ''); // credenciales incompletas → no-op
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { url } = await subirArchivo({
      key: 'paseos/p3.webp',
      contenido: new Uint8Array([1]),
      contentType: 'image/webp',
    });

    expect(sendMock).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
    expect(url).toBe('https://fotos.labradog.cl/paseos/p3.webp');
    warn.mockRestore();
  });
});
