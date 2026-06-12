// Seed del contenido de capacitación (Story 2.1) — carga el programa curado de
// scripts/seed-data/capacitacion/ (derivado de los Word) en las tablas de
// contenido: etapas (9 + módulo razas como numero 10), preguntas_etapa (tests
// V/F) y preguntas_examen (banco de 100).
//
// IDEMPOTENTE: upsert por clave natural (etapas.numero, (etapa_id, orden),
// preguntas_examen.numero) con ON CONFLICT ... DO UPDATE ... WHERE <difiere>.
// Re-ejecutar produce 0 filas nuevas; si el contenido curado cambió, actualiza
// en su lugar. Reporta insertadas / actualizadas / sin cambios por tabla.
// ATÓMICO: todos los upserts corren en UNA transacción (etapa_id se resuelve
// por subselect sobre numero). El evento de auditoría va después, fuera de la
// transacción (desviación consciente de la regla #7: es condicional a los
// conteos, imposible en un batch HTTP no interactivo de neon) — si falla, se
// advierte sin marcar el seed como fallido.
//
// Uso:  node scripts/seed-capacitacion.mjs   (o: npm run db:seed-capacitacion)
import 'dotenv/config';
import { existsSync, readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

const ACTOR = 'sistema';
const MIN_CHARS_CONTENIDO = 100; // mismo umbral que capacitacion-contenido.test.ts

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL no está definida (ver .env.example)');
  process.exit(1);
}

// ── Carga de fuentes (relativas a este script) ─────────────────────────────

const base = (ruta) => new URL(`./seed-data/capacitacion/${ruta}`, import.meta.url);
const leerTexto = (ruta) => readFileSync(base(ruta), 'utf8');

function leerJson(ruta) {
  try {
    return JSON.parse(readFileSync(base(ruta), 'utf8'));
  } catch (error) {
    console.error(`❌ ${ruta} no se pudo leer o no es JSON válido: ${error.message}`);
    process.exit(1);
  }
}

const programa = leerJson('programa.json');
const testsData = leerJson('tests.json');
const banco = leerJson('banco-examen.json');

// ── Validación previa (fail-fast: exit 1 sin tocar la BD) ──────────────────

const TIPOS_EVALUACION = ['test', 'practica', 'test_y_practica', 'examen_final'];
const errores = [];

const etapasManifest = Array.isArray(programa.etapas) ? programa.etapas : [];
if (etapasManifest.length !== 9) {
  errores.push(`programa.json debe tener 9 etapas (tiene ${etapasManifest.length})`);
}
const numerosManifest = etapasManifest.map((e) => e.numero).sort((a, b) => a - b);
if (JSON.stringify(numerosManifest) !== JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
  errores.push(`las etapas del manifest deben ser exactamente 1-9 sin duplicados (son: ${numerosManifest})`);
}
if (!programa.modulo_razas?.archivo_contenido) {
  errores.push('programa.json debe incluir modulo_razas con archivo_contenido');
}

// Lee un archivo de contenido acumulando el error en vez de reventar con ENOENT.
function leerContenido(ruta, contexto) {
  if (!ruta || !existsSync(base(ruta))) {
    errores.push(`${contexto}: archivo no encontrado (${ruta ?? 'sin ruta'})`);
    return '';
  }
  return leerTexto(ruta);
}

// Filas de `etapas`: las 9 del manifest + módulo razas como numero 10.
const filasEtapas = [
  ...etapasManifest.map((e) => ({
    numero: e.numero,
    slug: e.slug,
    titulo: e.titulo,
    modulo: e.modulo,
    objetivo: e.objetivo,
    duracion: e.duracion,
    tipoEvaluacion: e.tipo_evaluacion,
    esModuloRazas: false,
    contenidoMd: leerContenido(e.archivo_contenido, `etapa ${e.numero}`),
    pautaMd: e.archivo_pauta ? leerContenido(e.archivo_pauta, `pauta etapa ${e.numero}`) : null,
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
          contenidoMd: leerContenido(programa.modulo_razas.archivo_contenido, 'módulo razas'),
          pautaMd: null,
        },
      ]
    : []),
];

const slugs = new Set();
for (const e of filasEtapas) {
  for (const campo of ['slug', 'titulo', 'modulo', 'objetivo', 'duracion']) {
    if (typeof e[campo] !== 'string' || !e[campo].trim()) {
      errores.push(`etapa ${e.numero}: campo '${campo}' vacío o ausente`);
    }
  }
  if (slugs.has(e.slug)) errores.push(`etapa ${e.numero}: slug duplicado '${e.slug}'`);
  slugs.add(e.slug);
  if (e.contenidoMd.trim().length < MIN_CHARS_CONTENIDO) {
    errores.push(`etapa ${e.numero}: contenido vacío o demasiado corto (< ${MIN_CHARS_CONTENIDO} caracteres)`);
  }
  if (e.pautaMd !== null && e.pautaMd.trim().length < MIN_CHARS_CONTENIDO) {
    errores.push(`etapa ${e.numero}: pauta vacía o demasiado corta`);
  }
  if (!TIPOS_EVALUACION.includes(e.tipoEvaluacion)) {
    errores.push(`etapa ${e.numero}: tipo_evaluacion inválido '${e.tipoEvaluacion}'`);
  }
}

// Las etapas con test se derivan del manifest (fuente única: tipo_evaluacion);
// tests.json debe traer exactamente esas y ninguna otra.
const etapasConTest = etapasManifest
  .filter((e) => e.tipo_evaluacion === 'test' || e.tipo_evaluacion === 'test_y_practica')
  .map((e) => e.numero)
  .sort((a, b) => a - b);
