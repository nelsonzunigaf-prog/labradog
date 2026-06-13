'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { subirFotoPerro } from '@/actions/perros';
import { Label } from '@/components/ui/label';
import { comprimirImagen } from '@/lib/comprimir-imagen';

type Props = {
  perroId: string;
  nombre: string;
  /** URL pública resuelta en el server (null si no hay foto). */
  fotoUrl: string | null;
};

/**
 * Foto del perro: primer uso real del pipeline 1.4 — comprime en el CLIENTE
 * (WebP ≤1600px ≤400KB) y sube vía la action (storage.ts → R2). En dev sin R2
 * la subida es no-op (la foto no se verá, pero el flujo no se rompe).
 */
export function FotoPerro({ perroId, nombre, fotoUrl }: Props) {
  const router = useRouter();
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMensaje(null);
    setCargando(true);

    try {
      const comprimida = await comprimirImagen(file);
      const fd = new FormData();
      fd.set('foto', comprimida, 'foto.webp');
      fd.set('perroId', perroId);
      const r = await subirFotoPerro(fd);

      if (!r.ok) {
        setMensaje({ tipo: 'error', texto: r.error });
      } else {
        setMensaje({ tipo: 'ok', texto: 'Foto actualizada.' });
        router.refresh();
      }
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se pudo procesar la imagen.' });
    } finally {
      setCargando(false);
      e.target.value = '';
    }
  }

  return (
    <div className="flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm">
      {fotoUrl ? (
        <Image
          src={fotoUrl}
          alt={`Foto de ${nombre}`}
          width={80}
          height={80}
          unoptimized
          className="size-20 rounded-full object-cover"
        />
      ) : (
        <span className="flex size-20 items-center justify-center rounded-full bg-muted text-3xl">
          🐕
        </span>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="foto-perro">{cargando ? 'Subiendo…' : 'Cambiar foto'}</Label>
        <input
          id="foto-perro"
          type="file"
          accept="image/*"
          disabled={cargando}
          onChange={onArchivo}
          className="text-sm"
        />
        {mensaje && (
          <p
            className={
              mensaje.tipo === 'ok' ? 'text-sm text-success' : 'text-sm text-destructive-text'
            }
          >
            {mensaje.texto}
          </p>
        )}
      </div>
    </div>
  );
}
