import type { ViewAckHandler } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { updateMemberDetail } from '@/slack/flows/renewal-flow/02-input-member-profile-step';

export const inputContinuingMemberDetailViewHandler: ViewAckHandler<HonoSlackAppEnv> = async ({ payload, env }) => {
  const slackUserId = payload.user.id;
  const values = payload.view.state.values;
  const selectMemberTypeTimestamp = payload.view.private_metadata === '' ? undefined : payload.view.private_metadata;
  const errors = await updateMemberDetail(slackUserId, values, selectMemberTypeTimestamp, { env });

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
