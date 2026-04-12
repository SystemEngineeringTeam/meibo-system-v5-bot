import type { ViewAckHandler } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { closeContinuationMessage } from '@/slack/flows/renewal-flow/01-start-renewal-step';
import { updateMemberDetail } from '@/slack/flows/renewal-flow/02-input-member-profile-step';
import { selectFeePayeeStep } from '@/slack/flows/renewal-flow/03-select-fee-payee-step';
import { normalizeViewState } from '@/utils/normalize-slack-view-state';

export const inputContinuingMemberDetailViewHandler: ViewAckHandler<HonoSlackAppEnv> = async ({ context, payload, env }) => {
  const inputValues = normalizeViewState(payload.view.state.values);
  const res = await updateMemberDetail(payload.user.id, inputValues, { env });
  if (!res.success) {
    return {
      response_action: 'errors',
      errors: res.errors,
    };
  }

  const selectMemberTypeTimestamp = payload.view.private_metadata;
  await Promise.all([
    selectFeePayeeStep(payload.user.id, res.data, { client: context.client, env }),
    closeContinuationMessage(payload.user.id, selectMemberTypeTimestamp, { client: context.client, env }),
  ]);

  return {
    response_action: 'clear',
  };
};
