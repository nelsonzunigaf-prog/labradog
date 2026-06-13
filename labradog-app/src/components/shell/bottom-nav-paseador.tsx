'use client';

/**
 * Bottom-nav fija del paseador (EXPERIENCE.md#Information Architecture):
 * máximo 4 ítems, activo en primary-deep con etiqueta visible, táctil ≥48px.
 * Agenda y Comisiones se suman cuando lleguen sus epics.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap, PawPrint } from 'lucide-react';

const ITEMS = [
  { href: '/paseador', etiqueta: 'Mi día', Icono: PawPrint, exacto: true },
  { href: '/paseador/mi-capacitacion', etiqueta: 'Mi capacitación', Icono: GraduationCap, exacto: false },
];

export function BottomNavPaseador() {
  const pathname = usePathname() ?? '';

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-10 border-t bg-card pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-md">
        {ITEMS.map(({ href, etiqueta, Icono, exacto }) => {
          const activo = exacto ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={activo ? 'page' : undefined}
                className={`flex min-h-12 flex-col items-center justify-center gap-0.5 py-1.5 text-xs font-medium ${
                  activo ? 'text-primary-deep' : 'text-muted-foreground'
                }`}
              >
                <Icono className="size-5" aria-hidden strokeWidth={activo ? 2.4 : 2} />
                {etiqueta}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
