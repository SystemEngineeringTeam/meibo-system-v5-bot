import type { SlackEdgeAppEnv } from 'slack-cloudflare-workers';
import { SlackApp } from 'slack-cloudflare-workers';

export default {
  async fetch(
    request: Request,
    env: SlackEdgeAppEnv,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const app = new SlackApp({ env });

    app.command('/health-check', async () => 'Hi! I am healthy!');

    return await app.run(request, ctx);
  },
};
