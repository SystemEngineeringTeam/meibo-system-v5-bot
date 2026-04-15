import type { ViewAckHandler } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { createMemberDetail } from '@/slack/flows/new-commer-flow/03-input-member-profile-step';

export const inputNewCommerMemberDetailViewHandler: ViewAckHandler<HonoSlackAppEnv> = async ({ payload, env }) => {
  const slackUserId = payload.user.id;
  const values = payload.view.state.values;
  const selectMemberTypeTimestamp = payload.view.private_metadata;
  const errors = await createMemberDetail(slackUserId, values, selectMemberTypeTimestamp, { env });

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
