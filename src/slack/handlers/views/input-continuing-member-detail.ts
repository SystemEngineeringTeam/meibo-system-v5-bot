import type { ViewAckHandler } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { closeContinuationMessage } from '@/slack/flows/continuing-member-flow/01-start-continuation-step';
import { updateMemberDetail } from '@/slack/flows/continuing-member-flow/02-confirm-registration-step';
import { selectFeePayeeStep } from '@/slack/flows/continuing-member-flow/03-select-fee-payee-step';
import { normalizeViewState } from '@/utils/normalize-slack-view-state';

export const inputContinuingMemberDetailViewHandler: ViewAckHandler<HonoSlackAppEnv> = async ({ context, payload, env }) => {
  const inputValues = normalizeViewState(payload.view.state.values);
  const res = await updateMemberDetail(inputValues);
  if (!res.success) {
    return {
      response_action: 'errors',
      errors: res.errors,
    };
  }

  const selectMemberTypeTimestamp = payload.view.private_metadata;
  await Promise.all([
    selectFeePayeeStep(payload.user.id, res.data, context, env),
    closeContinuationMessage(context.client, payload.user.id, selectMemberTypeTimestamp, env),
  ]);

  return {
    response_action: 'clear',
  };
};
