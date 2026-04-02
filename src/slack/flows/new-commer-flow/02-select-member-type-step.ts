import type { AnyMessageBlock } from 'slack-cloudflare-workers';
import type { HonoContext } from '@/types/hono';
import type { ChannelData, LinkData } from '@/types/kv';
import { deleteCookie, getCookie } from 'hono/cookie';
import { SlackApp } from 'slack-cloudflare-workers';
import { kv } from '@/utils/kv';

export const selectMemberTypeStep = async (c: HonoContext) => {
// セッションの取得
  const session = await c.var.auth0Client?.getSession();
  if (!session) return c.text('Not logged in', 401);

  // slackUserIdと紐づけるキーをクッキーから取得
  const key = getCookie(c, 'link_key');
  if (!key) return c.text('Missing link key', 400);

  // キーに対応するデータ(slackUserId等)を取得
  const linkData = await kv.get<LinkData>(c.env.LINK_KV, key);
  if (!linkData) return c.text('Invalid link key', 400);

  // ログインユーザのDMのチャンネルIDを取得
  const channelData = await kv.get<ChannelData>(c.env.CHANNEL_KV, linkData.slackUserId);
  if (!channelData) return c.text('Channel ID not found for user', 404);

  // 削除
  await c.env.LINK_KV.delete(key);
  deleteCookie(c, 'link_key');

  // backend に渡すトークンを取得
  const accessToken = await session.tokenSets.at(0)?.accessToken;
  if (!accessToken) return c.text('Failed to get access token', 500);

  // TODO: backend に対してユーザ作成リクエストを送る
  // await kv.put<Userdaat>(c.env.USER_KV, linkData.slackUserId, { userId: res.user.id });

  // Slack Bot から連携完了のメッセージを送る
  const slackApp = new SlackApp({ env: c.env });
  await slackApp.client.chat.postMessage({
    channel: channelData.channelId,
    text: generateText(),
    blocks: generateBlocks(),
  });

  return c.text(`Linked!!`);
};

function generateText(): string {
  return '部員種別を選択してください – 名簿管理システム';
}

function generateBlocks(): AnyMessageBlock[] {
  // 部員種別を選択してください
  // 内部生（現役）/内部生（OB・OG）/外部生（現役）/外部生（OB・OG）
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'STEP 2: 部員種別を選択してください',
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '内部生（現役）',
          },
          value: 'current_internal',
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '内部生（OB・OG）',
          },
          value: 'former_internal',
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '外部生（現役）',
          },
          value: 'current_external',
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '外部生（OB・OG）',
          },
          value: 'former_external',
        },
      ],
    },
  ];
}
