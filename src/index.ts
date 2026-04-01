import type { HonoEnv } from './types/hono';
import { Hono } from 'hono';
import { authMiddleware, loggedInHandler, loginHandler } from './auth';
import { injectDbMiddleware } from './middlewares/db';
import { slackApp } from './slack';

const app = new Hono<HonoEnv>();

app.use(injectDbMiddleware);

app.get('/', async (c) => c.text('Hello, World!'));

app.use(authMiddleware);
app.get('/login', loginHandler);
app.get('/logged-in', loggedInHandler);

// Slack用エンドポイント
app.route('/slack', slackApp);

export default { fetch: app.fetch };
