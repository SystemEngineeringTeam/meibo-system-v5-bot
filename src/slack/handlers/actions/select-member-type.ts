import type { BlockActionAckHandler } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { inputMemberDetailStep } from '@/slack/flows/new-commer-flow/03-input-member-detail-step';

export const selectMemberTypeActionHandler = (selectMemberType: string): BlockActionAckHandler<'button', HonoSlackAppEnv> => async ({ context, payload, env }) => {
  const userId = payload.user.id;
  await inputMemberDetailStep(userId, selectMemberType, context, env);
};
