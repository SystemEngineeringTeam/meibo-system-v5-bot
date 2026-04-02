import type { HonoHandler } from '@/types/hono';
import type { LinkData } from '@/types/kv';
import { login } from '@auth0/auth0-hono';
import { setCookie } from 'hono/cookie';
import { selectMemberTypeStep } from '@/slack/flows/new-commer-flow/02-select-member-type-step';

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
  return await login({
    authorizationParams: {
      scope: 'openid profile email',
    },
    redirectAfterLogin: '/logged-in',
    silent: false,
  })(c, async () => {});
};

export const loggedInHandler: HonoHandler<'/logged-in'> = async (c) => await selectMemberTypeStep(c);
