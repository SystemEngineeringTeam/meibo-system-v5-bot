import { Hono } from 'hono';
import { restApp } from './rest';
import { slackApp } from './slack';

const app = new Hono();

// REST API
app.route('/rest', restApp);

// Slack用エンドポイント
app.route('/slack', slackApp);

export default { fetch: app.fetch };
