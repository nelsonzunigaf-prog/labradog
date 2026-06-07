ALTER TABLE "event_log" ADD COLUMN "actor_rol" text NOT NULL;--> statement-breakpoint
CREATE INDEX "event_log_entidad_idx" ON "event_log" USING btree ("entidad","entidad_id");--> statement-breakpoint
CREATE INDEX "event_log_created_at_idx" ON "event_log" USING btree ("created_at");--> statement-breakpoint
CREATE OR REPLACE FUNCTION event_log_inmutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'event_log es inmutable: % no permitido', TG_OP;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER event_log_solo_insert
BEFORE UPDATE OR DELETE ON "event_log"
FOR EACH ROW EXECUTE FUNCTION event_log_inmutable();
