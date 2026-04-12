import type { BlockActionAckHandler, MessageBlockAction, StaticSelectAction } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { closeSelectFeePayeeMessage } from '@/slack/flows/renewal-flow/03-select-fee-payee-step';
import { confirmRegistrationApprovalStep } from '@/slack/flows/renewal-flow/04-1-confirm-registration-approval-step';
import { noticeRegistrationPendingStep } from '@/slack/flows/renewal-flow/04-2-notice-registration-pending-step';

export const selectContinuingMemberFeePayeeActionHandler: BlockActionAckHandler<'static_select', HonoSlackAppEnv, MessageBlockAction<StaticSelectAction>> = async ({ context, payload, env }) => {
  const payerSlackUserId = payload.user.id;
  const payeeName = payload.actions[0].selected_option.value;
  const teamId = payload.team?.id;
  const timestamp = payload.message.ts;

  const result = await confirmRegistrationApprovalStep(payerSlackUserId, payeeName, teamId, { client: context.client, env });
  await Promise.all([
    noticeRegistrationPendingStep(payerSlackUserId, payeeName, result, { client: context.client, env }),
    closeSelectFeePayeeMessage(payerSlackUserId, payeeName, timestamp, { client: context.client, env }),
  ]);
};
