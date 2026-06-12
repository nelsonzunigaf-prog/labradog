// Seed del contenido de capacitación (Story 2.1) — carga el programa curado de
// scripts/seed-data/capacitacion/ (derivado de los Word) en las tablas de
// contenido: etapas (9 + módulo razas como numero 10), preguntas_etapa (tests
// V/F de etapas 1/2/3/5) y preguntas_examen (banco de 100).
//
// IDEMPOTENTE: upsert por clave natural (etapas.numero, (etapa_id, orden),
// preguntas_examen.numero) con ON CONFLICT ... DO UPDATE ... WHERE <difiere>.
// Re-ejecutar produce 0 filas nuevas; si el contenido curado cambió, actualiza
// en su lugar. Reporta insertadas / actualizadas / sin cambios por tabla.
//
// Uso:  node scripts/seed-capacitacion.mjs   (o: npm run db:seed-capacitacion)
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

const ACTOR = 'sistema';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL no está definida (ver .env.example)');
  process.exit(1);
}

// ── Carga de fuentes (relativas a este script) ─────────────────────────────

const base = (ruta) => new URL(`./seed-data/capacitacion/${ruta}`, import.meta.url);
const leerJson = (ruta) => JSON.parse(readFileSync(base(ruta), 'utf8'));
const leerTexto = (ruta) => readFileSync(base(ruta), 'utf8');

const programa = leerJson('programa.json');
const testsData = leerJson('tests.json');
const banco = leerJson('banco-examen.json');

// ── Validación previa (fail-fast: exit 1 sin tocar la BD) ──────────────────

const TIPOS_EVALUACION = ['test', 'practica', 'test_y_practica', 'examen_final'];
const ETAPAS_CON_TEST = [1, 2, 3, 5];
const errores = [];

if (!Array.isArray(programa.etapas) || programa.etapas.length !== 9) {
  errores.push(`programa.json debe tener 9 etapas (tiene ${programa.etapas?.length ?? 0})`);
}
if (!programa.modulo_razas?.archivo_contenido) {
  errores.push('programa.json debe incluir modulo_razas con archivo_contenido');
}

// Filas de `etapas`: las 9 del manifest + módulo razas como numero 10.
const filasEtapas = [
  ...(programa.etapas ?? []).map((e) => ({
    numero: e.numero,
    slug: e.slug,
    titulo: e.titulo,
    modulo: e.modulo,
    objetivo: e.objetivo,
    duracion: e.duracion,
    tipoEvaluacion: e.tipo_evaluacion,
    esModuloRazas: false,
    contenidoMd: leerTexto(e.archivo_contenido),
    pautaMd: e.archivo_pauta ? leerTexto(e.archivo_pauta) : null,
  })),
  ...(programa.modulo_razas
    ? [
        {
          numero: 10,
          slug: programa.modulo_razas.slug,
          titulo: programa.modulo_razas.titulo,
          modulo: 'Razas',
          objetivo: programa.modulo_razas.objetivo,
          duracion: programa.modulo_razas.duracion,
          tipoEvaluacion: 'practica',
          esModuloRazas: true,
          contenidoMd: leerTexto(programa.modulo_razas.archivo_contenido),
          pautaMd: null,
        },
      ]
    : []),
];

for (const e of filasEtapas) {
  if (!e.contenidoMd?.trim()) errores.push(`etapa ${e.numero}: contenido vacío`);
  if (!TIPOS_EVALUACION.includes(e.tipoEvaluacion)) {
    errores.push(`etapa ${e.numero}: tipo_evaluacion inválido '${e.tipoEvaluacion}'`);
  }
}

const numerosConTest = (testsData.tests ?? []).map((t) => t.etapa).sort();
if (JSON.stringify(numerosConTest) !== JSON.stringify(ETAPAS_CON_TEST)) {
  errores.push(`tests.json debe traer los tests de las etapas 1/2/3/5 (trae: ${numerosConTest})`);
}
for (const t of testsData.tests ?? []) {
  if (t.preguntas?.length !== 30) {
    errores.push(`test etapa ${t.etapa}: deben ser 30 preguntas (hay ${t.preguntas?.length ?? 0})`);
  }
  for (const [i, p] of (t.preguntas ?? []).entries()) {
    if (typeof p.respuesta !== 'boolean' || !p.texto?.trim() || !p.unidad?.trim()) {
      errores.push(`test etapa ${t.etapa}, pregunta ${i + 1}: texto/unidad/respuesta inválidos`);
    }
  }
}

