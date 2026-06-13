import Link from 'next/link';

/**
 * Portada — fiel al sistema visual de la landing (docs/estilo-demo.html):
 * hero oscuro con degradado emerald, eyebrow uppercase, título semibold con
 * tracking apretado, CTA pill. Es la cara pública de Labradog.
 */
export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* HERO oscuro con degradado emerald (patrón .hero del demo) */}
      <section
        className="relative flex flex-1 flex-col items-center justify-center px-6 py-24 text-center text-white"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.30), rgba(0,0,0,0.40), rgba(0,0,0,0.70)), linear-gradient(135deg, #1a3d2e, #0c5c45 55%, #14352a)',
        }}
      >
        <div className="mx-auto flex max-w-3xl flex-col items-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
            Labradog · Cuidado profesional
          </p>
          <h1 className="mt-6 text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-[1.05] tracking-tight">
            Tu perro merece manos profesionales.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/90">
            La plataforma interna de Labradog: fichas, capacitación certificada,
            agenda, paseos y cobros — todo el método en un solo lugar.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex h-12 items-center rounded-full bg-emerald-600 px-8 text-base font-medium text-white shadow-[0_10px_15px_-3px_rgba(6,78,59,0.4)] transition-colors hover:bg-emerald-500"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </section>

      {/* Footer neutral oscuro (patrón .footer del demo) */}
      <footer className="bg-neutral-900 px-6 py-10 text-sm text-neutral-400">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <span className="font-semibold text-emerald-400">Labradog 🐾</span>
          <span className="text-xs text-neutral-500">© 2026 Labradog SpA</span>
        </div>
      </footer>
    </div>
  );
}
