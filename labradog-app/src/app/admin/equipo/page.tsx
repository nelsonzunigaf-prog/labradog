/**
 * Gestión de cuentas del equipo (Story 1.3) — listado + alta + activar/desactivar.
 * Solo admin (el layout de /admin ya verifica el rol).
 */
import { AccionesCuenta } from '@/components/equipo/acciones-cuenta';
import { FormCrearCuenta } from '@/components/equipo/form-crear-cuenta';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getActor } from '@/lib/actor';
import { listarEquipo } from '@/lib/db/queries/usuarios';

/** Rótulo de tabla admin: caption-desktop de DESIGN.md (12, uppercase, tracking). */
const TH_CLASS = 'text-xs font-semibold uppercase tracking-wide text-muted-foreground';

export default async function EquipoPage() {
  const [equipo, actor] = await Promise.all([listarEquipo(), getActor()]);

  return (
    <main className="flex flex-1 flex-col gap-6">
      <header>
        <h1 className="text-xl font-bold tracking-tight">Equipo</h1>
        <p className="text-sm text-muted-foreground">
          Crea cuentas de admins y paseadores, y activa o desactiva el acceso.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={TH_CLASS}>Nombre</TableHead>
                <TableHead className={TH_CLASS}>Email</TableHead>
                <TableHead className={TH_CLASS}>Rol</TableHead>
                <TableHead className={TH_CLASS}>Estado</TableHead>
                <TableHead className={`text-right ${TH_CLASS}`}>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipo.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell>{m.email}</TableCell>
                  <TableCell className="capitalize">{m.rol}</TableCell>
                  <TableCell>
                    {/* Vocabulario DESIGN.md: activo = info, inactivo = neutro apagado */}
                    <Badge
                      className={
                        m.estado === 'activo'
                          ? 'bg-secondary-soft text-secondary-deep'
                          : 'bg-muted text-muted-foreground'
                      }
                    >
                      {m.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <AccionesCuenta
                      userId={m.id}
                      estado={m.estado}
                      esYoMismo={m.id === actor?.id}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        <FormCrearCuenta />
      </div>
    </main>
  );
}
