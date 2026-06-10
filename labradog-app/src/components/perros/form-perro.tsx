'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { actualizarPerro, crearPerro } from '@/actions/perros';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { actualizarPerroSchema, crearPerroSchema } from '@/lib/validations/perros';

type DatosPerro = {
  nombre: string;
  raza: string;
  grupoRaza: 'trabajo_guardia' | 'pastora' | 'caza' | 'otro';
  edad: string; // string en el form; se convierte a number | undefined al enviar
  talla: 'pequena' | 'mediana' | 'grande';
  condicionFisica: string;
  temperamento: string;
  equipamiento: string;
  premiosAceptados: string;
  notasManejo: string;
  notasCriticas: boolean;
  estado: 'activo' | 'inactivo';
};

type Props = {
  /** Modo creación: tutor dueño. */
  tutorId?: string;
  /** Modo edición: la ficha existente (lock optimista con `version`). */
  perro?: DatosPerro & { id: string; version: number };
};

const SELECT_CLASS = 'h-8 rounded-lg border border-border bg-background px-2.5 text-sm';
const TEXTAREA_CLASS =
  'min-h-16 rounded-lg border border-border bg-background px-2.5 py-2 text-sm';

const VACIO: DatosPerro = {
  nombre: '',
  raza: '',
  grupoRaza: 'otro',
  edad: '',
  talla: 'mediana',
  condicionFisica: '',
  temperamento: '',
  equipamiento: '',
  premiosAceptados: '',
  notasManejo: '',
  notasCriticas: false,
  estado: 'activo',
};

export function FormPerro({ tutorId, perro }: Props) {
  const router = useRouter();
  const esEdicion = Boolean(perro);
  const [datos, setDatos] = useState<DatosPerro>(perro ?? VACIO);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [cargando, setCargando] = useState(false);

  function actualizar<K extends keyof DatosPerro>(campo: K, valor: DatosPerro[K]) {
    setDatos((d) => ({ ...d, [campo]: valor }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMensaje(null);

    const base = {
      ...datos,
      edad: datos.edad === '' ? undefined : Number(datos.edad),
    };

    const parseado =
      esEdicion && perro
        ? actualizarPerroSchema.safeParse({ ...base, id: perro.id, version: perro.version })
        : crearPerroSchema.safeParse({ ...base, tutorId });

    if (!parseado.success) {
      setMensaje({
        tipo: 'error',
        texto: parseado.error.issues[0]?.message ?? 'Datos inválidos',
      });
      return;
    }

    setCargando(true);
    const r =
      esEdicion && perro
        ? await actualizarPerro(parseado.data as Parameters<typeof actualizarPerro>[0])
        : await crearPerro(parseado.data as Parameters<typeof crearPerro>[0]);
    setCargando(false);

    if (!r.ok) {
      setMensaje({ tipo: 'error', texto: r.error });
      return;
    }

    if (esEdicion) {
      setMensaje({ tipo: 'ok', texto: 'Ficha actualizada.' });
      router.refresh();
    } else {
      setDatos(VACIO);
      setMensaje({ tipo: 'ok', texto: 'Perro agregado.' });
      router.refresh();
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-4 rounded-xl border border-border p-4"
    >
      <h3 className="text-sm font-medium">{esEdicion ? 'Perfil del perro' : 'Agregar perro'}</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="perro-nombre">Nombre</Label>
          <Input
            id="perro-nombre"
            value={datos.nombre}
            onChange={(e) => actualizar('nombre', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="perro-raza">Raza</Label>
          <Input
            id="perro-raza"
            value={datos.raza}
            onChange={(e) => actualizar('raza', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="perro-grupo">Grupo de raza</Label>
          <select
            id="perro-grupo"
            value={datos.grupoRaza}
            onChange={(e) => actualizar('grupoRaza', e.target.value as DatosPerro['grupoRaza'])}
            className={SELECT_CLASS}
          >
            <option value="trabajo_guardia">Trabajo / guardia</option>
            <option value="pastora">Pastora</option>
            <option value="caza">Caza</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="perro-edad">Edad (años, opcional)</Label>
          <Input
            id="perro-edad"
            type="number"
            min={0}
            max={30}
            value={datos.edad}
            onChange={(e) => actualizar('edad', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="perro-talla">Talla</Label>
          <select
            id="perro-talla"
            value={datos.talla}
            onChange={(e) => actualizar('talla', e.target.value as DatosPerro['talla'])}
            className={SELECT_CLASS}
          >
            <option value="pequena">Pequeña</option>
            <option value="mediana">Mediana</option>
            <option value="grande">Grande</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="perro-estado">Estado</Label>
          <select
            id="perro-estado"
            value={datos.estado}
            onChange={(e) => actualizar('estado', e.target.value as DatosPerro['estado'])}
            className={SELECT_CLASS}
          >
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="perro-condicion">Condición física</Label>
          <Input
            id="perro-condicion"
            value={datos.condicionFisica}
            onChange={(e) => actualizar('condicionFisica', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="perro-temperamento">Temperamento</Label>
          <Input
            id="perro-temperamento"
            value={datos.temperamento}
            onChange={(e) => actualizar('temperamento', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="perro-equipamiento">Equipamiento (arnés/correa)</Label>
          <Input
            id="perro-equipamiento"
            value={datos.equipamiento}
            onChange={(e) => actualizar('equipamiento', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="perro-premios">Premios aceptados</Label>
          <Input
            id="perro-premios"
            value={datos.premiosAceptados}
            onChange={(e) => actualizar('premiosAceptados', e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="perro-notas">Notas de manejo</Label>
        <textarea
          id="perro-notas"
          value={datos.notasManejo}
          onChange={(e) => actualizar('notasManejo', e.target.value)}
          className={TEXTAREA_CLASS}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={datos.notasCriticas}
            onChange={(e) => actualizar('notasCriticas', e.target.checked)}
          />
          Notas críticas (el paseador las verá destacadas, sin scroll)
        </label>
      </div>

      {mensaje && (
        <p className={mensaje.tipo === 'ok' ? 'text-sm text-green-600' : 'text-sm text-destructive'}>
          {mensaje.texto}
        </p>
      )}

      <Button type="submit" disabled={cargando}>
        {cargando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Agregar perro'}
      </Button>
    </form>
  );
}
