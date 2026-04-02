import type { HonoSlackAppBindings } from '@/types/hono';
import { Hono } from 'hono';
import { SlackApp } from 'slack-cloudflare-workers';
import { healthCheckCommandHandler } from './handlers/commands/health-check';
import { teamJoinTestCommandHandler } from './handlers/commands/team-join-test';
import { messageHandler } from './handlers/events/message';
import { teamJoinEventHandler } from './handlers/events/team-join';

export const slackApp = new Hono<HonoSlackAppBindings>();

slackApp.all('/', async (c) => {
  const app = new SlackApp({ env: c.env });

  app.command('/health-check', healthCheckCommandHandler);
  app.command('/team-join-test', teamJoinTestCommandHandler);
  app.event('team_join', teamJoinEventHandler);
  app.event('message', messageHandler);

  return await app.run(c.req.raw, c.executionCtx);
});
