import type { ViewAckHandler } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { closeSelectMemberTypeMessage } from '@/slack/flows/new-commer-flow/02-select-member-type-step';
import { createMemberDetail } from '@/slack/flows/new-commer-flow/03-input-member-profile-step';
import { selectFeePayeeStep } from '@/slack/flows/new-commer-flow/04-select-fee-payee-step';
import { normalizeViewState } from '@/utils/normalize-slack-view-state';

export const inputNewCommerMemberDetailViewHandler: ViewAckHandler<HonoSlackAppEnv> = async ({ context, payload, env }) => {
  const inputValues = normalizeViewState(payload.view.state.values);
  const res = await createMemberDetail(payload.user.id, inputValues, env);
  if (!res.success) {
    return {
      response_action: 'errors',
      errors: res.errors,
    };
  }

  const selectMemberTypeTimestamp = payload.view.private_metadata;
  await Promise.all([
    selectFeePayeeStep(payload.user.id, res.data, { client: context.client, env }),
    closeSelectMemberTypeMessage(payload.user.id, selectMemberTypeTimestamp, { client: context.client, env }),
  ]);

  return {
    response_action: 'clear',
  };
};
