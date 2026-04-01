import type { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export const getDb = (db: D1Database) => drizzle(db, { schema });
export type DrizzleDb = ReturnType<typeof getDb>;
