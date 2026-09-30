import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Schema do modo SLIM (SQLite).
 *
 * Contém apenas as tabelas OPERACIONAIS, necessárias para o bot funcionar e que não guardam dados de
 * mensagens nem telemetria. Tabelas de coleta (interactions, polls, online_members, classes e
 * zoom_meetings) existem só no PostgreSQL (src/db/schema.ts) e não são gravadas no modo SLIM.
 *
 * ATENÇÃO: ao alterar uma tabela aqui, atualize também o SLIM_DDL em
 * src/infrastructure/database/sqlite.client.ts (as tabelas são criadas com CREATE TABLE IF NOT EXISTS).
 */

export const featureFlags = sqliteTable('featureFlags', {
    guild_id: text('guild_id').primaryKey().notNull(),
    flags: text('flags', { mode: 'json' }).$type<Record<string, boolean>>(),
});

export const commandHashes = sqliteTable('command_hashes', {
    command_name: text('command_name').primaryKey().notNull(),
    file_hash: text('file_hash').notNull(),
});

export const discordEventWarnings = sqliteTable('discord_event_warnings', {
    message_id: text('message_id').primaryKey().notNull(),
    channel_id: text('channel_id').notNull(),
    event_id: text('event_id').notNull(),
});

// No PostgreSQL a PK é guild_name, o que impede dois servidores ainda sem sigla (guild_name = '').
// No SQLite a PK é o guild_id.
export const guilds = sqliteTable('guilds', {
    guild_id: text('guild_id').primaryKey().notNull(),
    guild_name: text('guild_name').notNull().default(''),
    clusters: text('clusters'),
});
