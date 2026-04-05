import type { SlashCommandAckHandler } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { recoveryNewCommerFlow } from '@/slack/flows/new-commer-flow/recovery';

export const recoveryNewcommerCommandHandler: SlashCommandAckHandler<HonoSlackAppEnv> = async ({ payload, env, context }) => {
  const targetSlackUserId = payload.user_id;

  try {
    await recoveryNewCommerFlow(targetSlackUserId, payload.channel_id, context, env);
  } catch (error) {
    console.error('Error in recoveryNewcommerCommandHandler:', error);
  }
};
