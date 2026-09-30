import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

export type Database = NodePgDatabase<typeof schema>;

/**
 * Cria o pool e o client do Drizzle para o PostgreSQL.
 *
 * É uma função (e não um singleton criado no import) para que o modo SLIM nunca instancie um Pool.
 */
export function createPostgresDatabase(connectionString: string): { db: Database; pool: Pool } {
    const pool = new Pool({ connectionString });

    return { db: drizzle(pool, { schema }), pool };
}
