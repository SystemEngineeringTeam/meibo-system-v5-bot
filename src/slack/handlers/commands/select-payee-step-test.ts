import type { SlashCommandAckHandler } from 'slack-cloudflare-workers';
import type { InferInput } from 'valibot';
import type { memberDetailSchema } from '@/slack/flows/new-commer-flow/03-input-member-detail-step/validation';
import type { HonoSlackAppEnv } from '@/types/hono';
import { selectFeePayeeStep } from '@/slack/flows/new-commer-flow/04-select-fee-payee-step';

export const selectFeePayeeStepTestCommandHandler: SlashCommandAckHandler<HonoSlackAppEnv> = async ({ context, payload, env }) => {
  await selectFeePayeeStep(payload.user_id, {} as InferInput<typeof memberDetailSchema>, context, env);
};
