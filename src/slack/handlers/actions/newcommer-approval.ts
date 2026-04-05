import type { BlockActionAckHandler, ButtonAction, MessageBlockAction } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { clickedApproveOrRejectButton } from '@/slack/flows/new-commer-flow/05-1-confirm-registration-approval-step';
import { updateMemberStatusStep } from '@/slack/flows/new-commer-flow/06-update-member-status-step';

export const newcommerApprovalActionHandler = (approve: boolean): BlockActionAckHandler<'button', HonoSlackAppEnv, MessageBlockAction<ButtonAction>> => async ({ context, payload, env }) => {
  const approverSlackUserId = payload.user.id;
  const payerSlackUserId = payload.message.metadata?.event_payload?.payerSlackUserId as string;
  const timestamp = payload.message.ts;
  const teamId = payload.team?.id;
  const channelId = payload.channel?.id;
  const blocks = payload.message.blocks;

  await Promise.allSettled([
    updateMemberStatusStep(payerSlackUserId, approverSlackUserId, timestamp, approve, teamId, { client: context.client, env }),
    clickedApproveOrRejectButton(approve, channelId, timestamp, blocks, { client: context.client }),
  ]);
};
