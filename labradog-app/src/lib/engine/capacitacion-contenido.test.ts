/**
 * Guardarraíl de CI sobre el contenido curado de capacitación (Story 2.1):
 * si alguien edita mal un JSON/markdown de scripts/seed-data/capacitacion/,
 * este test rompe ANTES de que el seed llegue a Neon.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { TIPOS_EVALUACION, type TipoEvaluacion } from './capacitacion';

const base = (ruta: string) =>
  fileURLToPath(new URL(`../../../scripts/seed-data/capacitacion/${ruta}`, import.meta.url));
const leerJson = (ruta: string) => JSON.parse(readFileSync(base(ruta), 'utf8'));
const leerTexto = (ruta: string) => readFileSync(base(ruta), 'utf8');

type EtapaManifest = {
  numero: number;
  slug: string;
  titulo: string;
  modulo: string;
  objetivo: string;
  duracion: string;
  tipo_evaluacion: TipoEvaluacion;
  archivo_contenido: string;
  archivo_pauta?: string;
};

const programa = leerJson('programa.json');
const testsData = leerJson('tests.json');
const banco = leerJson('banco-examen.json');

describe('programa.json (manifest del programa)', () => {
  it('tiene exactamente 9 etapas numeradas 1-9 + módulo razas', () => {
    const etapas: EtapaManifest[] = programa.etapas;
    expect(etapas).toHaveLength(9);
    expect(etapas.map((e) => e.numero)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(programa.modulo_razas.slug).toBeTruthy();
    expect(programa.modulo_razas.archivo_contenido).toBeTruthy();
  });

  it('cada etapa tiene los campos obligatorios y tipo_evaluacion del catálogo', () => {
    for (const e of programa.etapas as EtapaManifest[]) {
      expect(e.slug, `etapa ${e.numero}`).toBeTruthy();
      expect(e.titulo, `etapa ${e.numero}`).toBeTruthy();
      expect(e.modulo, `etapa ${e.numero}`).toBeTruthy();
      expect(e.objetivo, `etapa ${e.numero}`).toBeTruthy();
      expect(e.duracion, `etapa ${e.numero}`).toBeTruthy();
      expect(TIPOS_EVALUACION, `etapa ${e.numero}`).toContain(e.tipo_evaluacion);
    }
  });

  it('las etapas con test (1/2/3/5) y las prácticas con pauta (4/6/7/8) son las del epic', () => {
    const etapas: EtapaManifest[] = programa.etapas;
    const conTest = etapas
      .filter((e) => e.tipo_evaluacion === 'test' || e.tipo_evaluacion === 'test_y_practica')
      .map((e) => e.numero);
    const conPauta = etapas.filter((e) => e.archivo_pauta).map((e) => e.numero);
    expect(conTest).toEqual([1, 2, 3, 5]);
    expect(conPauta).toEqual([4, 6, 7, 8]);
  });

  it('todos los archivos de contenido y pautas existen y no están vacíos', () => {
    const archivos = [
      ...(programa.etapas as EtapaManifest[]).map((e) => e.archivo_contenido),
      ...(programa.etapas as EtapaManifest[]).flatMap((e) => (e.archivo_pauta ? [e.archivo_pauta] : [])),
      programa.modulo_razas.archivo_contenido,
    ];
    expect(archivos).toHaveLength(14); // 9 contenidos + 4 pautas + módulo razas
    for (const a of archivos) {
      expect(leerTexto(a).trim().length, a).toBeGreaterThan(100);
    }
  });
});

describe('tests.json (tests V/F de etapas)', () => {
  it('trae exactamente los tests de las etapas 1, 2, 3 y 5', () => {
    expect(
      testsData.tests.map((t: { etapa: number }) => t.etapa).sort((a: number, b: number) => a - b),
    ).toEqual([1, 2, 3, 5]);
  });

  it('cada test tiene 30 preguntas con texto, unidad y respuesta booleana', () => {
    for (const t of testsData.tests) {
      expect(t.preguntas, `test etapa ${t.etapa}`).toHaveLength(30);
      for (const [i, p] of t.preguntas.entries()) {
        expect(p.texto?.trim(), `etapa ${t.etapa} #${i + 1}`).toBeTruthy();
        expect(p.unidad?.trim(), `etapa ${t.etapa} #${i + 1}`).toBeTruthy();
        expect(typeof p.respuesta, `etapa ${t.etapa} #${i + 1}`).toBe('boolean');
      }
    }
  });
});

describe('banco-examen.json (banco de 100 preguntas)', () => {
  it('trae 100 preguntas con números 1-100 únicos', () => {
    expect(banco.preguntas).toHaveLength(100);
    const numeros = banco.preguntas.map((p: { numero: number }) => p.numero);
    expect(new Set(numeros).size).toBe(100);
    expect(Math.min(...numeros)).toBe(1);
    expect(Math.max(...numeros)).toBe(100);
  });

  it('cada pregunta tiene categoría, texto, 3 alternativas y correcta 0-2', () => {
    for (const p of banco.preguntas) {
      expect(p.categoria?.trim(), `pregunta ${p.numero}`).toBeTruthy();
      expect(p.texto?.trim(), `pregunta ${p.numero}`).toBeTruthy();
      expect(p.alternativas, `pregunta ${p.numero}`).toHaveLength(3);
      expect(Number.isInteger(p.correcta), `pregunta ${p.numero}`).toBe(true);
      expect(p.correcta, `pregunta ${p.numero}`).toBeGreaterThanOrEqual(0);
      expect(p.correcta, `pregunta ${p.numero}`).toBeLessThanOrEqual(2);
    }
  });
});
