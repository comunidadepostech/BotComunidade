import { Database as BunSqlite } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { drizzle, type BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import * as sqliteSchema from '../../db/sqlite.schema.ts';
import type ILoggerService from '../../types/services/loggerService.interface.ts';

export type SqliteDatabase = BunSQLiteDatabase<typeof sqliteSchema>;

// Espelha src/db/sqlite.schema.ts. Idempotente: pode rodar a cada inicialização.
const SLIM_DDL = `
CREATE TABLE IF NOT EXISTS "featureFlags" (
    "guild_id" TEXT PRIMARY KEY NOT NULL,
    "flags" TEXT
);
CREATE TABLE IF NOT EXISTS "command_hashes" (
    "command_name" TEXT PRIMARY KEY NOT NULL,
    "file_hash" TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "discord_event_warnings" (
    "message_id" TEXT PRIMARY KEY NOT NULL,
    "channel_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "guilds" (
    "guild_id" TEXT PRIMARY KEY NOT NULL,
    "guild_name" TEXT NOT NULL DEFAULT '',
    "clusters" TEXT
);
`;

export const SQLITE_IN_MEMORY = ':memory:';

export default class SqliteConnection {
    private sqlite: BunSqlite | undefined;

    constructor(
        private logger: ILoggerService,
        private path: string,
    ) {}

    async connect(): Promise<SqliteDatabase> {
        try {
            if (this.path !== SQLITE_IN_MEMORY) mkdirSync(dirname(resolve(this.path)), { recursive: true });

            this.sqlite = new BunSqlite(this.path, { create: true });
            this.sqlite.exec(SLIM_DDL);

            this.logger.info(`SQLite connected (${this.path})`);
        } catch (error) {
            this.logger.error(`Error opening SQLite database at ${this.path}`);
            throw error;
        }

        return drizzle(this.sqlite, { schema: sqliteSchema });
    }

    async disconnect(): Promise<void> {
        this.sqlite?.close();
    }
}