if (banco.preguntas?.length !== 100) {
  errores.push(`banco-examen.json debe traer 100 preguntas (trae ${banco.preguntas?.length ?? 0})`);
}
const numerosBanco = new Set();
for (const p of banco.preguntas ?? []) {
  if (numerosBanco.has(p.numero)) errores.push(`banco: numero ${p.numero} duplicado`);
  numerosBanco.add(p.numero);
  if (p.alternativas?.length !== 3) errores.push(`banco pregunta ${p.numero}: deben ser 3 alternativas`);
  if (!Number.isInteger(p.correcta) || p.correcta < 0 || p.correcta > 2) {
    errores.push(`banco pregunta ${p.numero}: correcta debe ser 0, 1 o 2 (es ${p.correcta})`);
  }
}

if (errores.length > 0) {
  console.error('❌ Contenido curado inválido — no se tocó la base de datos:');
  for (const e of errores) console.error(`  - ${e}`);
  process.exit(1);
}

// ── Upserts (clasifica cada fila: insertada / actualizada / sin cambios) ───
// RETURNING (xmax = 0): true = INSERT real, false = UPDATE; si el WHERE del
// DO UPDATE no aplica (nada difiere), el statement no retorna fila → sin cambios.

const sql = neon(process.env.DATABASE_URL);
const conteo = { etapas: vacio(), preguntas_etapa: vacio(), preguntas_examen: vacio() };

function vacio() {
  return { insertadas: 0, actualizadas: 0, sinCambios: 0 };
}

function clasificar(tabla, filas) {
  if (filas.length === 0) conteo[tabla].sinCambios += 1;
  else if (filas[0].insertada) conteo[tabla].insertadas += 1;
  else conteo[tabla].actualizadas += 1;
}

