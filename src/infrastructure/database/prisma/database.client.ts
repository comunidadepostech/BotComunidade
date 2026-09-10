import { db, type Database } from '../../../prisma/db.ts';
import type ILoggerService from '../../../types/services/loggerService.interface.ts';

export default class DatabaseConnection {
    constructor(private logger: ILoggerService) {}

    async connect(): Promise<Database> {
        try {
            const runtime = await db.connect();
            const healthCheck = db.raw.sql`SELECT 1 AS ok`.returnsRow({ ok: 'pg/int4@1' }).build();

            await runtime.execute(healthCheck);

            this.logger.info('Database connected');
        } catch (error) {
            this.logger.error('Error connecting to database');
            throw error;
        }

        return db;
    }

    async disconnect(): Promise<void> {
        await db.close();
    }
}
