import type { BlockActionAckHandler, ButtonAction, MessageBlockAction } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { inputMemberProfileStep } from '@/slack/flows/new-commer-flow/03-input-member-profile-step';

export const selectMemberTypeActionHandler = (selectMemberType: 'INTERNAL' | 'EXTERNAL'): BlockActionAckHandler<'button', HonoSlackAppEnv, MessageBlockAction<ButtonAction>> => async ({ context, payload, env }) => {
  const userId = payload.user.id;
  const selectMemberTypeTimestamp = payload.message.ts;

  try {
    await inputMemberProfileStep(userId, selectMemberType, selectMemberTypeTimestamp, { client: context.client, env, triggerId: payload.trigger_id });
  } catch (error) {
    console.error('Error in selectMemberTypeActionHandler:', error);
  }
};
