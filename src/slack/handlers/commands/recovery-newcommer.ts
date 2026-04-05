import type { SlashCommandAckHandler } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { recoveryNewCommerFlow } from '@/slack/flows/new-commer-flow/recovery';

export const recoveryNewcommerCommandHandler: SlashCommandAckHandler<HonoSlackAppEnv> = async ({ payload, env, context }) => {
  const targetSlackUserId = payload.user_id;

  await recoveryNewCommerFlow(targetSlackUserId, payload.channel_id, context, env);
};
