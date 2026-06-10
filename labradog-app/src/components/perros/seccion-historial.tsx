/**
 * Historial del perro (FR-009) — estados vacíos honestos: los datos de paseos
 * (épica 3), incidentes y evolución emocional (épica 4) aún no existen.
 * NO consulta la tabla `paseos` (no tiene perro_id todavía).
 */
const BLOQUES = [
  {
    titulo: 'Paseos',
    vacio: 'Aún no hay paseos registrados.',
    nota: 'Se poblarán cuando la agenda esté operativa.',
  },
  {
    titulo: 'Incidentes',
    vacio: 'Sin incidentes registrados.',
    nota: 'Se registrarán desde el paseo en calle.',
  },
  {
    titulo: 'Evolución emocional',
    vacio: 'Sin registros de estado emocional.',
    nota: 'Se alimentará con el registro post-paseo del método.',
  },
] as const;

export function SeccionHistorial() {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border p-4">
      <h2 className="text-lg font-medium">Historial</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {BLOQUES.map((b) => (
          <div key={b.titulo} className="flex flex-col gap-1 rounded-lg border border-dashed border-border p-3">
            <h3 className="text-sm font-medium">{b.titulo}</h3>
            <p className="text-sm text-muted-foreground">{b.vacio}</p>
            <p className="text-xs text-muted-foreground">{b.nota}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
