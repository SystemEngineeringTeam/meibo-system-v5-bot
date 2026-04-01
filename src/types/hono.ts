import type { OIDCEnv } from '@auth0/auth0-hono';
import type { Context } from 'hono';
import type { BlankInput, H } from 'hono/types';

export type HonoEnv = OIDCEnv<CloudflareBindings>;
export type HonoContext<T extends string = string> = Context<HonoEnv, T, BlankInput>;
export type HonoHandler<T extends string = string> = H<HonoEnv, T, BlankInput, any>;
