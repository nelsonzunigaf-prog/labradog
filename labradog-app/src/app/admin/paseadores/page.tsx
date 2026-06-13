/**
 * Fichas de paseadores (Story 1.7) — todas las cuentas rol paseador con su
 * ficha (o invitación a crearla). Solo admin.
 */
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ETIQUETAS_ESPECIALIDAD, type EspecialidadCaminata } from '@/lib/engine/fichas';
import { listarPaseadores } from '@/lib/db/queries/paseadores';

/** Rótulo de tabla admin: caption-desktop de DESIGN.md (12, uppercase, tracking). */
const TH_CLASS = 'text-xs font-semibold uppercase tracking-wide text-muted-foreground';

export default async function PaseadoresPage() {
  const paseadores = await listarPaseadores();

  return (
    <main className="flex flex-1 flex-col gap-6">
      <header>
        <h1 className="text-xl font-bold tracking-tight">Paseadores</h1>
        <p className="text-sm text-muted-foreground">
          Especialidades y % de comisión por paseador. La certificación llega con el módulo de
          capacitación.
        </p>
      </header>

      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={TH_CLASS}>Nombre</TableHead>
              <TableHead className={TH_CLASS}>Email</TableHead>
              <TableHead className={TH_CLASS}>Cuenta</TableHead>
              <TableHead className={TH_CLASS}>Especialidades</TableHead>
              <TableHead className={TH_CLASS}>% comisión</TableHead>
              <TableHead className={TH_CLASS}>Certificación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paseadores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-sm text-muted-foreground">
                  Aún no hay cuentas de paseador. Créalas en Equipo.
                </TableCell>
              </TableRow>
            ) : (
              paseadores.map((p) => (
                <TableRow key={p.userId}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/paseadores/${p.userId}`}
                      className="text-primary-deep underline-offset-4 hover:underline"
                    >
                      {p.nombre}
                    </Link>
                  </TableCell>
                  <TableCell>{p.email}</TableCell>
                  <TableCell>
                    {/* Vocabulario DESIGN.md: activo = info, inactivo = neutro apagado */}
                    <Badge
                      className={
                        p.estadoCuenta === 'activo'
                          ? 'bg-secondary-soft text-secondary-deep'
                          : 'bg-muted text-muted-foreground'
                      }
                    >
                      {p.estadoCuenta}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {p.ficha === null ? (
                      <span className="text-muted-foreground">Crear ficha →</span>
                    ) : p.ficha.especialidades.length === 0 ? (
                      '—'
                    ) : (
                      p.ficha.especialidades
                        .map((e) => ETIQUETAS_ESPECIALIDAD[e as EspecialidadCaminata] ?? e)
                        .join(', ')
                    )}
                  </TableCell>
                  <TableCell>{p.ficha ? `${p.ficha.comisionPct}%` : '—'}</TableCell>
                  <TableCell>
                    {/* Derivado: la fuente de verdad de certificación llega con Epic 2.
                        Vocabulario DESIGN.md: sin certificar = badge neutro. */}
                    <Badge className="bg-muted text-muted-foreground">Sin certificar</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>
    </main>
  );
}
