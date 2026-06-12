CREATE TABLE "aprobaciones_etapa" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paseador_id" uuid NOT NULL,
	"etapa_id" uuid NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "aprobaciones_etapa_paseador_etapa_uq" UNIQUE("paseador_id","etapa_id")
);
--> statement-breakpoint
ALTER TABLE "aprobaciones_etapa" ADD CONSTRAINT "aprobaciones_etapa_paseador_id_paseadores_id_fk" FOREIGN KEY ("paseador_id") REFERENCES "public"."paseadores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aprobaciones_etapa" ADD CONSTRAINT "aprobaciones_etapa_etapa_id_etapas_id_fk" FOREIGN KEY ("etapa_id") REFERENCES "public"."etapas"("id") ON DELETE restrict ON UPDATE no action;