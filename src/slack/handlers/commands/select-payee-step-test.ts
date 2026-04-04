import type { SlashCommandAckHandler } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { selectFeePayeeStep } from '@/slack/flows/new-commer-flow/04-select-fee-payee-step';

export const selectFeePayeeStepTestCommandHandler: SlashCommandAckHandler<HonoSlackAppEnv> = async ({ context, payload, env }) => {
  await selectFeePayeeStep(payload.user_id, context, env);
};
