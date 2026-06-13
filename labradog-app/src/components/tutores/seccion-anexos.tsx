'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { registrarAnexo, subirAnexoPdf } from '@/actions/tutores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Anexo = {
  id: string;
  tipo: 'limites_servicio' | 'compromiso_etico';
  fechaAceptacion: string;
  medio: 'papel' | 'pdf';
  /** URL pública del PDF (la arma el server con storage.urlPublica); null si no hay. */
  pdfUrl: string | null;
};

type Props = {
  tutorId: string;
  anexos: Anexo[];
};

const ETIQUETA_TIPO: Record<Anexo['tipo'], string> = {
  limites_servicio: 'Límites del servicio',
  compromiso_etico: 'Compromiso ético',
};

const SELECT_CLASS = 'h-8 rounded-lg border border-border bg-background px-2.5 text-sm';

export function SeccionAnexos({ tutorId, anexos }: Props) {
  const router = useRouter();
  const [tipo, setTipo] = useState<Anexo['tipo']>('limites_servicio');
  const [fechaAceptacion, setFecha] = useState('');
  const [medio, setMedio] = useState<Anexo['medio']>('papel');
  const [pdf, setPdf] = useState<File | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMensaje(null);
    setCargando(true);

    let pdfKey: string | undefined;
    if (pdf) {
      const fd = new FormData();
      fd.set('pdf', pdf);
      fd.set('tutorId', tutorId);
      fd.set('tipo', tipo);
      const subida = await subirAnexoPdf(fd);
      if (!subida.ok) {
        setCargando(false);
        setMensaje({ tipo: 'error', texto: subida.error });
        return;
      }
      pdfKey = subida.key;
    }

    const r = await registrarAnexo({ tutorId, tipo, fechaAceptacion, medio, pdfKey });
    setCargando(false);

    if (!r.ok) {
      setMensaje({ tipo: 'error', texto: r.error });
      return;
    }
    setMensaje({ tipo: 'ok', texto: 'Anexo registrado.' });
    setPdf(null);
    setFecha('');
    router.refresh();
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-sm">
      <h2 className="text-base font-semibold">Anexos legales</h2>

      {anexos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no hay anexos registrados.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {anexos.map((a) => (
            <li key={a.id} className="flex items-center justify-between text-sm">
              <span>
                <strong>{ETIQUETA_TIPO[a.tipo]}</strong> — {a.fechaAceptacion} ({a.medio})
              </span>
              {a.pdfUrl && (
                <a
                  href={a.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-deep underline-offset-4 hover:underline"
                >
                  Ver PDF
                </a>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4 border-t border-border pt-4">
        <h3 className="text-sm font-medium">Registrar anexo</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="tipo">Tipo</Label>
            <select
              id="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as Anexo['tipo'])}
              className={SELECT_CLASS}
            >
              <option value="limites_servicio">Límites del servicio</option>
              <option value="compromiso_etico">Compromiso ético</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="fechaAceptacion">Fecha de aceptación</Label>
            <Input
              id="fechaAceptacion"
              type="date"
              value={fechaAceptacion}
              onChange={(e) => setFecha(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="medio">Medio</Label>
            <select
              id="medio"
              value={medio}
              onChange={(e) => setMedio(e.target.value as Anexo['medio'])}
              className={SELECT_CLASS}
            >
              <option value="papel">Papel</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pdf">PDF escaneado (opcional)</Label>
            <input
              id="pdf"
              type="file"
              accept="application/pdf"
              onChange={(e) => setPdf(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
          </div>
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
          {cargando ? 'Guardando…' : 'Registrar anexo'}
        </Button>
      </form>
    </section>
  );
}
