'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    const { data, error } = await authClient.signIn.email({ email, password });

    if (error || !data) {
      setError('Email o contraseña incorrectos.');
      setCargando(false);
      return;
    }

    // El rol decide el área. Si el proxy guardó un destino, respetarlo solo si
    // coincide con el rol; si no, mandar al home del rol.
    const rol = (data.user as { rol?: string }).rol;
    const destinoSolicitado = searchParams.get('redirigir');
    const home = rol === 'admin' ? '/admin' : '/paseador';
    const destino =
      destinoSolicitado && destinoSolicitado.startsWith(home) ? destinoSolicitado : home;

    router.replace(destino);
  }

  return (
      <form
        onSubmit={onSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-border bg-background p-6"
      >
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Labradog 🐾</h1>
          <p className="text-sm text-muted-foreground">Inicia sesión para continuar</p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={cargando}>
          {cargando ? 'Ingresando…' : 'Ingresar'}
        </Button>

        <Link
          href="/forgot-password"
          className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Olvidé mi contraseña
        </Link>
      </form>
  );
}

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
