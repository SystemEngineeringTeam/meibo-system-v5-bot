import type { OIDCEnv } from '@auth0/auth0-hono';
import type { Context } from 'hono';
import type { BlankInput, H } from 'hono/types';
import type { SlackEdgeAppEnv } from 'slack-cloudflare-workers';
import type { DrizzleDb } from '@/db/get-db';

interface DrizzleBindings {
  DB: DrizzleDb;
}
export type HonoEnv = OIDCEnv<CloudflareBindings & DrizzleBindings>;
export type HonoContext<T extends string = string> = Context<HonoEnv, T, BlankInput>;
export type HonoHandler<T extends string = string> = H<HonoEnv, T, BlankInput, any>;

export type HonoSlackAppEnv = SlackEdgeAppEnv & CloudflareBindings & DrizzleBindings;
export interface HonoSlackAppBindings { Bindings: HonoSlackAppEnv }
export type HonoSlackAppContext<T extends string = string> = Context<HonoSlackAppBindings, T, BlankInput>;
export type SlackAppEnvWithCFBindings = SlackEdgeAppEnv & CloudflareBindings & DrizzleBindings;
