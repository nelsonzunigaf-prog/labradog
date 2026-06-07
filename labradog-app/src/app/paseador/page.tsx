/**
 * "Mi día" del paseador — placeholder de Story 1.2 (móvil primero).
 * El contenido real (agenda del día, paseos) llega en stories posteriores.
 */
import { headers } from 'next/headers';
import { CerrarSesion } from '@/components/auth/cerrar-sesion';
import { auth } from '@/lib/auth';

export default async function PaseadorHome() {
  const sesion = await auth.api.getSession({ headers: await headers() });

  return (
    <main className="flex flex-1 flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mi día</h1>
          <p className="text-sm text-muted-foreground">Hola, {sesion?.user.name}</p>
        </div>
        <CerrarSesion />
      </header>
      <p className="text-sm text-muted-foreground">
        Aquí verás tus paseos de hoy.
      </p>
    </main>
  );
}
