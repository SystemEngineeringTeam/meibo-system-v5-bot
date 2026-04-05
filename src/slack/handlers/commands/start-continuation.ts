import type { SlashCommandAckHandler } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { startContinuationStep } from '@/slack/flows/continuing-member-flow/01-start-continuation-step';

export const startContinuationCommandHandler: SlashCommandAckHandler<HonoSlackAppEnv> = async ({ payload, context, env }) => {
  const slackUserId = payload.user_id;

  try {
    await startContinuationStep(slackUserId, { client: context.client, env });
  } catch (error) {
    console.error('継続手続きの開始に失敗:', error);
  };
};
