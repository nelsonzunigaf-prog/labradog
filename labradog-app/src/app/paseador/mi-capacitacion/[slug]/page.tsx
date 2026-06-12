/**
 * Detalle de una etapa de capacitación (Story 2.2) — contenido markdown
 * renderizado con react-markdown (Server Component, sin dangerouslySetInnerHTML).
 * El gate vive en el servidor: si el motor dice bloqueada, la query no entrega
 * contenido y aquí solo se muestra el mensaje (AC5). La pauta del evaluador
 * (pauta_md) NUNCA se muestra al paseador (es de 2.4).
 */
import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Lock } from 'lucide-react';
import { auth } from '@/lib/auth';
import { obtenerEtapaParaUsuario } from '@/lib/db/queries/capacitacion';

export default async function EtapaCapacitacion({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) redirect('/login');

  const { slug } = await params;
  const etapa = await obtenerEtapaParaUsuario(sesion.user.id, slug);
  if (!etapa) notFound();

  if (etapa.bloqueada) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4">
        <Link href="/paseador/mi-capacitacion" className="text-sm text-muted-foreground">
          ← Mi capacitación
        </Link>
        <div className="flex flex-col items-center gap-3 rounded-lg border p-8 text-center">
          <Lock className="size-8 text-muted-foreground" aria-hidden />
          <h1 className="text-lg font-semibold">{etapa.titulo}</h1>
          <p className="text-sm text-muted-foreground" data-testid="mensaje-bloqueada">
            Aprueba la etapa anterior para desbloquear esta.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4">
      <header>
        <Link href="/paseador/mi-capacitacion" className="text-sm text-muted-foreground">
          ← Mi capacitación
        </Link>
        <p className="mt-2 text-xs text-muted-foreground">
          {etapa.esModuloRazas ? 'Módulo razas' : `Etapa ${etapa.numero}`} · {etapa.duracion}
        </p>
      </header>

      <article data-testid="contenido-etapa" className="pb-8 text-[15px] leading-relaxed">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: (props) => (
              <h1 className="mt-2 mb-4 text-2xl font-semibold tracking-tight" {...props} />
            ),
            h2: (props) => <h2 className="mt-8 mb-3 text-xl font-semibold" {...props} />,
            h3: (props) => <h3 className="mt-6 mb-2 text-lg font-medium" {...props} />,
            h4: (props) => <h4 className="mt-4 mb-2 font-medium" {...props} />,
            p: (props) => <p className="my-3" {...props} />,
            ul: (props) => <ul className="my-3 list-disc space-y-1 pl-5" {...props} />,
            ol: (props) => <ol className="my-3 list-decimal space-y-1 pl-5" {...props} />,
            blockquote: (props) => (
              <blockquote
                className="my-4 border-l-4 border-primary/50 bg-muted/50 px-4 py-2 italic"
                {...props}
              />
            ),
            table: (props) => (
              <div className="my-4 overflow-x-auto">
                <table className="w-full border-collapse text-sm" {...props} />
              </div>
            ),
            th: (props) => (
              <th className="border bg-muted px-2 py-1.5 text-left font-medium" {...props} />
            ),
            td: (props) => <td className="border px-2 py-1.5 align-top" {...props} />,
            hr: () => <hr className="my-6" />,
          }}
        >
          {etapa.contenidoMd}
        </ReactMarkdown>
      </article>
    </main>
  );
}
