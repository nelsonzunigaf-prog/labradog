'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { desactivarCuenta, reactivarCuenta } from '@/actions/cuentas';
import { Button } from '@/components/ui/button';

type Props = {
  userId: string;
  estado: string;
  /** true si la fila corresponde al admin en sesión (no puede auto-desactivarse) */
  esYoMismo: boolean;
};

export function AccionesCuenta({ userId, estado, esYoMismo }: Props) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ejecutar(accion: 'desactivar' | 'reactivar') {
    if (accion === 'desactivar' && !confirm('¿Desactivar esta cuenta? No podrá iniciar sesión.')) {
      return;
    }
    setError(null);
    setCargando(true);
    const r = accion === 'desactivar'
      ? await desactivarCuenta({ userId })
      : await reactivarCuenta({ userId });
    setCargando(false);

    if (!r.ok) {
      setError(r.error);
      return;
    }
    router.refresh();
  }

  if (estado === 'activo') {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button
          variant="destructive"
          size="sm"
          disabled={cargando || esYoMismo}
          title={esYoMismo ? 'No puedes desactivar tu propia cuenta' : undefined}
          onClick={() => ejecutar('desactivar')}
        >
          Desactivar
        </Button>
        {error && <span className="text-xs text-destructive-text">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" size="sm" disabled={cargando} onClick={() => ejecutar('reactivar')}>
        Reactivar
      </Button>
      {error && <span className="text-xs text-destructive-text">{error}</span>}
    </div>
  );
}
