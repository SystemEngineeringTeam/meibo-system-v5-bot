import type { HonoEnv } from './types/hono';
import { Hono } from 'hono';
import { authMiddleware, loggedInHandler, loginHandler } from './auth';
import PageLayout from './components/layouts/PageLayout';
import { slackApp } from './slack';

const app = new Hono<HonoEnv>();

app.get('/', async (c) => c.render(
  <PageLayout>
    <h1>Hello, World!</h1>
  </PageLayout>,
));

// Slack用エンドポイント
app.route('/slack', slackApp);

app.use(authMiddleware);
app.get('/login', loginHandler);
app.get('/logged-in', loggedInHandler);

export default { fetch: app.fetch };
