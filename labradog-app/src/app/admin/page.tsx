/**
 * Tablero admin — placeholder de Story 1.2. El contenido real (paseos de hoy,
 * alertas, incidentes) llega en stories posteriores. El shell (header con nav
 * horizontal + CerrarSesion y el contenedor max-w-6xl) lo pone el layout.
 */
import { Dog, PawPrint, Users } from 'lucide-react';
import Link from 'next/link';
import { headers } from 'next/headers';
import { EncabezadoPagina } from '@/components/marca/primitivas';
import { auth } from '@/lib/auth';

const ACCESOS = [
  { href: '/admin/equipo', etiqueta: 'Gestionar equipo →', Icono: Users },
  { href: '/admin/tutores', etiqueta: 'Fichas de tutores →', Icono: Dog },
  { href: '/admin/paseadores', etiqueta: 'Fichas de paseadores →', Icono: PawPrint },
] as const;

export default async function AdminHome() {
  const sesion = await auth.api.getSession({ headers: await headers() });

  return (
    <main className="flex flex-1 flex-col gap-8">
      <EncabezadoPagina eyebrow="Estudio Labradog" titulo="Panel de administración">
        Hola, {sesion?.user.name}
      </EncabezadoPagina>

      <nav aria-label="Accesos" className="grid gap-6 sm:grid-cols-3">
        {ACCESOS.map(({ href, etiqueta, Icono }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-[1.5rem] border border-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors hover:border-primary"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-deep">
              <Icono className="size-5" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold tracking-tight">{etiqueta}</span>
          </Link>
        ))}
      </nav>

      <p className="text-sm text-muted-foreground">
        Aquí vivirá el tablero (paseos de hoy, alertas, incidentes).
      </p>
    </main>
  );
}
