'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eyebrow } from '@/components/marca/primitivas';
import { authClient } from '@/lib/auth-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);

    // El destino del enlace del email apunta a /reset-password.
    await authClient.requestPasswordReset({
      email,
      redirectTo: '/reset-password',
    });

    // Mensaje genérico siempre: no revelar si la cuenta existe.
    setEnviado(true);
    setCargando(false);
  }

  if (enviado) {
    return (
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="flex w-full max-w-sm flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-secondary-ink">
              Labradog 🐾
            </h1>
            <Eyebrow>Recuperar acceso</Eyebrow>
          </div>
          <div className="flex w-full flex-col gap-4 rounded-[1.5rem] border border-border bg-card p-6 text-center shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <h2 className="text-2xl font-semibold tracking-tight">Revisa tu correo</h2>
            <p className="text-sm text-muted-foreground">
              Si existe una cuenta con ese email, enviamos instrucciones para
              restablecer tu contraseña.
            </p>
            <Link
              href="/login"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-secondary-ink">
            Labradog 🐾
          </h1>
          <Eyebrow>Recuperar acceso</Eyebrow>
        </div>
        <form
          onSubmit={onSubmit}
          className="flex w-full flex-col gap-4 rounded-[1.5rem] border border-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
        >
          <div className="flex flex-col gap-1 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Recuperar contraseña</h2>
            <p className="text-sm text-muted-foreground">
              Te enviaremos un enlace para restablecerla
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              className="min-h-12"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            disabled={cargando}
            className="min-h-12 rounded-full shadow-[0_10px_15px_-3px_rgba(6,78,59,0.4)] hover:bg-primary-hover"
          >
            {cargando ? 'Enviando…' : 'Enviar enlace'}
          </Button>

          <Link
            href="/login"
            className="text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Volver al inicio de sesión
          </Link>
        </form>
      </div>
    </main>
  );
}
