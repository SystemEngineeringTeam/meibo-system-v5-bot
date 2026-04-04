import type { ViewAckHandler } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { createMemberDetail } from '@/slack/flows/new-commer-flow/03-input-member-detail-step';
import { normalizeViewState } from '@/utils/normalize-slack-view-state';

export const inputMemberDetailViewHandler: ViewAckHandler<HonoSlackAppEnv> = async ({ context, payload }) => {
  const inputValues = normalizeViewState(payload.view.state.values);
  const res = createMemberDetail(inputValues);
  if (res) {
    return {
      response_action: 'errors',
      errors: res,
    };
  }
};
