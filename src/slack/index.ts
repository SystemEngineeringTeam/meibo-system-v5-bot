import type { HonoSlackAppBindings } from '@/types/hono';
import { Hono } from 'hono';
import { SlackApp } from 'slack-cloudflare-workers';
import { healthCheckHandler } from './handlers/commands/health-check';
import { messageHandler } from './handlers/events/message';
import { teamJoinHandler } from './handlers/events/team-join';

export const slackApp = new Hono<HonoSlackAppBindings>();

slackApp.all('/', async (c) => {
  const slackApp = new SlackApp({ env: c.env });

  slackApp.command('/health-check', healthCheckHandler);
  slackApp.event('team_join', teamJoinHandler);
  // slackApp.event('team_access_granted', );
  // slackApp.event('team_access_revoked', );
  slackApp.event('message', messageHandler);

  return await slackApp.run(c.req.raw, c.executionCtx);
});
