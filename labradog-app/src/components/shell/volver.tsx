/**
 * "← volver" del app shell (EXPERIENCE.md, regla dura): toda pantalla no-raíz
 * lo lleva arriba a la izquierda, primer elemento enfocable, táctil ≥48px.
 * En admin se acompaña de Breadcrumb cuando es página de detalle.
 */
import Link from 'next/link';

export function Volver({ href, etiqueta }: { href: string; etiqueta: string }) {
  return (
    <Link
      href={href}
      className="-ml-2 inline-flex min-h-12 items-center gap-1 rounded-md px-2 text-sm text-muted-foreground hover:text-foreground"
    >
      ← {etiqueta}
    </Link>
  );
}

/** Breadcrumb de detalle admin: `Tutores / María Pérez`. */
export function Breadcrumb({
  tramos,
}: {
  tramos: Array<{ etiqueta: string; href?: string }>;
}) {
  return (
    <nav aria-label="Ruta" className="text-sm text-muted-foreground">
      {tramos.map((t, i) => (
        <span key={i}>
          {i > 0 && <span className="mx-1.5">/</span>}
          {t.href ? (
            <Link href={t.href} className="hover:text-foreground">
              {t.etiqueta}
            </Link>
          ) : (
            <span className="text-foreground">{t.etiqueta}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
