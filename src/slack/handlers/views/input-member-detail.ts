import type { ViewAckHandler } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { createMemberDetail } from '@/slack/flows/new-commer-flow/03-input-member-detail-step';
import { selectFeePayeeStep } from '@/slack/flows/new-commer-flow/04-select-fee-payee-step';
import { normalizeViewState } from '@/utils/normalize-slack-view-state';

export const inputMemberDetailViewHandler: ViewAckHandler<HonoSlackAppEnv> = async ({ context, payload, env }) => {
  const inputValues = normalizeViewState(payload.view.state.values);
  const res = await createMemberDetail(inputValues);
  if (!res.success) {
    return {
      response_action: 'errors',
      errors: res.errors,
    };
  }

  await selectFeePayeeStep(payload.user.id, res.data, context, env);
};
