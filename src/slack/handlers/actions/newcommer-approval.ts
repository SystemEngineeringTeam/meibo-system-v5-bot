import type { BlockActionAckHandler, ButtonAction, MessageBlockAction } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import type { TmpApiAltData, UserData } from '@/types/kv';
import { clickedApproveOrRejectButton } from '@/slack/flows/new-commer-flow/05-1-confirm-registration-approval-step';
import { updateMemberStatusStep } from '@/slack/flows/new-commer-flow/06-update-member-status-step';
import { SpreadSheetsApiService } from '@/lib/spread-sheets-api-service';
import { kv } from '@/utils/kv';

export const newcommerApprovalActionHandler = (approve: boolean): BlockActionAckHandler<'button', HonoSlackAppEnv, MessageBlockAction<ButtonAction>> => async ({ context, payload, env }) => {
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

  if (approve) {
    const userData = await kv.get<UserData>(env.USER_KV, payerSlackUserId);
    const tmpUserData = userData && await kv.get<TmpApiAltData>(env.TMP_API_ALT_KV, userData.userId);
    await SpreadSheetsApiService.postMemberInfo(tmpUserData, payload.user.id, teamId, { env, client: context.client });
  }
};
