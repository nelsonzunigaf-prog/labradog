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
        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          El acceso con tu cuenta estará disponible próximamente.
        </p>
      </main>
    </div>
  );
}
