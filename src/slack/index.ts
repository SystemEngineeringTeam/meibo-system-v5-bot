import type { SlackEdgeAppEnv } from 'slack-cloudflare-workers';
import { Hono } from 'hono';
import { SlackApp } from 'slack-cloudflare-workers';
import { healthCheckHandler } from './handlers/commands/health-check';
import { messageHandler } from './handlers/events/message';
import { teamJoinHandler } from './handlers/events/team-join';

export const slackApp = new Hono<{ Bindings: SlackEdgeAppEnv }>();

slackApp.all('/slack', async (c) => {
  const slackApp = new SlackApp({ env: c.env });

  slackApp.command('/health-check', healthCheckHandler);
  slackApp.event('team_join', teamJoinHandler);
  slackApp.event('message', messageHandler);

  return await slackApp.run(c.req.raw, c.executionCtx);
});
