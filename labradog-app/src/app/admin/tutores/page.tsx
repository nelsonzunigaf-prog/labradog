/**
 * Fichas de tutores (Story 1.5) — listado + alta. Solo admin (el layout de
 * /admin ya verifica el rol).
 */
import Link from 'next/link';
import { FormTutor } from '@/components/tutores/form-tutor';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { listarTutores } from '@/lib/db/queries/tutores';

const ETIQUETA_PLAN: Record<string, string> = { base: 'BASE', plus: 'PLUS', elite: 'ELITE' };

export default async function TutoresPage() {
  const tutores = await listarTutores();

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Tutores</h1>
        <p className="text-sm text-muted-foreground">
          Registra tutores con su entrevista inicial, red flags y anexos legales.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tutores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-sm text-muted-foreground">
                    Aún no hay tutores. Crea la primera ficha →
                  </TableCell>
                </TableRow>
              ) : (
                tutores.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/tutores/${t.id}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {t.nombre}
                      </Link>
                    </TableCell>
                    <TableCell>{t.telefono}</TableCell>
                    <TableCell>{ETIQUETA_PLAN[t.planDefault] ?? t.planDefault}</TableCell>
                    <TableCell>
                      <Badge variant={t.estado === 'activo' ? 'default' : 'secondary'}>
                        {t.estado}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </section>

        <FormTutor />
      </div>
    </main>
  );
}
