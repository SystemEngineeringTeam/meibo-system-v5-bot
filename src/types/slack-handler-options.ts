import type { SlackAPIClient } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from './hono';

export interface SlackHandlerSlackHandlerClientOption {
  client: SlackAPIClient;
}

export type SlackHandlerOptions<PayloadT = never>
  = ([PayloadT] extends [never] ? {} : { payload: PayloadT }) & {
    client: SlackAPIClient;
    env: HonoSlackAppEnv;
  };

export type SlackHandlerOptionsWithTriggerId<PayloadT = never> = SlackHandlerOptions<PayloadT> & {
  triggerId: string | undefined;
};
