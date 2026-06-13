import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative flex flex-col flex-1 items-center justify-center overflow-hidden bg-background font-sans">
      {/* Huellas decorativas sutiles (motivo de marca, DESIGN.md) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none">
        <span className="absolute top-10 left-6 -rotate-12 text-5xl opacity-[0.07]">🐾</span>
        <span className="absolute top-28 right-8 rotate-12 text-4xl opacity-[0.07]">🐾</span>
        <span className="absolute bottom-36 left-10 rotate-6 text-5xl opacity-[0.07]">🐾</span>
        <span className="absolute bottom-12 right-12 -rotate-12 text-6xl opacity-[0.07]">🐾</span>
      </div>

      <main className="relative flex w-full max-w-md flex-col items-center gap-4 px-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-secondary-ink">
          Labradog 🐾
        </h1>
        <p className="text-base font-medium text-muted-foreground">
          Cuidamos a quienes cuidan
        </p>
        <p className="text-lg leading-7 text-muted-foreground">
          Plataforma de gestión interna: fichas, capacitación, agenda, paseos y
          cobros.
        </p>
        <Link
          href="/login"
          className="flex min-h-12 items-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/80"
        >
          Iniciar sesión
        </Link>
      </main>
    </div>
  );
}
