-- Baseline. Gerado por `drizzle-kit pull` a partir do banco existente e tornado
-- idempotente: no banco de PROD (que ja tinha as tabelas) nao cria nada e apenas
-- se registra como aplicado; num banco vazio cria o schema inteiro.
CREATE TABLE IF NOT EXISTS "featureFlags" (
	"guild_id" text PRIMARY KEY NOT NULL,
	"flags" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "classes" (
	"class" text NOT NULL,
	"quantity" integer,
	"guild_name" text NOT NULL,
	CONSTRAINT "class" UNIQUE("class")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "command_hashes" (
	"command_name" text PRIMARY KEY NOT NULL,
	"file_hash" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "discord_event_warnings" (
	"message_id" text PRIMARY KEY NOT NULL,
	"channel_id" text NOT NULL,
	"event_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "guilds" (
	"guild_id" text NOT NULL,
	"guild_name" text PRIMARY KEY NOT NULL,
	"clusters" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "interactions" (
	"message_id" text NOT NULL,
	"guild_name" text NOT NULL,
	"category" text,
	"role_name" text,
	"user_name" text NOT NULL,
	"channel_name" text NOT NULL,
	"message" text NOT NULL,
	"thread_name" text,
	"dt" timestamp(0) DEFAULT CURRENT_TIMESTAMP,
	"id" serial PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "online_members" (
	"dt" timestamp(0) PRIMARY KEY NOT NULL,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "polls" (
	"poll_hash" text,
	"guild_name" text NOT NULL,
	"category" text NOT NULL,
	"poll_question" text NOT NULL,
	"response1_text" text NOT NULL,
	"response1_value" integer NOT NULL,
	"response2_text" text NOT NULL,
	"response2_value" integer NOT NULL,
	"response3_text" text,
	"response3_value" integer,
	"response4_text" text,
	"response4_value" integer,
	"response5_text" text,
	"response5_value" integer,
	"response6_text" text,
	"response6_value" integer,
	"response7_text" text,
	"response7_value" integer,
	"response8_text" text,
	"response8_value" integer,
	"response9_text" text,
	"response9_value" integer,
	"response10_text" text,
	"response10_value" integer,
	"dt" timestamp(0) DEFAULT CURRENT_TIMESTAMP,
	"id" serial PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "zoom_meetings" (
	"title" text NOT NULL,
	"department" text,
	"duration_in_minutes" integer NOT NULL,
	"host_email" text NOT NULL,
	"metting_creation_source" text NOT NULL,
	"metting_group" text,
	"created_at" timestamp(0) NOT NULL,
	"started_at" timestamp(0) NOT NULL,
	"ended_at" timestamp(0) NOT NULL,
	"meeting_id" text NOT NULL,
	"max_simultaneous_views" integer DEFAULT 0 NOT NULL,
	"host_name" text,
	"max_entries" integer NOT NULL,
	"meeting_type" text NOT NULL,
	"max_unique_views" integer NOT NULL,
	"place" text,
	"total_participants_minutes" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_message_id" ON "interactions" USING btree ("message_id" text_ops);
