import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d.ts';
import contractJson from './contract.json' with { type: 'json' };
import env from '../config/env.ts';

export const db = postgres<Contract>({
    contractJson,
    url: env.DATABASE_URL,
});

export type Database = typeof db;
