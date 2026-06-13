/**
 * Primitivas de marca — lenguaje visual de la landing (docs/estilo-demo.html),
 * aplicado a TODA la app (decisión de Nelson 2026-06-12). Composables para que
 * cada pantalla hable el mismo idioma: eyebrows, encabezados, listas con ✓/●,
 * bandas de cita. Presentacionales puros; sin lógica de negocio.
 */
import type { ReactNode } from 'react';

/** Rótulo "eyebrow": mayúsculas, tracking 0.3em, emerald. Sobre fondo oscuro usa emerald-200. */
export function Eyebrow({ children, onDark }: { children: ReactNode; onDark?: boolean }) {
  return (
    <p
      className={`text-xs font-semibold uppercase tracking-[0.3em] ${
        onDark ? 'text-emerald-200' : 'text-primary'
      }`}
    >
      {children}
    </p>
  );
}

/**
 * Encabezado de página interna (eyebrow + título semibold + bajada).
 * Alineado a la izquierda — el patrón de tabla/lista de admin y paseador.
 */
export function EncabezadoPagina({
  eyebrow,
  titulo,
  children,
  accion,
}: {
  eyebrow: string;
  titulo: string;
  children?: ReactNode;
  accion?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{titulo}</h1>
        {children && <p className="mt-1 text-sm text-muted-foreground">{children}</p>}
      </div>
      {accion}
    </header>
  );
}

/** Encabezado de sección centrado (patrón .section-head del demo) para superficies tipo landing. */
export function EncabezadoSeccion({
  eyebrow,
  titulo,
  children,
}: {
  eyebrow: string;
  titulo: string;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{titulo}</h2>
      {children && <p className="mt-3 text-muted-foreground">{children}</p>}
    </div>
  );
}

/** Lista con check emerald (patrón .check-list del demo). */
export function ListaCheck({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2 text-sm text-neutral-700">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span aria-hidden className="shrink-0 text-primary">
            ✓
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Lista con bullet emerald (patrón .bullet-list del demo). */
export function ListaBullet({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2 text-neutral-700">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span aria-hidden className="mt-1.5 text-[0.6rem] shrink-0 text-primary">
            ●
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Banda de cita con degradado emerald (patrón .quote-band del demo). */
export function BandaCita({ children, fuente }: { children: ReactNode; fuente?: string }) {
  return (
    <section className="grad-emerald-band rounded-[1.5rem] px-8 py-10 text-white">
      <blockquote className="mx-auto max-w-2xl">
        <p className="text-2xl font-semibold leading-snug tracking-tight">{children}</p>
        {fuente && (
          <footer className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
            {fuente}
          </footer>
        )}
      </blockquote>
    </section>
  );
}

/** Tarjeta de marca: rounded-3xl, borde sutil, sombra mínima; destacada = ring emerald. */
export function Tarjeta({
  children,
  destacada,
  className = '',
}: {
  children: ReactNode;
  destacada?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[1.5rem] border bg-card p-6 shadow-[0_8px_28px_-10px_rgba(6,78,59,0.16)] ${
        destacada ? 'border-primary-soft ring-2 ring-primary-soft' : 'border-border'
      } ${className}`}
    >
      {children}
    </div>
  );
}
