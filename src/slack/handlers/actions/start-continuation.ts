import type { BlockActionAckHandler, ButtonAction, MessageBlockAction } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { confirmRegistrationStep } from '@/slack/flows/continuing-member-flow/02-confirm-registration-step';

export const startContinuationActionHandler: BlockActionAckHandler<'button', HonoSlackAppEnv, MessageBlockAction<ButtonAction>> = async ({ context, payload, env }) => {
  await confirmRegistrationStep(payload.user.id, payload.message.ts, context, env);
};
