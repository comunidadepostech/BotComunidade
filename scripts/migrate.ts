import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from '../src/db/index.ts';

try {
    await migrate(db, { migrationsFolder: './drizzle' });

    console.log('Migrações aplicadas.');
} catch (error) {
    console.error('Falha ao aplicar migrações:', error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
} finally {
    await pool.end();
}
