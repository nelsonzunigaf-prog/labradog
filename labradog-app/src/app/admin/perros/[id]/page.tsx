/**
 * Perfil del perro (Story 1.6): ficha editable + foto + compatibilidades +
 * historial (estados vacíos). Solo admin.
 */
import { notFound } from 'next/navigation';
import { FormPerro } from '@/components/perros/form-perro';
import { FotoPerro } from '@/components/perros/foto-perro';
import { SeccionCompatibilidades } from '@/components/perros/seccion-compatibilidades';
import { SeccionHistorial } from '@/components/perros/seccion-historial';
import { Breadcrumb, Volver } from '@/components/shell/volver';
import { listarPerrosDeTutor, obtenerPerro } from '@/lib/db/queries/perros';
import { urlPublica } from '@/lib/storage';

export default async function PerroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const perro = await obtenerPerro(id);

  if (!perro) notFound();

  // Candidatos a compatibilidad: los demás perros del MISMO tutor,
  // excluyendo los ya compatibles.
  const hermanos = await listarPerrosDeTutor(perro.tutorId);
  const yaCompatibles = new Set(perro.compatibilidades.map((c) => c.otroPerroId));
  const candidatos = hermanos
    .filter((h) => h.id !== perro.id && !yaCompatibles.has(h.id))
    .map((h) => ({ id: h.id, nombre: h.nombre }));

  return (
    <main className="flex flex-1 flex-col gap-6">
      <header className="flex flex-col gap-1">
        <Volver
          href={`/admin/tutores/${perro.tutorId}`}
          etiqueta={`Tutor: ${perro.tutorNombre}`}
        />
        <Breadcrumb
          tramos={[
            { etiqueta: 'Tutores', href: '/admin/tutores' },
            { etiqueta: perro.tutorNombre, href: `/admin/tutores/${perro.tutorId}` },
            { etiqueta: perro.nombre },
          ]}
        />
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight">
          {perro.nombre}
          {perro.notasCriticas && <span title="Notas de manejo críticas">⚠️</span>}
        </h1>
      </header>

      <FotoPerro
        perroId={perro.id}
        nombre={perro.nombre}
        fotoUrl={perro.fotoKey ? urlPublica(perro.fotoKey) : null}
      />

      {/* key por version: tras guardar, router.refresh remonta el form con la
          version vigente (mismo patrón que la ficha del tutor). */}
      <div key={perro.version} className="grid gap-6 lg:grid-cols-2">
        <FormPerro
          perro={{
            id: perro.id,
            version: perro.version,
            nombre: perro.nombre,
            raza: perro.raza,
            grupoRaza: perro.grupoRaza,
            edad: perro.edad === null ? '' : String(perro.edad),
            talla: perro.talla,
            condicionFisica: perro.condicionFisica ?? '',
            temperamento: perro.temperamento ?? '',
            equipamiento: perro.equipamiento ?? '',
            premiosAceptados: perro.premiosAceptados ?? '',
            notasManejo: perro.notasManejo ?? '',
            notasCriticas: perro.notasCriticas,
            estado: perro.estado,
          }}
        />

        <SeccionCompatibilidades
          perroId={perro.id}
          compatibilidades={perro.compatibilidades}
          candidatos={candidatos}
        />
      </div>

      <SeccionHistorial />
    </main>
  );
}
