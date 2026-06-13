/**
 * Tablero admin — placeholder de Story 1.2. El contenido real (paseos de hoy,
 * alertas, incidentes) llega en stories posteriores. El shell (header con nav
 * horizontal + CerrarSesion y el contenedor max-w-6xl) lo pone el layout.
 */
import { Dog, PawPrint, Users } from 'lucide-react';
import Link from 'next/link';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

const ACCESOS = [
  { href: '/admin/equipo', etiqueta: 'Gestionar equipo →', Icono: Users },
  { href: '/admin/tutores', etiqueta: 'Fichas de tutores →', Icono: Dog },
  { href: '/admin/paseadores', etiqueta: 'Fichas de paseadores →', Icono: PawPrint },
] as const;

export default async function AdminHome() {
  const sesion = await auth.api.getSession({ headers: await headers() });

  return (
    <main className="flex flex-1 flex-col gap-6">
      <header>
        <h1 className="text-xl font-bold tracking-tight">Panel de administración</h1>
        <p className="text-sm text-muted-foreground">Hola, {sesion?.user.name}</p>
      </header>

      <nav aria-label="Accesos" className="grid gap-4 sm:grid-cols-3">
        {ACCESOS.map(({ href, etiqueta, Icono }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:border-primary"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-deep">
              <Icono className="size-5" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold">{etiqueta}</span>
          </Link>
        ))}
      </nav>

      <p className="text-sm text-muted-foreground">
        Aquí vivirá el tablero (paseos de hoy, alertas, incidentes).
      </p>
    </main>
  );
}
