import type { BlockActionAckHandler, BlockActionLazyHandler, ButtonAction, MessageBlockAction } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { SpreadSheetsApiService } from '@/lib/spread-sheets-api-service';
import { clickedApproveOrRejectButton } from '@/slack/flows/renewal-flow/04-1-confirm-registration-approval-step';
import { updateMemberStatusStep } from '@/slack/flows/renewal-flow/05-update-member-status-step';

export const continuingMemberApprovalActionAckHandler = (approve: boolean): BlockActionAckHandler<'button', HonoSlackAppEnv, MessageBlockAction<ButtonAction>> => async ({ context, payload, env }) => {
  const approverSlackUserId = payload.user.id;
  const payerSlackUserId = payload.message.metadata?.event_payload?.payerSlackUserId as string;
  const timestamp = payload.message.ts;
  const teamId = payload.team?.id;
  const channelId = payload.channel?.id;
  const blocks = payload.message.blocks;

  try {
    await Promise.all([
      updateMemberStatusStep(payerSlackUserId, approverSlackUserId, timestamp, approve, teamId, { client: context.client, env }),
      clickedApproveOrRejectButton(approve, channelId, timestamp, blocks, { client: context.client }),
    ]);
  } catch (error) {
    console.error('Error in continuingMemberApprovalActionAckHandler:', error);
  }
};

export const continuingMemberApprovalActionLazyHandler = (approve: boolean): BlockActionLazyHandler<'button', HonoSlackAppEnv, MessageBlockAction<ButtonAction>> => async ({ context, payload, env }) => {
  if (approve) {
    const payerSlackUserId = payload.message.metadata?.event_payload?.payerSlackUserId as string;
    const teamId = payload.team?.id;
    await SpreadSheetsApiService.postMemberInfo(payerSlackUserId, payload.user.id, teamId, { env, client: context.client });
  }
};
