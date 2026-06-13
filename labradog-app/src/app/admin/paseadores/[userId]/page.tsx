/**
 * Ficha de un paseador (Story 1.7): crear o editar sobre su cuenta (1:1).
 * Certificación "Sin certificar" derivada hasta Epic 2. Solo admin.
 */
import { notFound } from 'next/navigation';
import { FormFichaPaseador } from '@/components/paseadores/form-ficha-paseador';
import { Breadcrumb, Volver } from '@/components/shell/volver';
import { Badge } from '@/components/ui/badge';
import { obtenerFichaPorUsuario } from '@/lib/db/queries/paseadores';
import type { EspecialidadCaminata } from '@/lib/engine/fichas';

export default async function FichaPaseadorPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const datos = await obtenerFichaPorUsuario(userId);

  if (!datos) notFound();

  const { cuenta, ficha } = datos;

  return (
    <main className="flex flex-1 flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Volver href="/admin/paseadores" etiqueta="Paseadores" />
        <Breadcrumb
          tramos={[
            { etiqueta: 'Paseadores', href: '/admin/paseadores' },
            { etiqueta: cuenta.nombre },
          ]}
        />
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight">{cuenta.nombre}</h1>
          {/* Vocabulario DESIGN.md: activo = info, inactivo y sin certificar = neutro */}
          <Badge
            className={
              cuenta.estadoCuenta === 'activo'
                ? 'bg-secondary-soft text-secondary-deep'
                : 'bg-muted text-muted-foreground'
            }
          >
            cuenta {cuenta.estadoCuenta}
          </Badge>
          <Badge className="bg-muted text-muted-foreground">Sin certificar</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {cuenta.email} · La certificación (módulo de capacitación) habilita la asignación de
          paseos.
        </p>
      </header>

      {/* key por version: remount tras guardar, evita falso conflicto de lock */}
      <div key={ficha?.version ?? 0} className="max-w-xl">
        <FormFichaPaseador
          userId={cuenta.userId}
          ficha={
            ficha
              ? {
                  id: ficha.id,
                  version: ficha.version,
                  telefono: ficha.telefono,
                  especialidades: ficha.especialidades as EspecialidadCaminata[],
                  comisionPct: String(ficha.comisionPct),
                  notas: ficha.notas ?? '',
                }
              : undefined
          }
        />
      </div>
    </main>
  );
}
