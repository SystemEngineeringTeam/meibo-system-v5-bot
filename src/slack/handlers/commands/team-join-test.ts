import type { SlashCommandAckHandler } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { startRegistrationStep } from '@/slack/flows/new-commer-flow/01-start-registration-step';

export const teamJoinTestCommandHandler: SlashCommandAckHandler<HonoSlackAppEnv> = async ({ context, payload, env }) => {
  await startRegistrationStep(payload.user_id, context, env);
};
