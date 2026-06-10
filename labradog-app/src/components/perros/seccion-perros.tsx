/**
 * Sección "Perros" de la ficha del tutor (Story 1.6): lista + alta.
 * Componente de presentación (server); el form de alta es cliente.
 */
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { FormPerro } from './form-perro';

const ETIQUETA_GRUPO: Record<string, string> = {
  trabajo_guardia: 'Trabajo/guardia',
  pastora: 'Pastora',
  caza: 'Caza',
  otro: 'Otro',
};

const ETIQUETA_TALLA: Record<string, string> = {
  pequena: 'Pequeña',
  mediana: 'Mediana',
  grande: 'Grande',
};

type PerroItem = {
  id: string;
  nombre: string;
  raza: string;
  grupoRaza: string;
  talla: string;
  estado: string;
  notasCriticas: boolean;
  /** URL pública resuelta en el server (null si no hay foto). */
  fotoUrl: string | null;
};

type Props = {
  tutorId: string;
  perros: PerroItem[];
};

export function SeccionPerros({ tutorId, perros }: Props) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border p-4">
      <h2 className="text-lg font-medium">Perros</h2>

      {perros.length === 0 ? (
        <p className="text-sm text-muted-foreground">Este tutor aún no tiene perros registrados.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {perros.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
            >
              <div className="flex items-center gap-3">
                {p.fotoUrl ? (
                  <Image
                    src={p.fotoUrl}
                    alt={`Foto de ${p.nombre}`}
                    width={40}
                    height={40}
                    unoptimized
                    className="size-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex size-10 items-center justify-center rounded-full bg-muted text-lg">
                    🐕
                  </span>
                )}
                <div className="flex flex-col">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Link
                      href={`/admin/perros/${p.id}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {p.nombre}
                    </Link>
                    {p.notasCriticas && <span title="Notas de manejo críticas">⚠️</span>}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {p.raza} · {ETIQUETA_GRUPO[p.grupoRaza] ?? p.grupoRaza} ·{' '}
                    {ETIQUETA_TALLA[p.talla] ?? p.talla}
                  </span>
                </div>
              </div>
              <Badge variant={p.estado === 'activo' ? 'default' : 'secondary'}>{p.estado}</Badge>
            </li>
          ))}
        </ul>
      )}

      <FormPerro tutorId={tutorId} />
    </section>
  );
}
