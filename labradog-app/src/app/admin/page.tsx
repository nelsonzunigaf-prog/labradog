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
            className="group flex items-center gap-4 rounded-[1.5rem] border border-border bg-card p-6 shadow-[0_8px_28px_-10px_rgba(6,78,59,0.16)] transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_16px_36px_-12px_rgba(6,78,59,0.28)]"
          >
            <span className="grad-emerald-tile flex size-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-[0_6px_14px_-4px_rgba(6,78,59,0.5)]">
              <Icono className="size-6" aria-hidden="true" />
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
