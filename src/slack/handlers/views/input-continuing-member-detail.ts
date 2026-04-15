import type { ViewAckHandler } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { updateMemberDetail } from '@/slack/flows/renewal-flow/02-input-member-profile-step';

export const inputContinuingMemberDetailViewHandler: ViewAckHandler<HonoSlackAppEnv> = async ({ payload, env }) => {
  const errors = await updateMemberDetail(payload.user.id, payload.view.state.values, { env });

  if (errors) {
    return {
      response_action: 'errors',
      errors,
    };
  }

  return {
    response_action: 'clear',
  };
};
