import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../../../../prisma/generated/client.ts';
import env from '../../../config/env.ts';
import type ILoggerService from '../../../types/services/loggerService.interface.ts';

export default class DatabaseConnection {
    constructor(private logger: ILoggerService) {}

    async connect(): Promise<PrismaClient> {
        const adapter = new PrismaMariaDb(env.DATABASE_URL);
        const prisma = new PrismaClient({
            adapter,
            log: ['error', 'warn'],
        });

        try {
            await prisma.$connect();
            await prisma.$queryRaw`SELECT 1`; // MYSQL
            this.logger.info('Database connected');
        } catch (error) {
            this.logger.error('Error connecting to database');
            throw error;
        }

        return prisma;
    }
}
