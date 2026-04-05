import type { EventLazyHandler } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { startRegistrationStep } from '@/slack/flows/new-commer-flow/01-start-registration-step';

export const teamJoinEventHandler: EventLazyHandler<'team_join', HonoSlackAppEnv> = async ({ context, payload, env }) => {
  try {
    await startRegistrationStep(payload.user.id, { client: context.client, env });
  } catch (error) {
    console.error('Error in teamJoinEventHandler:', error);
  }
};
