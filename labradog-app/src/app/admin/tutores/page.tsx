/**
 * Fichas de tutores (Story 1.5) — listado + alta. Solo admin (el layout de
 * /admin ya verifica el rol).
 */
import Link from 'next/link';
import { EncabezadoPagina, Tarjeta } from '@/components/marca/primitivas';
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

/** Rótulo de tabla admin: caption-desktop de DESIGN.md (12, uppercase, tracking). */
const TH_CLASS = 'text-xs font-semibold uppercase tracking-wide text-muted-foreground';

export default async function TutoresPage() {
  const tutores = await listarTutores();

  return (
    <main className="flex flex-1 flex-col gap-8">
      <EncabezadoPagina eyebrow="Tutores y sus perros" titulo="Tutores">
        Registra tutores con su entrevista inicial, red flags y anexos legales.
      </EncabezadoPagina>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Tarjeta className="overflow-hidden !p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={TH_CLASS}>Nombre</TableHead>
                <TableHead className={TH_CLASS}>Teléfono</TableHead>
                <TableHead className={TH_CLASS}>Plan</TableHead>
                <TableHead className={TH_CLASS}>Estado</TableHead>
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
                        className="text-primary-deep underline-offset-4 hover:underline"
                      >
                        {t.nombre}
                      </Link>
                    </TableCell>
                    <TableCell>{t.telefono}</TableCell>
                    <TableCell>{ETIQUETA_PLAN[t.planDefault] ?? t.planDefault}</TableCell>
                    <TableCell>
                      {/* Vocabulario DESIGN.md: activo = info, pausado/cerrado = neutro */}
                      <Badge
                        className={
                          t.estado === 'activo'
                            ? 'bg-secondary-soft text-secondary-deep'
                            : 'bg-muted text-muted-foreground'
                        }
                      >
                        {t.estado}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Tarjeta>

        <FormTutor />
      </div>
    </main>
  );
}
