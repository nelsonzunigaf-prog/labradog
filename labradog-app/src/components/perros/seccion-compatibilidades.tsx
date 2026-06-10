'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { marcarCompatibilidad, quitarCompatibilidad } from '@/actions/perros';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type Compatibilidad = { otroPerroId: string; otroPerroNombre: string };
type Candidato = { id: string; nombre: string };

type Props = {
  perroId: string;
  compatibilidades: Compatibilidad[];
  /** Los demás perros del MISMO tutor (sin el actual ni los ya compatibles). */
  candidatos: Candidato[];
};

const SELECT_CLASS = 'h-8 rounded-lg border border-border bg-background px-2.5 text-sm';

export function SeccionCompatibilidades({ perroId, compatibilidades, candidatos }: Props) {
  const router = useRouter();
  const [seleccion, setSeleccion] = useState('');
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onMarcar(e: React.FormEvent) {
    e.preventDefault();
    if (!seleccion) return;
    setMensaje(null);
    setCargando(true);
    const r = await marcarCompatibilidad({ perroAId: perroId, perroBId: seleccion });
    setCargando(false);

    if (!r.ok) {
      setMensaje({ tipo: 'error', texto: r.error });
      return;
    }
    setSeleccion('');
    setMensaje({ tipo: 'ok', texto: 'Compatibilidad registrada.' });
    router.refresh();
  }

  async function onQuitar(otroPerroId: string) {
    setMensaje(null);
    const r = await quitarCompatibilidad({ perroAId: perroId, perroBId: otroPerroId });
    if (!r.ok) {
      setMensaje({ tipo: 'error', texto: r.error });
      return;
    }
    setMensaje({ tipo: 'ok', texto: 'Compatibilidad quitada.' });
    router.refresh();
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border p-4">
      <header>
        <h2 className="text-lg font-medium">Compatibilidades</h2>
        <p className="text-sm text-muted-foreground">
          Entre perros del mismo tutor — habilita paseos de hasta 3 perros (plan BASE).
        </p>
      </header>

      {compatibilidades.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin compatibilidades registradas.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {compatibilidades.map((c) => (
            <li
              key={c.otroPerroId}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
            >
              <span>
                Compatible con <strong>{c.otroPerroNombre}</strong>
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onQuitar(c.otroPerroId)}
              >
                Quitar
              </Button>
            </li>
          ))}
        </ul>
      )}

      {candidatos.length > 0 && (
        <form onSubmit={onMarcar} className="flex items-end gap-3 border-t border-border pt-4">
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="compat-perro">Marcar compatibilidad con</Label>
            <select
              id="compat-perro"
              value={seleccion}
              onChange={(e) => setSeleccion(e.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">Elegir perro…</option>
              {candidatos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={cargando || !seleccion}>
            {cargando ? 'Guardando…' : 'Marcar'}
          </Button>
        </form>
      )}

      {mensaje && (
        <p className={mensaje.tipo === 'ok' ? 'text-sm text-green-600' : 'text-sm text-destructive'}>
          {mensaje.texto}
        </p>
      )}
    </section>
  );
}
