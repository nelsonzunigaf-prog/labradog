CREATE TABLE "event_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"tipo" text NOT NULL,
	"entidad" text NOT NULL,
	"entidad_id" text NOT NULL,
	"payload" jsonb NOT NULL,
	"actor_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
