/**
 * Tablero admin — placeholder de Story 1.2. El contenido real (paseos de hoy,
 * alertas, incidentes) llega en stories posteriores.
 */
import Link from 'next/link';
import { headers } from 'next/headers';
import { CerrarSesion } from '@/components/auth/cerrar-sesion';
import { auth } from '@/lib/auth';

export default async function AdminHome() {
  const sesion = await auth.api.getSession({ headers: await headers() });

  return (
    <main className="flex flex-1 flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Panel de administración</h1>
          <p className="text-sm text-muted-foreground">Hola, {sesion?.user.name}</p>
        </div>
        <CerrarSesion />
      </header>
      <nav className="flex flex-col gap-2">
        <Link
          href="/admin/equipo"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Gestionar equipo →
        </Link>
        <Link
          href="/admin/tutores"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Fichas de tutores →
        </Link>
      </nav>

      <p className="text-sm text-muted-foreground">
        Aquí vivirá el tablero (paseos de hoy, alertas, incidentes).
      </p>
    </main>
  );
}
