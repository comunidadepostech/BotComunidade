import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createPostgresDatabase } from '../src/db/index.ts';

const databaseUrl = process.env['DATABASE_URL'];

if (!databaseUrl) {
    console.error('A variavel de ambiente DATABASE_URL está faltando.');
    process.exit(1);
}

const { db, pool } = createPostgresDatabase(databaseUrl);

try {
    await migrate(db, { migrationsFolder: './drizzle' });

    console.log('Migrações aplicadas.');
} catch (error) {
    console.error('Falha ao aplicar migrações:', error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
} finally {
    await pool.end();
}
