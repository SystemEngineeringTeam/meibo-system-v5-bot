import type { BlockActionAckHandler, ButtonAction, MessageBlockAction } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { inputMemberDetailStep } from '@/slack/flows/new-commer-flow/03-input-member-detail-step';

export const selectMemberTypeActionHandler = (selectMemberType: string): BlockActionAckHandler<'button', HonoSlackAppEnv, MessageBlockAction<ButtonAction>> => async ({ context, payload, env }) => {
  const userId = payload.user.id;
  const selectMemberTypeTimestamp = payload.message.ts;
  await inputMemberDetailStep(userId, selectMemberType, selectMemberTypeTimestamp, context, env);
};
