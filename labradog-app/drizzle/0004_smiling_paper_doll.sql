CREATE TYPE "public"."cobro_periodicidad" AS ENUM('por_paseo', 'semanal', 'mensual');--> statement-breakpoint
CREATE TYPE "public"."cobro_tiempo" AS ENUM('prepago', 'postpago');--> statement-breakpoint
CREATE TYPE "public"."estado_tutor" AS ENUM('activo', 'pausado', 'cerrado');--> statement-breakpoint
CREATE TYPE "public"."medio_anexo" AS ENUM('papel', 'pdf');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('base', 'plus', 'elite');--> statement-breakpoint
CREATE TYPE "public"."red_flag_tutor" AS ENUM('minimiza_conductas', 'insiste_soltar_correa', 'presiona_tiempo', 'oculta_informacion', 'desautoriza_criterio', 'rechaza_protocolos');--> statement-breakpoint
CREATE TYPE "public"."tipo_anexo" AS ENUM('limites_servicio', 'compromiso_etico');--> statement-breakpoint
CREATE TABLE "anexos_tutor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tutor_id" uuid NOT NULL,
	"tipo" "tipo_anexo" NOT NULL,
	"fecha_aceptacion" date NOT NULL,
	"medio" "medio_anexo" NOT NULL,
	"pdf_key" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "anexos_tutor_tutor_tipo_uq" UNIQUE("tutor_id","tipo")
);
--> statement-breakpoint
CREATE TABLE "tutores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"telefono" text NOT NULL,
	"email" text,
	"direccion_retiro" text NOT NULL,
	"plan_default" "plan" NOT NULL,
	"cobro_periodicidad" "cobro_periodicidad" NOT NULL,
	"cobro_tiempo" "cobro_tiempo" NOT NULL,
	"estado" "estado_tutor" DEFAULT 'activo' NOT NULL,
	"entrevista_historial" text,
	"entrevista_reactividad" text,
	"entrevista_escapes" text,
	"entrevista_equipamiento" text,
	"entrevista_expectativas" text,
	"red_flags" "red_flag_tutor"[] DEFAULT '{}' NOT NULL,
	"entrevista_registrada_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "anexos_tutor" ADD CONSTRAINT "anexos_tutor_tutor_id_tutores_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."tutores"("id") ON DELETE restrict ON UPDATE no action;