const tests = Array.isArray(testsData.tests) ? testsData.tests : [];
const numerosConTest = tests.map((t) => t.etapa).sort((a, b) => a - b);
if (JSON.stringify(numerosConTest) !== JSON.stringify(etapasConTest)) {
  errores.push(
    `tests.json trae tests de las etapas [${numerosConTest}] pero el manifest declara test en [${etapasConTest}]`,
  );
}
for (const t of tests) {
  if (!Array.isArray(t.preguntas) || t.preguntas.length !== 30) {
    errores.push(`test etapa ${t.etapa}: deben ser 30 preguntas (hay ${t.preguntas?.length ?? 0})`);
    continue;
  }
  for (const [i, p] of t.preguntas.entries()) {
    if (typeof p.respuesta !== 'boolean' || !p.texto?.trim() || !p.unidad?.trim()) {
      errores.push(`test etapa ${t.etapa}, pregunta ${i + 1}: texto/unidad/respuesta inválidos`);
    }
  }
}

const preguntasBanco = Array.isArray(banco.preguntas) ? banco.preguntas : [];
if (preguntasBanco.length !== 100) {
  errores.push(`banco-examen.json debe traer 100 preguntas (trae ${preguntasBanco.length})`);
}
const numerosBanco = new Set();
for (const p of preguntasBanco) {
  if (!Number.isInteger(p.numero) || p.numero < 1 || p.numero > 100) {
    errores.push(`banco: numero inválido '${p.numero}' (debe ser entero 1-100)`);
  }
  if (numerosBanco.has(p.numero)) errores.push(`banco: numero ${p.numero} duplicado`);
  numerosBanco.add(p.numero);
  if (!p.texto?.trim() || !p.categoria?.trim()) {
    errores.push(`banco pregunta ${p.numero}: texto o categoría vacíos`);
  }
  if (
    !Array.isArray(p.alternativas) ||
    p.alternativas.length !== 3 ||
    p.alternativas.some((a) => typeof a !== 'string' || !a.trim())
  ) {
    errores.push(`banco pregunta ${p.numero}: deben ser 3 alternativas de texto no vacías`);
  }
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

let sql;
try {
  sql = neon(process.env.DATABASE_URL);
} catch (error) {
  console.error(`❌ DATABASE_URL inválida: ${error.message}`);
  process.exit(1);
}

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
  // UNA transacción para todo el negocio. Los statements del batch corren en
  // orden dentro de la misma tx: las preguntas resuelven etapa_id con un
  // subselect por numero, que ya ve las etapas upsertadas arriba.
  const queries = [];

  for (const e of filasEtapas) {
    queries.push(sql`
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
    `);
  }
  const nEtapas = queries.length;

  for (const t of tests) {
    for (const [i, p] of t.preguntas.entries()) {
      queries.push(sql`
        INSERT INTO preguntas_etapa (etapa_id, orden, unidad, texto, respuesta, created_by, updated_by)
        VALUES ((SELECT id FROM etapas WHERE numero = ${t.etapa}), ${i + 1}, ${p.unidad}, ${p.texto}, ${p.respuesta}, ${ACTOR}, ${ACTOR})
        ON CONFLICT (etapa_id, orden) DO UPDATE SET
          unidad = EXCLUDED.unidad, texto = EXCLUDED.texto, respuesta = EXCLUDED.respuesta,
          updated_by = ${ACTOR}, updated_at = now()
        WHERE (preguntas_etapa.unidad, preguntas_etapa.texto, preguntas_etapa.respuesta)
              IS DISTINCT FROM (EXCLUDED.unidad, EXCLUDED.texto, EXCLUDED.respuesta)
        RETURNING (xmax = 0) AS insertada
      `);
    }
  }
  const nConTests = queries.length;

  for (const p of preguntasBanco) {
    queries.push(sql`
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

  const resultados = await sql.transaction(queries);
  resultados.forEach((filas, i) =>
    clasificar(i < nEtapas ? 'etapas' : i < nConTests ? 'preguntas_etapa' : 'preguntas_examen', filas),
  );

  // Auditoría — solo si hubo cambios (re-runs limpios no ensucian el log). Va
  // fuera de la transacción (ver cabecera); si falla, el seed NO se marca
  // fallido: el contenido ya quedó cargado.
  const huboCambios = Object.values(conteo).some((c) => c.insertadas + c.actualizadas > 0);
  let avisoAuditoria = '';
  if (huboCambios) {
    try {
      await sql`
        INSERT INTO event_log (tipo, entidad, entidad_id, payload, actor_id, actor_rol)
        VALUES ('capacitacion_seed_ejecutado', 'etapas', 'seed', ${JSON.stringify(conteo)}, ${ACTOR}, ${ACTOR})
      `;
      avisoAuditoria = 'Evento de auditoría registrado en event_log.';
    } catch (error) {
      avisoAuditoria = `⚠️ Contenido cargado OK, pero el evento de auditoría NO se pudo registrar: ${error.message}`;
    }
  } else {
    avisoAuditoria = 'Sin cambios: no se registró evento.';
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
    `\n  (esperado: ${filasEtapas.length} etapas, ${nConTests - nEtapas} preguntas de test, ${preguntasBanco.length} de examen)\n  ${avisoAuditoria}`,
  );
} catch (error) {
  console.error('❌ Falló el seed de capacitación:', error);
  process.exit(1);
}
