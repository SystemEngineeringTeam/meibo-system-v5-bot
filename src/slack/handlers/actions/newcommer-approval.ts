import type { BlockActionAckHandler, BlockActionLazyHandler, ButtonAction, MessageBlockAction } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { SpreadSheetsApiService } from '@/lib/spread-sheets-api-service';
import { clickedApproveOrRejectButton } from '@/slack/flows/new-commer-flow/05-1-confirm-registration-approval-step';
import { updateMemberStatusStep } from '@/slack/flows/new-commer-flow/06-update-member-status-step';

export const newcommerApprovalActionAckHandler = (approve: boolean): BlockActionAckHandler<'button', HonoSlackAppEnv, MessageBlockAction<ButtonAction>> => async ({ context, payload, env }) => {
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
    console.error('Error in newcommerApprovalActionHandler:', error);
  }

  context.custom.approvalResult = approve; // Store the approval result in the context for later use
};

export const newcommerApprovalActionLazyHandler: BlockActionLazyHandler<'button', HonoSlackAppEnv, MessageBlockAction<ButtonAction>> = async ({ context, payload, env }) => {
  const approve: boolean = context.custom.approvalResult;
  if (approve) {
    const payerSlackUserId = payload.message.metadata?.event_payload?.payerSlackUserId as string;
    const teamId = payload.team?.id;
    await SpreadSheetsApiService.postMemberInfo(payerSlackUserId, payload.user.id, teamId, { env, client: context.client });
  }
};
