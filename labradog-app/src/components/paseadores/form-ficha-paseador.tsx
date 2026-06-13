'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { actualizarFichaPaseador, crearFichaPaseador } from '@/actions/paseadores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ESPECIALIDADES_CAMINATA,
  ETIQUETAS_ESPECIALIDAD,
  type EspecialidadCaminata,
} from '@/lib/engine/fichas';
import {
  actualizarFichaPaseadorSchema,
  fichaPaseadorSchema,
} from '@/lib/validations/paseadores';

type Datos = {
  telefono: string;
  especialidades: EspecialidadCaminata[];
  comisionPct: string; // string en el form; se convierte a number al enviar
  notas: string;
};

type Props = {
  /** Cuenta dueña de la ficha (modo creación cuando no hay `ficha`). */
  userId: string;
  /** Ficha existente (modo edición, lock optimista con `version`). */
  ficha?: Datos & { id: string; version: number };
};

const TEXTAREA_CLASS =
  'min-h-16 rounded-lg border border-border bg-background px-2.5 py-2 text-sm';

const VACIO: Datos = { telefono: '', especialidades: [], comisionPct: '70', notas: '' };

export function FormFichaPaseador({ userId, ficha }: Props) {
  const router = useRouter();
  const esEdicion = Boolean(ficha);
  const [datos, setDatos] = useState<Datos>(ficha ?? VACIO);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [cargando, setCargando] = useState(false);

  function toggleEspecialidad(e: EspecialidadCaminata, marcada: boolean) {
    setDatos((d) => ({
      ...d,
      especialidades: marcada
        ? [...d.especialidades, e]
        : d.especialidades.filter((x) => x !== e),
    }));
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setMensaje(null);

    const base = {
      telefono: datos.telefono,
      especialidades: datos.especialidades,
      comisionPct: datos.comisionPct === '' ? Number.NaN : Number(datos.comisionPct),
      notas: datos.notas,
    };

    const parseado =
      esEdicion && ficha
        ? actualizarFichaPaseadorSchema.safeParse({ ...base, id: ficha.id, version: ficha.version })
        : fichaPaseadorSchema.safeParse({ ...base, userId });

    if (!parseado.success) {
      setMensaje({
        tipo: 'error',
        texto: parseado.error.issues[0]?.message ?? 'Datos inválidos',
      });
      return;
    }

    setCargando(true);
    const r =
      esEdicion && ficha
        ? await actualizarFichaPaseador(
            parseado.data as Parameters<typeof actualizarFichaPaseador>[0],
          )
        : await crearFichaPaseador(parseado.data as Parameters<typeof crearFichaPaseador>[0]);
    setCargando(false);

    if (!r.ok) {
      setMensaje({ tipo: 'error', texto: r.error });
      return;
    }

    setMensaje({ tipo: 'ok', texto: esEdicion ? 'Ficha actualizada.' : 'Ficha creada.' });
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-sm"
    >
      <h2 className="text-base font-semibold">{esEdicion ? 'Datos de la ficha' : 'Crear ficha'}</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="pas-telefono">Teléfono</Label>
          <Input
            id="pas-telefono"
            value={datos.telefono}
            onChange={(e) => setDatos((d) => ({ ...d, telefono: e.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pas-comision">% de comisión (60–80)</Label>
          <Input
            id="pas-comision"
            type="number"
            min={60}
            max={80}
            value={datos.comisionPct}
            onChange={(e) => setDatos((d) => ({ ...d, comisionPct: e.target.value }))}
          />
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Especialidades de caminata</legend>
        {ESPECIALIDADES_CAMINATA.map((e) => (
          <label key={e} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={datos.especialidades.includes(e)}
              onChange={(ev) => toggleEspecialidad(e, ev.target.checked)}
            />
            {ETIQUETAS_ESPECIALIDAD[e]}
          </label>
        ))}
        <p className="text-xs text-muted-foreground">
          Informan la asignación de paseos sin bloquearla.
        </p>
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="pas-notas">Notas</Label>
        <textarea
          id="pas-notas"
          value={datos.notas}
          onChange={(e) => setDatos((d) => ({ ...d, notas: e.target.value }))}
          className={TEXTAREA_CLASS}
        />
      </div>

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
        {cargando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear ficha'}
      </Button>
    </form>
  );
}
