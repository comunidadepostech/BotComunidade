import { sql } from 'drizzle-orm';
import { db, pool, type Database } from '../../db/index.ts';
import type ILoggerService from '../../types/services/loggerService.interface.ts';

export default class DatabaseConnection {
    constructor(private logger: ILoggerService) {}

    async connect(): Promise<Database> {
        try {
            await db.execute(sql`SELECT 1`);

            this.logger.info('Database connected');
        } catch (error) {
            this.logger.error('Error connecting to database');
            throw error;
        }

        return db;
    }

    async disconnect(): Promise<void> {
        await pool.end();
    }
}
