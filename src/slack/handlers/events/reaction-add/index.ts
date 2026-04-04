import type { EventLazyHandler } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { addApproveReactionHandler } from './add-approve-reaction';
import { addRejectReactionHandler } from './add-reject-reaction';

export const reactionAddEventHandler: EventLazyHandler<'reaction_added', HonoSlackAppEnv> = async (req) => {
  await Promise.all([]);
};
