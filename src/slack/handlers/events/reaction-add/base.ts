import type { EventLazyHandler } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';

export const reactionAddEventHandlerBase = (reaction: string, lazy: EventLazyHandler<'reaction_added', HonoSlackAppEnv>): EventLazyHandler<'reaction_added', HonoSlackAppEnv> => async (req) => {
  if (reaction !== req.payload.reaction) return;
  await lazy(req);
};
