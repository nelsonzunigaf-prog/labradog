CREATE TYPE "public"."especialidad_caminata" AS ENUM('energetica', 'senior', 'olfatoria');--> statement-breakpoint
CREATE TABLE "paseadores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"telefono" text NOT NULL,
	"especialidades" "especialidad_caminata"[] DEFAULT '{}' NOT NULL,
	"comision_pct" integer NOT NULL,
	"notas" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "paseadores_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "paseadores_comision_rango" CHECK ("paseadores"."comision_pct" >= 60 AND "paseadores"."comision_pct" <= 80)
);
--> statement-breakpoint
ALTER TABLE "paseadores" ADD CONSTRAINT "paseadores_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;