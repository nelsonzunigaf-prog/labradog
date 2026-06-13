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
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">
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
          className="flex min-h-12 items-center rounded-full bg-primary px-8 text-base font-medium text-primary-foreground shadow-[0_10px_15px_-3px_rgba(6,78,59,0.4)] transition-colors hover:bg-primary-hover"
        >
          Iniciar sesión
        </Link>
      </main>
    </div>
  );
}
