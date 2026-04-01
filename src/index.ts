import type { HonoEnv } from './types/hono';
import { Hono } from 'hono';
import { authMiddleware, loggedInHandler, loginHandler } from './auth';
import { injectDbMiddleware } from './middlewares/db';
import { slackApp } from './slack';

const app = new Hono<HonoEnv>();

app.use(injectDbMiddleware);

// Slack用エンドポイント
app.route('/slack', slackApp);

app.get('/', async (c) => c.text('Hello, World!'));

app.get('/login', loginHandler);
app.use(authMiddleware);
app.get('/logged-in', loggedInHandler);

export default { fetch: app.fetch };
