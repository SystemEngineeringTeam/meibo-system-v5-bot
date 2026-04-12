import type { BlockActionAckHandler, ButtonAction, MessageBlockAction } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { confirmRegistrationStep } from '@/slack/flows/renewal-flow/02-input-member-profile-step';

export const startContinuationActionHandler: BlockActionAckHandler<'button', HonoSlackAppEnv, MessageBlockAction<ButtonAction>> = async ({ context, payload, env }) => {
  try {
    await confirmRegistrationStep(payload.user.id, payload.message.ts, { client: context.client, env, triggerId: context.triggerId });
  } catch (error) {
    console.error('Error in startContinuationActionHandler:', error);
  }
};
