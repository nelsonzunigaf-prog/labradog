'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { actualizarTutor, crearTutor } from '@/actions/tutores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type DatosTutor = {
  nombre: string;
  telefono: string;
  email: string;
  direccionRetiro: string;
  planDefault: 'base' | 'plus' | 'elite';
  cobroPeriodicidad: 'por_paseo' | 'semanal' | 'mensual';
  cobroTiempo: 'prepago' | 'postpago';
  estado: 'activo' | 'pausado' | 'cerrado';
};

type Props = {
  /** Si viene, el form edita esa ficha (lock optimista con `version`). */
  tutor?: DatosTutor & { id: string; version: number };
};

const SELECT_CLASS = 'h-8 rounded-lg border border-border bg-background px-2.5 text-sm';

const VACIO: DatosTutor = {
  nombre: '',
  telefono: '',
  email: '',
  direccionRetiro: '',
  planDefault: 'base',
  cobroPeriodicidad: 'mensual',
  cobroTiempo: 'postpago',
  estado: 'activo',
};

export function FormTutor({ tutor }: Props) {
  const router = useRouter();
  const esEdicion = Boolean(tutor);
  const [datos, setDatos] = useState<DatosTutor>(tutor ?? VACIO);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [cargando, setCargando] = useState(false);

  function actualizar<K extends keyof DatosTutor>(campo: K, valor: DatosTutor[K]) {
    setDatos((d) => ({ ...d, [campo]: valor }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMensaje(null);
    setCargando(true);

    const r =
      esEdicion && tutor
        ? await actualizarTutor({ ...datos, id: tutor.id, version: tutor.version })
        : await crearTutor(datos);

    setCargando(false);

    if (!r.ok) {
      setMensaje({ tipo: 'error', texto: r.error });
      return;
    }

    if (esEdicion) {
      setMensaje({ tipo: 'ok', texto: 'Ficha actualizada.' });
      router.refresh();
    } else {
      router.push(`/admin/tutores/${r.data.id}`);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-xl border border-border p-4">
      <h2 className="text-lg font-medium">{esEdicion ? 'Datos de la ficha' : 'Nueva ficha'}</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            value={datos.nombre}
            onChange={(e) => actualizar('nombre', e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input
            id="telefono"
            value={datos.telefono}
            onChange={(e) => actualizar('telefono', e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email (opcional)</Label>
          <Input
            id="email"
            type="email"
            value={datos.email}
            onChange={(e) => actualizar('email', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="direccionRetiro">Dirección de retiro</Label>
          <Input
            id="direccionRetiro"
            value={datos.direccionRetiro}
            onChange={(e) => actualizar('direccionRetiro', e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="planDefault">Plan por defecto</Label>
          <select
            id="planDefault"
            value={datos.planDefault}
            onChange={(e) => actualizar('planDefault', e.target.value as DatosTutor['planDefault'])}
            className={SELECT_CLASS}
          >
            <option value="base">BASE</option>
            <option value="plus">PLUS</option>
            <option value="elite">ELITE</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="estado">Estado</Label>
          <select
            id="estado"
            value={datos.estado}
            onChange={(e) => actualizar('estado', e.target.value as DatosTutor['estado'])}
            className={SELECT_CLASS}
          >
            <option value="activo">Activo</option>
            <option value="pausado">Pausado</option>
            <option value="cerrado">Cerrado</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="cobroPeriodicidad">Periodicidad de cobro</Label>
          <select
            id="cobroPeriodicidad"
            value={datos.cobroPeriodicidad}
            onChange={(e) =>
              actualizar('cobroPeriodicidad', e.target.value as DatosTutor['cobroPeriodicidad'])
            }
            className={SELECT_CLASS}
          >
            <option value="por_paseo">Por paseo</option>
            <option value="semanal">Semanal</option>
            <option value="mensual">Mensual</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="cobroTiempo">Momento de cobro</Label>
          <select
            id="cobroTiempo"
            value={datos.cobroTiempo}
            onChange={(e) => actualizar('cobroTiempo', e.target.value as DatosTutor['cobroTiempo'])}
            className={SELECT_CLASS}
          >
            <option value="prepago">Prepago</option>
            <option value="postpago">Postpago</option>
          </select>
        </div>
      </div>

      {mensaje && (
        <p className={mensaje.tipo === 'ok' ? 'text-sm text-green-600' : 'text-sm text-destructive'}>
          {mensaje.texto}
        </p>
      )}

      <Button type="submit" disabled={cargando}>
        {cargando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear ficha'}
      </Button>
    </form>
  );
}
