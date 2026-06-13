/** Skeleton de carga de la lista de equipo (EXPERIENCE.md#State Patterns). */
export default function CargandoEquipo() {
  return (
    <main className="flex flex-col gap-4" aria-busy>
      <div className="h-7 w-40 animate-pulse rounded-md bg-muted" />
      <div className="flex flex-col gap-2 rounded-2xl border bg-card p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    </main>
  );
}
