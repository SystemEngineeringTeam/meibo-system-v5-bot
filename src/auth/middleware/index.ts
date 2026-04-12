import { auth } from '@auth0/auth0-hono';

export const authMiddleware = auth({
  domain: process.env.AUTH0_DOMAIN,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  baseURL: process.env.SLACK_BOT_BASE_URL,
  authRequired: false,
  session: {
    secret: process.env.AUTH0_SESSION_SECRET!,
    cookie: {
      sameSite: 'lax',
    },
  },
  authorizationParams: {
    scope: 'openid profile email offline_access',
  },
});
