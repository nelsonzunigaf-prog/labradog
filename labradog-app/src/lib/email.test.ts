import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { enviarEmail, plantillaResetPassword } from './email';

describe('enviarEmail', () => {
  const envOriginal = process.env.RESEND_API_KEY;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.RESEND_API_KEY = envOriginal;
  });

  it('sin RESEND_API_KEY → no-op (no lanza, avisa por consola)', async () => {
    delete process.env.RESEND_API_KEY;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(
      enviarEmail({ to: 'x@y.cl', subject: 'Hola', html: '<p>hola</p>' }),
    ).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledOnce();
  });
});

describe('plantillaResetPassword', () => {
  it('incluye el nombre y la URL de restablecimiento', () => {
    const html = plantillaResetPassword('Nelson', 'https://app.cl/reset?token=abc');
    expect(html).toContain('Nelson');
    expect(html).toContain('https://app.cl/reset?token=abc');
  });
});
