/**
 * Detalle/edición de una ficha de tutor (Story 1.5): datos, entrevista inicial
 * (con alerta de red flags) y anexos legales. Sección Perros (Story 1.6).
 * Solo admin.
 */
import { notFound } from 'next/navigation';
import { EncabezadoPagina } from '@/components/marca/primitivas';
import { SeccionPerros } from '@/components/perros/seccion-perros';
import { Breadcrumb, Volver } from '@/components/shell/volver';
import { FormTutor } from '@/components/tutores/form-tutor';
import { SeccionAnexos } from '@/components/tutores/seccion-anexos';
import { SeccionEntrevista } from '@/components/tutores/seccion-entrevista';
import { listarPerrosDeTutor } from '@/lib/db/queries/perros';
import { obtenerTutor } from '@/lib/db/queries/tutores';
import { urlPublica } from '@/lib/storage';

export default async function TutorFichaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tutor = await obtenerTutor(id);

  if (!tutor) notFound();

  const perros = await listarPerrosDeTutor(tutor.id);

  return (
    <main className="flex flex-1 flex-col gap-8">
      <div className="flex flex-col gap-1">
        <Volver href="/admin/tutores" etiqueta="Tutores" />
        <Breadcrumb
          tramos={[{ etiqueta: 'Tutores', href: '/admin/tutores' }, { etiqueta: tutor.nombre }]}
        />
        <EncabezadoPagina eyebrow="Ficha del tutor" titulo={tutor.nombre} />
      </div>

      {/* key por version: tras guardar (datos o entrevista) la version sube y el
          router.refresh remonta ambos forms con la version vigente, evitando un
          falso conflicto de lock optimista en la segunda edición. */}
      <div key={tutor.version} className="grid gap-6 lg:grid-cols-2">
        <FormTutor
          tutor={{
            id: tutor.id,
            version: tutor.version,
            nombre: tutor.nombre,
            telefono: tutor.telefono,
            email: tutor.email ?? '',
            direccionRetiro: tutor.direccionRetiro,
            planDefault: tutor.planDefault,
            cobroPeriodicidad: tutor.cobroPeriodicidad,
            cobroTiempo: tutor.cobroTiempo,
            estado: tutor.estado,
          }}
        />

        <SeccionEntrevista
          tutorId={tutor.id}
          version={tutor.version}
          inicial={{
            historial: tutor.entrevistaHistorial ?? '',
            reactividad: tutor.entrevistaReactividad ?? '',
            escapes: tutor.entrevistaEscapes ?? '',
            equipamiento: tutor.entrevistaEquipamiento ?? '',
            expectativas: tutor.entrevistaExpectativas ?? '',
            redFlags: tutor.redFlags,
          }}
        />
      </div>

      <SeccionPerros
        tutorId={tutor.id}
        perros={perros.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          raza: p.raza,
          grupoRaza: p.grupoRaza,
          talla: p.talla,
          estado: p.estado,
          notasCriticas: p.notasCriticas,
          fotoUrl: p.fotoKey ? urlPublica(p.fotoKey) : null,
        }))}
      />

      <SeccionAnexos
        tutorId={tutor.id}
        anexos={tutor.anexos.map((a) => ({
          id: a.id,
          tipo: a.tipo,
          fechaAceptacion: a.fechaAceptacion,
          medio: a.medio,
          pdfUrl: a.pdfKey ? urlPublica(a.pdfKey) : null,
        }))}
      />
    </main>
  );
}
