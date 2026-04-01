import type { HonoHandler } from '@/types/hono';
import type { LinkData } from '@/types/link';
import { login } from '@auth0/auth0-hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';

export const loginHandler: HonoHandler<'/login'> = async (c) => {
  // slackUserId と紐づけるキーを取得
  const key = c.req.query('key');
  if (!key) return c.text('Missing key', 400);

  // キーに対応するデータ(slackUserId等)が存在するか確認
  const data = await c.env.LINK_KV.get<LinkData>(key);
  if (!data) return c.text('Invalid or expired key', 400);

  // クッキーにキーを保存
  setCookie(c, 'link_key', key, {
    httpOnly: true,
    secure: true,
    maxAge: 10 * 60, // 10分
    path: '/',
  });

  // Auth0のログイン処理へリダイレクト
  await login({
    authorizationParams: {
      scope: 'openid profile email',
    },
    redirectAfterLogin: '/dashboard',
    silent: false,
  })(c, async () => {});
};

export const loggedInHandler: HonoHandler<'/logged-in'> = async (c) => {
  // セッションの取得
  const session = await c.var.auth0Client?.getSession();
  if (!session) return c.text('Not logged in', 401);

  // slackUserIdと紐づけるキーをクッキーから取得
  const key = getCookie(c, 'link_key');
  if (!key) return c.text('Missing link key', 400);

  // キーに対応するデータ(slackUserId等)を取得
  const data = await c.env.LINK_KV.get<LinkData>(key, 'json');
  if (!data) return c.text('Invalid link key', 400);

  // 削除
  await c.env.LINK_KV.delete(key);
  deleteCookie(c, 'link_key');

  // backend に渡すトークンを取得
  const accessToken = await session.tokenSets.at(0)?.accessToken;
  if (!accessToken) return c.text('Failed to get access token', 500);

  // TODO: backend に対してユーザ作成リクエストを送る

  const slackUserId = data.slackUserId;

  // TODO: Slack Bot から連携完了のメッセージを送る

  return c.text(`Linked Slack user ID: ${slackUserId}`);
};
