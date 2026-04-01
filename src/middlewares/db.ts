import type { MiddlewareHandler } from 'hono';
import type { HonoEnv } from '@/types/hono';
import { getDb } from '@/db/get-db';

export const injectDbMiddleware: MiddlewareHandler<HonoEnv> = (c, next) => {
  c.env.DB = getDb(c.env.D1);
  return next();
};
