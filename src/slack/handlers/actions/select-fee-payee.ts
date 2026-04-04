import type { BlockActionAckHandler } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { confirmRegistrationApprovalStep } from '@/slack/flows/new-commer-flow/05-1-confirm-registration-approval-step';
import { noticeRegistrationPendingStep } from '@/slack/flows/new-commer-flow/05-2-notice-registration-pending-step';

export const selectFeePayeeActionHandler: BlockActionAckHandler<'static_select', HonoSlackAppEnv> = async ({ context, payload, env }) => {
  const payerSlackUserId = payload.user.id;
  const payeeName = payload.actions[0].selected_option.value;

  const result = await confirmRegistrationApprovalStep(payerSlackUserId, payeeName, context, env);
  await noticeRegistrationPendingStep(payerSlackUserId, payeeName, result, context, env);
};
