'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { registrarEntrevista } from '@/actions/tutores';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  ETIQUETAS_RED_FLAG,
  RED_FLAGS_TUTOR,
  evaluarRedFlags,
  type RedFlagTutor,
} from '@/lib/engine/fichas';

type Props = {
  tutorId: string;
  version: number;
  inicial: {
    historial: string;
    reactividad: string;
    escapes: string;
    equipamiento: string;
    expectativas: string;
    redFlags: RedFlagTutor[];
  };
};

const TEXTAREA_CLASS =
  'min-h-20 rounded-lg border border-border bg-background px-2.5 py-2 text-sm';

export function SeccionEntrevista({ tutorId, version, inicial }: Props) {
  const router = useRouter();
  const [campos, setCampos] = useState({
    historial: inicial.historial,
    reactividad: inicial.reactividad,
    escapes: inicial.escapes,
    equipamiento: inicial.equipamiento,
    expectativas: inicial.expectativas,
  });
  const [redFlags, setRedFlags] = useState<RedFlagTutor[]>(inicial.redFlags);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [cargando, setCargando] = useState(false);

  // Alerta en vivo (FR-005): la regla es pura, se evalúa en el cliente.
  const { sugerirRechazo, cantidad } = evaluarRedFlags(redFlags);

  function toggleRedFlag(rf: RedFlagTutor, marcado: boolean) {
    setRedFlags((actuales) =>
      marcado ? [...actuales, rf] : actuales.filter((x) => x !== rf),
    );
  }

  function actualizar(campo: keyof typeof campos, valor: string) {
    setCampos((c) => ({ ...c, [campo]: valor }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMensaje(null);
    setCargando(true);

    const r = await registrarEntrevista({ id: tutorId, version, ...campos, redFlags });

    setCargando(false);

    if (!r.ok) {
      setMensaje({ tipo: 'error', texto: r.error });
      return;
    }
    setMensaje({ tipo: 'ok', texto: 'Entrevista guardada.' });
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-sm"
    >
      <h2 className="text-base font-semibold">Entrevista inicial</h2>

      {(
        [
          ['historial', 'Historial del perro'],
          ['reactividad', 'Reactividad'],
          ['escapes', 'Escapes previos'],
          ['equipamiento', 'Equipamiento'],
          ['expectativas', 'Expectativas'],
        ] as const
      ).map(([campo, etiqueta]) => (
        <div key={campo} className="flex flex-col gap-2">
          <Label htmlFor={campo}>{etiqueta}</Label>
          <textarea
            id={campo}
            value={campos[campo]}
            onChange={(e) => actualizar(campo, e.target.value)}
            className={TEXTAREA_CLASS}
          />
        </div>
      ))}

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Red flags detectadas</legend>
        {RED_FLAGS_TUTOR.map((rf) => (
          <label key={rf} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={redFlags.includes(rf)}
              onChange={(e) => toggleRedFlag(rf, e.target.checked)}
            />
            {ETIQUETAS_RED_FLAG[rf]}
          </label>
        ))}
      </fieldset>

      {sugerirRechazo && (
        <p
          role="alert"
          className="rounded-lg bg-warning px-3 py-2 text-sm font-medium text-warning-foreground"
        >
          ⚠️ Evaluar rechazo del servicio ({cantidad} red flags)
        </p>
      )}

      {mensaje && (
        <p
          className={
            mensaje.tipo === 'ok' ? 'text-sm text-success' : 'text-sm text-destructive-text'
          }
        >
          {mensaje.texto}
        </p>
      )}

      <Button type="submit" disabled={cargando}>
        {cargando ? 'Guardando…' : 'Guardar entrevista'}
      </Button>
    </form>
  );
}
