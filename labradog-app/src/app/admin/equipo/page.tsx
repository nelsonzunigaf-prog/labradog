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

export default async function EquipoPage() {
  const [equipo, actor] = await Promise.all([listarEquipo(), getActor()]);

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Equipo</h1>
        <p className="text-sm text-muted-foreground">
          Crea cuentas de admins y paseadores, y activa o desactiva el acceso.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <section className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipo.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell>{m.email}</TableCell>
                  <TableCell className="capitalize">{m.rol}</TableCell>
                  <TableCell>
                    <Badge variant={m.estado === 'activo' ? 'default' : 'secondary'}>
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
