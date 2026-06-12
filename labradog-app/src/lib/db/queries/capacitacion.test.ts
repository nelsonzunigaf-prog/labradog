/**
 * Test de DELEGACIÓN (AC2 de Story 2.2): la capa de queries consulta al motor
 * certificacion.ts para el gate de contenido — si alguien reimplementa la regla
 * aquí en vez de llamar al motor, estos tests fallan (spy sobre puedeAbrirEtapa
 * + verificación de que el veredicto del motor manda sobre la respuesta).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as certificacion from '../../engine/certificacion';

// Cola de resultados para el mock del chain de drizzle: cada db.select()
// consume el siguiente resultado en orden de llamada.
const { cola } = vi.hoisted(() => ({ cola: [] as unknown[][] }));

vi.mock('../index', () => {
  function consulta(): Record<string, unknown> {
    const filas = cola.shift() ?? [];
    const chain: Record<string, unknown> = {
      from: () => chain,
      where: () => chain,
      innerJoin: () => chain,
      orderBy: () => chain,
      then: (resolver: (filas: unknown[]) => unknown) => Promise.resolve(filas).then(resolver),
    };
    return chain;
  }
  return { db: { select: vi.fn(() => consulta()) } };
});

import { obtenerCapacitacionParaUsuario, obtenerEtapaParaUsuario } from './capacitacion';

const ETAPA_2 = {
  numero: 2,
  slug: 'seguridad-y-control-basico',
  titulo: 'Seguridad y control básico',
  modulo: 'Control',
  duracion: '20 minutos',
  esModuloRazas: false,
  contenidoMd: '# Contenido secreto de la etapa 2',
};

beforeEach(() => {
  cola.length = 0;
});

afterEach(() => {
  vi.restoreAllMocks();
});

const CATALOGO = [{ numero: 1 }, { numero: 2 }, { numero: 3 }];

describe('obtenerEtapaParaUsuario delega el gate al motor (AC2/AC5)', () => {
  it('consulta estadoDeEtapa con el numero, el catálogo real y los aprobados', async () => {
    const spy = vi.spyOn(certificacion, 'estadoDeEtapa');
    // orden de consultas: ficha, etapa, catálogo, aprobados
    cola.push([{ id: 'ficha-1' }], [ETAPA_2], CATALOGO, [{ numero: 1 }]);

    await obtenerEtapaParaUsuario('user-1', ETAPA_2.slug);

    expect(spy).toHaveBeenCalledWith(2, [1, 2, 3], new Set([1]));
  });

  it('si el motor dice bloqueada, la respuesta queda bloqueada y SIN contenido', async () => {
    vi.spyOn(certificacion, 'estadoDeEtapa').mockReturnValue('bloqueada');
    cola.push([{ id: 'ficha-1' }], [ETAPA_2], CATALOGO, []);

    const resultado = await obtenerEtapaParaUsuario('user-1', ETAPA_2.slug);

    expect(resultado).toEqual({ bloqueada: true, numero: 2, titulo: ETAPA_2.titulo });
    expect(JSON.stringify(resultado)).not.toContain('Contenido secreto');
  });

  it('si el motor dice actual/aprobada, la respuesta incluye el contenido con ese estado', async () => {
    vi.spyOn(certificacion, 'estadoDeEtapa').mockReturnValue('actual');
    cola.push([{ id: 'ficha-1' }], [ETAPA_2], CATALOGO, []);

    const resultado = await obtenerEtapaParaUsuario('user-1', ETAPA_2.slug);

    expect(resultado).toMatchObject({
      bloqueada: false,
      estado: 'actual',
      contenidoMd: ETAPA_2.contenidoMd,
    });
  });

  it('sin ficha de paseador retorna null sin consultar la etapa', async () => {
    cola.push([]); // sin ficha
    expect(await obtenerEtapaParaUsuario('user-sin-ficha', ETAPA_2.slug)).toBeNull();
  });

  it('slug inexistente retorna null', async () => {
    cola.push([{ id: 'ficha-1' }], []);
    expect(await obtenerEtapaParaUsuario('user-1', 'no-existe')).toBeNull();
  });
});

describe('obtenerCapacitacionParaUsuario delega los estados al motor (AC1/AC4)', () => {
  it('usa calcularEstadosEtapas y calcularAvance del motor', async () => {
    const spyEstados = vi.spyOn(certificacion, 'calcularEstadosEtapas');
    const spyAvance = vi.spyOn(certificacion, 'calcularAvance');
    cola.push(
      [{ id: 'ficha-1' }],
      [
        { numero: 1, slug: 'a', titulo: 'A', modulo: 'M', duracion: '5', tipoEvaluacion: 'test', esModuloRazas: false },
        { numero: 2, slug: 'b', titulo: 'B', modulo: 'M', duracion: '5', tipoEvaluacion: 'test', esModuloRazas: false },
      ],
      [{ numero: 1 }],
    );

    const resultado = await obtenerCapacitacionParaUsuario('user-1');

    expect(spyEstados).toHaveBeenCalledWith([1, 2], new Set([1]));
    expect(spyAvance).toHaveBeenCalledWith(new Set([1]), 2);
    expect(resultado?.etapas.map((e) => e.estado)).toEqual(['aprobada', 'actual']);
    expect(resultado?.avance).toEqual({ aprobadas: 1, total: 2 });
  });

  it('sin ficha retorna null', async () => {
    cola.push([]);
    expect(await obtenerCapacitacionParaUsuario('user-sin-ficha')).toBeNull();
  });
});