try {
  // Fase 1: etapas (en una transacción)
  const resEtapas = await sql.transaction(
    filasEtapas.map(
      (e) => sql`
        INSERT INTO etapas (numero, slug, titulo, modulo, objetivo, duracion,
          tipo_evaluacion, es_modulo_razas, contenido_md, pauta_md, created_by, updated_by)
        VALUES (${e.numero}, ${e.slug}, ${e.titulo}, ${e.modulo}, ${e.objetivo}, ${e.duracion},
          ${e.tipoEvaluacion}, ${e.esModuloRazas}, ${e.contenidoMd}, ${e.pautaMd}, ${ACTOR}, ${ACTOR})
        ON CONFLICT (numero) DO UPDATE SET
          slug = EXCLUDED.slug, titulo = EXCLUDED.titulo, modulo = EXCLUDED.modulo,
          objetivo = EXCLUDED.objetivo, duracion = EXCLUDED.duracion,
          tipo_evaluacion = EXCLUDED.tipo_evaluacion, es_modulo_razas = EXCLUDED.es_modulo_razas,
          contenido_md = EXCLUDED.contenido_md, pauta_md = EXCLUDED.pauta_md,
          updated_by = ${ACTOR}, updated_at = now()
        WHERE (etapas.slug, etapas.titulo, etapas.modulo, etapas.objetivo, etapas.duracion,
               etapas.tipo_evaluacion, etapas.es_modulo_razas, etapas.contenido_md)
              IS DISTINCT FROM
              (EXCLUDED.slug, EXCLUDED.titulo, EXCLUDED.modulo, EXCLUDED.objetivo, EXCLUDED.duracion,
               EXCLUDED.tipo_evaluacion, EXCLUDED.es_modulo_razas, EXCLUDED.contenido_md)
           OR etapas.pauta_md IS DISTINCT FROM EXCLUDED.pauta_md
        RETURNING (xmax = 0) AS insertada
      `,
    ),
  );
  for (const filas of resEtapas) clasificar('etapas', filas);

  // Fase 2: ids de etapas por numero (para las FKs de preguntas_etapa)
  const idsPorNumero = new Map(
    (await sql`SELECT id, numero FROM etapas`).map((f) => [f.numero, f.id]),
  );

  // Fase 3: preguntas de tests + banco del examen (en una transacción)
  const queriesPreguntas = [];
  for (const t of testsData.tests) {
    const etapaId = idsPorNumero.get(t.etapa);
    if (!etapaId) throw new Error(`no existe la etapa ${t.etapa} para su test`);
    for (const [i, p] of t.preguntas.entries()) {
      queriesPreguntas.push(sql`
        INSERT INTO preguntas_etapa (etapa_id, orden, unidad, texto, respuesta, created_by, updated_by)
        VALUES (${etapaId}, ${i + 1}, ${p.unidad}, ${p.texto}, ${p.respuesta}, ${ACTOR}, ${ACTOR})
        ON CONFLICT (etapa_id, orden) DO UPDATE SET
          unidad = EXCLUDED.unidad, texto = EXCLUDED.texto, respuesta = EXCLUDED.respuesta,
          updated_by = ${ACTOR}, updated_at = now()
        WHERE (preguntas_etapa.unidad, preguntas_etapa.texto, preguntas_etapa.respuesta)
              IS DISTINCT FROM (EXCLUDED.unidad, EXCLUDED.texto, EXCLUDED.respuesta)
        RETURNING (xmax = 0) AS insertada
      `);
    }
  }
  const nTests = queriesPreguntas.length;
  for (const p of banco.preguntas) {
    queriesPreguntas.push(sql`
      INSERT INTO preguntas_examen (numero, categoria, texto, alternativas, correcta, created_by, updated_by)
      VALUES (${p.numero}, ${p.categoria}, ${p.texto}, ${p.alternativas}, ${p.correcta}, ${ACTOR}, ${ACTOR})
      ON CONFLICT (numero) DO UPDATE SET
        categoria = EXCLUDED.categoria, texto = EXCLUDED.texto,
        alternativas = EXCLUDED.alternativas, correcta = EXCLUDED.correcta,
        updated_by = ${ACTOR}, updated_at = now()
      WHERE (preguntas_examen.categoria, preguntas_examen.texto, preguntas_examen.correcta)
            IS DISTINCT FROM (EXCLUDED.categoria, EXCLUDED.texto, EXCLUDED.correcta)
         OR preguntas_examen.alternativas IS DISTINCT FROM EXCLUDED.alternativas
      RETURNING (xmax = 0) AS insertada
    `);
  }
  const resPreguntas = await sql.transaction(queriesPreguntas);
  resPreguntas.forEach((filas, i) =>
    clasificar(i < nTests ? 'preguntas_etapa' : 'preguntas_examen', filas),
  );

  // Fase 4: auditoría — solo si hubo cambios (re-runs limpios no ensucian el log)
  const huboCambios = Object.values(conteo).some((c) => c.insertadas + c.actualizadas > 0);
  if (huboCambios) {
    await sql`
      INSERT INTO event_log (tipo, entidad, entidad_id, payload, actor_id, actor_rol)
      VALUES ('capacitacion_seed_ejecutado', 'etapas', 'seed', ${JSON.stringify(conteo)}, ${ACTOR}, ${ACTOR})
    `;
  }

  // ── Reporte (AC2) ─────────────────────────────────────────────
  console.log('✅ Seed de capacitación completado:\n');
  for (const [tabla, c] of Object.entries(conteo)) {
    const total = c.insertadas + c.actualizadas + c.sinCambios;
    console.log(
      `  ${tabla.padEnd(17)} insertadas: ${String(c.insertadas).padStart(3)} · actualizadas: ${String(c.actualizadas).padStart(3)} · sin cambios: ${String(c.sinCambios).padStart(3)} · total: ${total}`,
    );
  }
  console.log(
    `\n  (esperado: 10 etapas, ${nTests} preguntas de test, ${banco.preguntas.length} de examen)` +
      (huboCambios ? '\n  Evento de auditoría registrado en event_log.' : '\n  Sin cambios: no se registró evento.'),
  );
} catch (error) {
  console.error('❌ Falló el seed de capacitación:', error.message);
  process.exit(1);
}
