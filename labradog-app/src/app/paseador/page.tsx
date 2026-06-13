/**
 * "Mi día" del paseador — placeholder de Story 1.2 (móvil primero).
 * El contenido real (agenda del día, paseos) llega en stories posteriores.
 */
import { headers } from 'next/headers';
import { CerrarSesion } from '@/components/auth/cerrar-sesion';
import { Eyebrow, Tarjeta } from '@/components/marca/primitivas';
import { auth } from '@/lib/auth';

export default async function PaseadorHome() {
  const sesion = await auth.api.getSession({ headers: await headers() });

  // La navegación a Mi capacitación vive en la bottom-nav del shell (Story 2.8).
  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <header className="flex items-end justify-between gap-4">
        <div>
          <Eyebrow>Tu jornada</Eyebrow>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            Mi día 🐾
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Hola, {sesion?.user.name}</p>
        </div>
        <CerrarSesion />
      </header>
      <Tarjeta>
        <p className="text-sm text-muted-foreground">Aún no tienes paseos para hoy 🐾</p>
      </Tarjeta>
    </main>
  );
}
