import type { Middleware } from 'openapi-fetch';
import type { HonoSlackAppEnv } from '@/types/hono';
import type { paths } from '@/types/openapi.gen';
import createClient from 'openapi-fetch';
import { TokenService } from './token-service';

export const client = createClient<paths>({ baseUrl: process.env.API_BASE_URL });

const authMiddleware = (slackUserId: string, env: HonoSlackAppEnv): Middleware => ({
  async onRequest({ request }) {
    const accessToken = await TokenService.getAccessToken(slackUserId, { env });
    request.headers.set('Authorization', `Bearer ${accessToken}`);
    return request;
  },
});

export const authClient = (slackUserId: string, env: HonoSlackAppEnv) => {
  const authedClient = createClient<paths>({ baseUrl: process.env.API_BASE_URL });
  authedClient.use(authMiddleware(slackUserId, env));
  return authedClient;
};
