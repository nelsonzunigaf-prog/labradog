'use client';

/**
 * Header del admin (EXPERIENCE.md#Information Architecture): marca + navegación
 * horizontal persistente con sección activa en primary, CerrarSesion a la
 * derecha. En <md la nav hace scroll horizontal (sin Sheet: no se instalan
 * componentes nuevos en esta story).
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CerrarSesion } from '@/components/auth/cerrar-sesion';

const SECCIONES = [
  { href: '/admin/equipo', etiqueta: 'Equipo' },
  { href: '/admin/tutores', etiqueta: 'Tutores' },
  { href: '/admin/paseadores', etiqueta: 'Paseadores' },
];

export function NavAdmin() {
  const pathname = usePathname() ?? '';

  return (
    <header className="sticky top-0 z-10 border-b bg-card">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-6">
        <Link href="/admin" className="flex min-h-12 shrink-0 items-center text-base font-semibold tracking-tight text-primary">
          Labradog 🐾
        </Link>
        <nav aria-label="Secciones" className="flex-1 overflow-x-auto">
          <ul className="flex gap-1">
            {SECCIONES.map(({ href, etiqueta }) => {
              const activa = pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={activa ? 'page' : undefined}
                    className={`flex min-h-12 items-center border-b-2 px-3 text-sm font-medium ${
                      activa
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {etiqueta}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <CerrarSesion />
      </div>
    </header>
  );
}
