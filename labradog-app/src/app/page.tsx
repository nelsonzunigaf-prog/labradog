import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-md flex-col items-center gap-4 px-8 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Labradog 🐾
        </h1>
        <p className="text-lg leading-7 text-zinc-600 dark:text-zinc-400">
          Plataforma de gestión interna: fichas, capacitación, agenda, paseos y
          cobros.
        </p>
        <Link
          href="/login"
          className="flex min-h-12 items-center rounded-lg bg-zinc-900 px-6 text-sm font-medium text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          Iniciar sesión
        </Link>
      </main>
    </div>
  );
}
