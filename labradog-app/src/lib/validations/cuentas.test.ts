import { describe, expect, it } from 'vitest';
import { crearCuentaSchema } from './cuentas';

describe('crearCuentaSchema', () => {
  it('acepta datos válidos', () => {
    const r = crearCuentaSchema.safeParse({
      nombre: 'Ana',
      email: 'ana@labradog.cl',
      rol: 'paseador',
    });
    expect(r.success).toBe(true);
  });

  it('rechaza email inválido', () => {
    const r = crearCuentaSchema.safeParse({ nombre: 'Ana', email: 'no-es-email', rol: 'admin' });
    expect(r.success).toBe(false);
  });

  it('rechaza nombre vacío', () => {
    const r = crearCuentaSchema.safeParse({ nombre: '', email: 'a@b.cl', rol: 'admin' });
    expect(r.success).toBe(false);
  });

  it('rechaza rol fuera del enum', () => {
    const r = crearCuentaSchema.safeParse({ nombre: 'Ana', email: 'a@b.cl', rol: 'superadmin' });
    expect(r.success).toBe(false);
  });
});
