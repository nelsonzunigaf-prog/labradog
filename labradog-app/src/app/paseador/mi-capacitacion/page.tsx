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
import { BandaCita, Eyebrow, Tarjeta } from '@/components/marca/primitivas';
import { auth } from '@/lib/auth';
import { obtenerCapacitacionParaUsuario, type EtapaListada } from '@/lib/db/queries/capacitacion';

function EtiquetaEtapa({ etapa }: { etapa: EtapaListada }) {
  return etapa.esModuloRazas ? <>Módulo razas</> : <>Etapa {etapa.numero}</>;
}

function FilaEtapa({ etapa }: { etapa: EtapaListada }) {
  // Estados visuales del contrato (DESIGN.md#Components — Card de etapa):
  // aprobada ✓ éxito · EN CURSO borde 2px primary + sombra destacada + pill de
  // avance (mar profundo, AA) · bloqueada atenuada 0.55 sin link.
  const contenido = (
    <Tarjeta
      destacada={etapa.estado === 'actual'}
      className={`flex min-h-12 items-center gap-3 !p-3 ${
        etapa.estado === 'actual'
          ? 'shadow-[0_4px_14px_rgba(25,40,32,0.10)]'
          : ''
      }`}
    >
      {etapa.estado === 'aprobada' && (
        <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden />
      )}
      {etapa.estado === 'actual' && (
        <PlayCircle className="size-5 shrink-0 text-primary-deep" aria-hidden />
      )}
      {etapa.estado === 'bloqueada' && (
        <Lock className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">
          <EtiquetaEtapa etapa={etapa} /> · {etapa.duracion}
        </p>
        <p className="truncate text-sm font-semibold tracking-tight">{etapa.titulo}</p>
      </div>
      {etapa.estado === 'actual' && (
        <span className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
          Continuar
        </span>
      )}
    </Tarjeta>
  );

  if (etapa.estado === 'bloqueada') {
    return <li className="opacity-55">{contenido}</li>;
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
      {/* Superficie RAÍZ de la bottom-nav (EXPERIENCE.md#IA): sin "← volver". */}
      <header>
        <Eyebrow>Tu formación</Eyebrow>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          Mi capacitación 🎓
        </h1>
      </header>

      {!capacitacion ? (
        <p className="rounded-lg border p-4 text-sm text-muted-foreground">
          Tu ficha de paseador aún no está creada — contacta al administrador para
          comenzar tu capacitación.
        </p>
      ) : (
        <>
          <section aria-label="Avance">
            <div className="grad-emerald-deep rounded-[1.5rem] p-5 text-white shadow-[0_10px_30px_-10px_rgba(6,78,59,0.5)]">
              <Eyebrow onDark>Tu avance</Eyebrow>
              <p className="mt-1 text-sm font-medium" data-testid="avance">
                {capacitacion.avance.aprobadas} de {capacitacion.avance.total} etapas aprobadas
              </p>
              <div
                className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/20"
                role="progressbar"
                aria-valuenow={capacitacion.avance.aprobadas}
                aria-valuemin={0}
                aria-valuemax={capacitacion.avance.total}
                aria-label="Avance de capacitación"
              >
                <div
                  className="h-full rounded-full bg-white transition-all"
                  style={{
                    width:
                      capacitacion.avance.total > 0
                        ? `${(capacitacion.avance.aprobadas / capacitacion.avance.total) * 100}%`
                        : '0%',
                  }}
                />
              </div>
            </div>
          </section>

          <BandaCita fuente="El método Labradog">
            El bienestar del perro y la seguridad están por sobre el horario.
          </BandaCita>

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
