CREATE TYPE "public"."estado_paseo" AS ENUM('pendiente', 'checklist_completa', 'en_curso', 'completado', 'cancelado');--> statement-breakpoint
CREATE TABLE "paseos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recurrencia_id" uuid,
	"fecha_local" date NOT NULL,
	"estado" "estado_paseo" DEFAULT 'pendiente' NOT NULL,
	"precio_clp_snapshot" integer,
	"comision_pct_snapshot" integer,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "paseos_recurrencia_fecha_uq" UNIQUE("recurrencia_id","fecha_local")
);
