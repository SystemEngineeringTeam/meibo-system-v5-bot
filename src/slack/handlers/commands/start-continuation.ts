import type { SlashCommandAckHandler } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { startContinuationStep } from '@/slack/flows/continuing-member-flow/01-start-continuation-step';

export const startContinuationCommandHandler: SlashCommandAckHandler<HonoSlackAppEnv> = async ({ payload, context, env }) => {
  const slackUserId = payload.user_id;
  await startContinuationStep(slackUserId, context, env);
};
