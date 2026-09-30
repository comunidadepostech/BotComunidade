import { sql } from 'drizzle-orm';
import type { Pool } from 'pg';
import { createPostgresDatabase, type Database } from '../../db/index.ts';
import type ILoggerService from '../../types/services/loggerService.interface.ts';

export default class DatabaseConnection {
    private pool: Pool | undefined;

    constructor(
        private logger: ILoggerService,
        private databaseUrl: string,
    ) {}

    async connect(): Promise<Database> {
        const { db, pool } = createPostgresDatabase(this.databaseUrl);
        this.pool = pool;

        try {
            await db.execute(sql`SELECT 1`);

            this.logger.info('Database connected');
        } catch (error) {
            this.logger.error('Error connecting to database');
            await pool.end().catch(() => {});
            throw error;
        }

        return db;
    }

    async disconnect(): Promise<void> {
        await this.pool?.end();
    }
}
