/** Skeleton de carga calcando el layout de la lista de etapas (EXPERIENCE.md#State Patterns). */
export default function CargandoCapacitacion() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4" aria-busy>
      <div className="h-8 w-56 animate-pulse rounded-md bg-muted" />
      <div className="h-20 animate-pulse rounded-2xl bg-muted" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </main>
  );
}
