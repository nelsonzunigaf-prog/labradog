'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eyebrow } from '@/components/marca/primitivas';
import { authClient } from '@/lib/auth-client';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  if (!token) {
    return (
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-[1.5rem] border border-border bg-card p-6 text-center shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <h2 className="text-2xl font-semibold tracking-tight">Enlace inválido</h2>
        <p className="text-sm text-muted-foreground">
          El enlace de restablecimiento no es válido o ya venció.
        </p>
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Solicitar uno nuevo
        </Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setCargando(true);
    const { error } = await authClient.resetPassword({ newPassword: password, token: token! });

    if (error) {
      setError('No se pudo restablecer la contraseña. El enlace pudo haber vencido.');
      setCargando(false);
      return;
    }

    router.replace('/login');
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full max-w-sm flex-col gap-4 rounded-[1.5rem] border border-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
    >
      <div className="flex flex-col gap-1 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Nueva contraseña</h2>
        <p className="text-sm text-muted-foreground">Elige una contraseña segura</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Nueva contraseña</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          className="min-h-12"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmar">Confirmar contraseña</Label>
        <Input
          id="confirmar"
          type="password"
          autoComplete="new-password"
          required
          className="min-h-12"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-destructive-text">{error}</p>}

      <Button
        type="submit"
        disabled={cargando}
        className="min-h-12 rounded-full shadow-[0_10px_15px_-3px_rgba(6,78,59,0.4)] hover:bg-primary-hover"
      >
        {cargando ? 'Guardando…' : 'Restablecer contraseña'}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-secondary-ink">
            Labradog 🐾
          </h1>
          <Eyebrow>Recuperar acceso</Eyebrow>
        </div>
        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
