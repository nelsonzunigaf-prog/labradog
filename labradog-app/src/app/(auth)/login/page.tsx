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
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-secondary-ink">
            Labradog 🐾
          </h1>
          <p className="text-sm text-muted-foreground">Inicia sesión para continuar</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex w-full flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              className="min-h-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive-text">{error}</p>}

          <Button type="submit" disabled={cargando} className="min-h-12">
            {cargando ? 'Ingresando…' : 'Ingresar'}
          </Button>

          <Link
            href="/forgot-password"
            className="text-center text-sm font-medium text-primary-deep underline-offset-4 hover:underline"
          >
            Olvidé mi contraseña
          </Link>
        </form>
      </div>
  );
}

export default function LoginPage() {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4">
      {/* Huellas decorativas sutiles (motivo de marca, DESIGN.md) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none">
        <span className="absolute top-8 left-5 -rotate-12 text-5xl opacity-[0.07]">🐾</span>
        <span className="absolute top-28 right-7 rotate-12 text-4xl opacity-[0.07]">🐾</span>
        <span className="absolute bottom-32 left-8 rotate-6 text-5xl opacity-[0.07]">🐾</span>
        <span className="absolute bottom-10 right-10 -rotate-12 text-6xl opacity-[0.07]">🐾</span>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
