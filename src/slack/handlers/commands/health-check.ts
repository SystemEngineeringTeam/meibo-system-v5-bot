import type { SlashCommandAckHandler } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';

export const healthCheckCommandHandler: SlashCommandAckHandler<HonoSlackAppEnv>
  = async ({ payload }) => `Hi <@${payload.user_id}>! I am healthy! (Timestamp: ${new Date().toISOString()})`;
