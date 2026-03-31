import type { SlackEdgeAppEnv, SlashCommandAckHandler } from 'slack-cloudflare-workers';

export const healthCheckHandler: SlashCommandAckHandler<SlackEdgeAppEnv>
  = async ({ payload }) => `Hi <@${payload.user_id}>! I am healthy!`;
