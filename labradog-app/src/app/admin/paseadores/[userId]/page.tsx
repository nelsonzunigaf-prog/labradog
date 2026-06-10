/**
 * Ficha de un paseador (Story 1.7): crear o editar sobre su cuenta (1:1).
 * Certificación "Sin certificar" derivada hasta Epic 2. Solo admin.
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FormFichaPaseador } from '@/components/paseadores/form-ficha-paseador';
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
    <main className="flex flex-1 flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <Link
          href="/admin/paseadores"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Paseadores
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{cuenta.nombre}</h1>
          <Badge variant={cuenta.estadoCuenta === 'activo' ? 'default' : 'secondary'}>
            cuenta {cuenta.estadoCuenta}
          </Badge>
          <Badge variant="secondary">Sin certificar</Badge>
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
