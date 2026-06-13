'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { crearCuenta } from '@/actions/cuentas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { crearCuentaSchema } from '@/lib/validations/cuentas';

export function FormCrearCuenta() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<'admin' | 'paseador'>('paseador');
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMensaje(null);

    const parseado = crearCuentaSchema.safeParse({ nombre, email, rol });
    if (!parseado.success) {
      setMensaje({ tipo: 'error', texto: parseado.error.issues[0]?.message ?? 'Datos inválidos' });
      return;
    }

    setCargando(true);
    const r = await crearCuenta(parseado.data);
    setCargando(false);

    if (!r.ok) {
      setMensaje({ tipo: 'error', texto: r.error });
      return;
    }

    setMensaje({ tipo: 'ok', texto: 'Cuenta creada. Se envió la invitación por email.' });
    setNombre('');
    setEmail('');
    setRol('paseador');
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 self-start rounded-2xl border bg-card p-4 shadow-sm"
    >
      <h2 className="text-base font-semibold">Nueva cuenta</h2>

      <div className="flex flex-col gap-2">
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="rol">Rol</Label>
        <select
          id="rol"
          value={rol}
          onChange={(e) => setRol(e.target.value as 'admin' | 'paseador')}
          className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm"
        >
          <option value="paseador">Paseador</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {mensaje && (
        <p
          className={
            mensaje.tipo === 'ok' ? 'text-sm text-success' : 'text-sm text-destructive-text'
          }
        >
          {mensaje.texto}
        </p>
      )}

      <Button type="submit" disabled={cargando}>
        {cargando ? 'Creando…' : 'Crear e invitar'}
      </Button>
    </form>
  );
}
