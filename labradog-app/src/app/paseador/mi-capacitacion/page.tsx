/**
 * "Mi capacitación" del paseador (Story 2.2) — lista de etapas con estado
 * (aprobada/actual/bloqueada, derivado por el motor) y avance. Móvil primero
 * (NFR-02): filas táctiles ≥48px. El gate es de servidor: las bloqueadas no
 * tienen link y su contenido nunca viaja al cliente.
 */
import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle2, Lock, PlayCircle } from 'lucide-react';
import { auth } from '@/lib/auth';
import { obtenerCapacitacionParaUsuario, type EtapaListada } from '@/lib/db/queries/capacitacion';

function EtiquetaEtapa({ etapa }: { etapa: EtapaListada }) {
  return etapa.esModuloRazas ? <>Módulo razas</> : <>Etapa {etapa.numero}</>;
}

function FilaEtapa({ etapa }: { etapa: EtapaListada }) {
  const contenido = (
    <div className="flex min-h-12 items-center gap-3 rounded-lg border p-3">
      {etapa.estado === 'aprobada' && (
        <CheckCircle2 className="size-5 shrink-0 text-green-600" aria-hidden />
      )}
      {etapa.estado === 'actual' && (
        <PlayCircle className="size-5 shrink-0 text-primary" aria-hidden />
      )}
      {etapa.estado === 'bloqueada' && (
        <Lock className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">
          <EtiquetaEtapa etapa={etapa} /> · {etapa.duracion}
        </p>
        <p className="truncate text-sm font-medium">{etapa.titulo}</p>
      </div>
      {etapa.estado === 'actual' && (
        <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
          Continuar
        </span>
      )}
    </div>
  );

  if (etapa.estado === 'bloqueada') {
    return <li className="opacity-50">{contenido}</li>;
  }
  return (
    <li>
      <Link
        href={`/paseador/mi-capacitacion/${etapa.slug}`}
        data-testid={`etapa-${etapa.numero}`}
        className="block"
      >
        {contenido}
      </Link>
    </li>
  );
}

export default async function MiCapacitacion() {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) redirect('/login');

  const capacitacion = await obtenerCapacitacionParaUsuario(sesion.user.id);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4">
      <header>
        <Link href="/paseador" className="text-sm text-muted-foreground">
          ← Mi día
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Mi capacitación</h1>
      </header>

      {!capacitacion ? (
        <p className="rounded-lg border p-4 text-sm text-muted-foreground">
          Tu ficha de paseador aún no está creada — contacta al administrador para
          comenzar tu capacitación.
        </p>
      ) : (
        <>
          <section aria-label="Avance" className="rounded-lg border p-4">
            <p className="text-sm font-medium" data-testid="avance">
              {capacitacion.avance.aprobadas} de {capacitacion.avance.total} etapas aprobadas
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width:
                    capacitacion.avance.total > 0
                      ? `${(capacitacion.avance.aprobadas / capacitacion.avance.total) * 100}%`
                      : '0%',
                }}
              />
            </div>
          </section>

          <ul className="flex flex-col gap-2">
            {capacitacion.etapas.map((etapa) => (
              <FilaEtapa key={etapa.numero} etapa={etapa} />
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
