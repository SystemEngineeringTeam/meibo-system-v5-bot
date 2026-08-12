import type { OIDCEnv } from '@auth0/auth0-hono';
import type { Context } from 'hono';
import type { BlankInput, H } from 'hono/types';
import type { SlackEdgeAppEnv } from 'slack-cloudflare-workers';

/**
 * wrangler.jsonc の kv_namespaces / queues は env (stg/prod) ごとに定義されているため、
 * cf-typegen が生成する CloudflareBindings ではこれらが optional になる。
 * このアプリは常に stg か prod のいずれかの env でデプロイされ、両 env で同じ bindings を持つため、
 * アプリ全体で参照する env の型では required として扱う。
 */
type RequiredCloudflareBindingKeys = 'LINK_KV' | 'CHANNEL_KV' | 'USER_KV' | 'PAYEE_KV' | 'SETTINGS_KV' | 'ACCESS_TOKEN_KV' | 'REFRESH_TOKEN_KV' | 'AFTER_INPUT_MEMBER_INFO_QUE' | 'RETRIEVE_FLAGGED_MEMBERS_QUE';
type AppCloudflareBindings = Omit<CloudflareBindings, RequiredCloudflareBindingKeys> & Required<Pick<CloudflareBindings, RequiredCloudflareBindingKeys>>;

export type HonoEnv = OIDCEnv<AppCloudflareBindings & SlackEdgeAppEnv>;
export type HonoContext<T extends string = string> = Context<HonoEnv, T, BlankInput>;
export type HonoHandler<T extends string = string> = H<HonoEnv, T, BlankInput, any>;

export type HonoSlackAppEnv = SlackEdgeAppEnv & AppCloudflareBindings;
export interface HonoSlackAppBindings { Bindings: HonoSlackAppEnv }
export type HonoSlackAppContext<T extends string = string> = Context<HonoSlackAppBindings, T, BlankInput>;
export type SlackAppEnvWithCFBindings = SlackEdgeAppEnv & AppCloudflareBindings;
