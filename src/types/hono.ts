import type { OIDCEnv } from '@auth0/auth0-hono';
import type { Context } from 'hono';
import type { BlankInput, H } from 'hono/types';
import type { AuthorizeResult, PreAuthorizeSlackAppContext, SlackAPIClient, SlackEdgeAppEnv } from 'slack-cloudflare-workers';

export type HonoEnv = OIDCEnv<CloudflareBindings & SlackEdgeAppEnv>;
export type HonoContext<T extends string = string> = Context<HonoEnv, T, BlankInput>;
export type HonoHandler<T extends string = string> = H<HonoEnv, T, BlankInput, any>;

export type HonoSlackAppEnv = SlackEdgeAppEnv & CloudflareBindings;
export interface HonoSlackAppBindings { Bindings: HonoSlackAppEnv }
export type HonoSlackAppContext<T extends string = string> = Context<HonoSlackAppBindings, T, BlankInput>;
export type SlackAppEnvWithCFBindings = SlackEdgeAppEnv & CloudflareBindings;

export type SlackAppContext = PreAuthorizeSlackAppContext & {
  client: SlackAPIClient;
  botToken: string;
  botId: string;
  botUserId: string;
  userToken?: string;
  authorizeResult: AuthorizeResult;
};
