CREATE TYPE "public"."tipo_evaluacion" AS ENUM('test', 'practica', 'test_y_practica', 'examen_final');--> statement-breakpoint
CREATE TABLE "etapas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero" integer NOT NULL,
	"slug" text NOT NULL,
	"titulo" text NOT NULL,
	"modulo" text NOT NULL,
	"objetivo" text NOT NULL,
	"duracion" text NOT NULL,
	"tipo_evaluacion" "tipo_evaluacion" NOT NULL,
	"es_modulo_razas" boolean DEFAULT false NOT NULL,
	"contenido_md" text NOT NULL,
	"pauta_md" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "etapas_numero_unique" UNIQUE("numero"),
	CONSTRAINT "etapas_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "preguntas_etapa" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"etapa_id" uuid NOT NULL,
	"orden" integer NOT NULL,
	"unidad" text NOT NULL,
	"texto" text NOT NULL,
	"respuesta" boolean NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "preguntas_etapa_etapa_orden_uq" UNIQUE("etapa_id","orden")
);
--> statement-breakpoint
CREATE TABLE "preguntas_examen" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero" integer NOT NULL,
	"categoria" text NOT NULL,
	"texto" text NOT NULL,
	"alternativas" text[] NOT NULL,
	"correcta" integer NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "preguntas_examen_numero_unique" UNIQUE("numero"),
	CONSTRAINT "preguntas_examen_correcta_rango" CHECK ("preguntas_examen"."correcta" >= 0 AND "preguntas_examen"."correcta" <= 2)
);
--> statement-breakpoint
ALTER TABLE "preguntas_etapa" ADD CONSTRAINT "preguntas_etapa_etapa_id_etapas_id_fk" FOREIGN KEY ("etapa_id") REFERENCES "public"."etapas"("id") ON DELETE restrict ON UPDATE no action;