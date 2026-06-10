CREATE TYPE "public"."estado_perro" AS ENUM('activo', 'inactivo');--> statement-breakpoint
CREATE TYPE "public"."grupo_raza" AS ENUM('trabajo_guardia', 'pastora', 'caza', 'otro');--> statement-breakpoint
CREATE TYPE "public"."talla" AS ENUM('pequena', 'mediana', 'grande');--> statement-breakpoint
CREATE TABLE "perro_compatibilidades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"perro_menor_id" uuid NOT NULL,
	"perro_mayor_id" uuid NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "perro_compat_par_uq" UNIQUE("perro_menor_id","perro_mayor_id")
);
--> statement-breakpoint
CREATE TABLE "perros" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tutor_id" uuid NOT NULL,
	"nombre" text NOT NULL,
	"foto_key" text,
	"raza" text NOT NULL,
	"grupo_raza" "grupo_raza" NOT NULL,
	"edad" integer,
	"talla" "talla" NOT NULL,
	"condicion_fisica" text,
	"temperamento" text,
	"equipamiento" text,
	"premios_aceptados" text,
	"notas_manejo" text,
	"notas_criticas" boolean DEFAULT false NOT NULL,
	"estado" "estado_perro" DEFAULT 'activo' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "perro_compatibilidades" ADD CONSTRAINT "perro_compatibilidades_perro_menor_id_perros_id_fk" FOREIGN KEY ("perro_menor_id") REFERENCES "public"."perros"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perro_compatibilidades" ADD CONSTRAINT "perro_compatibilidades_perro_mayor_id_perros_id_fk" FOREIGN KEY ("perro_mayor_id") REFERENCES "public"."perros"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perros" ADD CONSTRAINT "perros_tutor_id_tutores_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."tutores"("id") ON DELETE restrict ON UPDATE no action;