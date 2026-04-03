import type { AnyMessageBlock } from 'slack-cloudflare-workers';
import type { HonoContext } from '@/types/hono';
import type { ChannelData, LinkData } from '@/types/kv';
import { deleteCookie, getCookie } from 'hono/cookie';
import { SlackApp } from 'slack-cloudflare-workers';
import PageLayout from '@/components/layouts/PageLayout';
import { kv } from '@/utils/kv';
import { SuccessPage } from './components/SuccessPage';

export const selectMemberTypeStep = async (c: HonoContext) => {
  // セッションの取得
  const session = await c.var.auth0Client?.getSession();
  if (!session) return c.text('Not logged in', 401);

  // slackUserIdと紐づけるキーをクッキーから取得
  const key = getCookie(c, 'link_key');
  if (!key) {
    c.status(400);
    return c.render(
      <PageLayout>
        <>
          <h1>400: Invalid link key</h1>
          <p>リンクキーが無効です。再度登録するか，管理者に連絡してください。</p>
        </>
      </PageLayout>,
    );
  }

  // キーに対応するデータ(slackUserId等)を取得
  const linkData = await kv.get<LinkData>(c.env.LINK_KV, key);
  if (!linkData) {
    c.status(500);
    return c.render(
      <PageLayout>
        <h1>500: 紐づくユーザデータがありません</h1>
        <p>管理者に連絡してください。</p>
      </PageLayout>,
    );
  }

  // ログインユーザのDMのチャンネルIDを取得
  const channelData = await kv.get<ChannelData>(c.env.CHANNEL_KV, linkData.slackUserId);
  if (!channelData) {
    c.status(500);
    return c.render(
      <PageLayout>
        <h1>500: 送信先のDMチャンネルIDがありません</h1>
        <p>管理者に連絡してください。</p>
      </PageLayout>,
    );
  };

  // 削除
  await c.env.LINK_KV.delete(key);
  deleteCookie(c, 'link_key');

  // backend に渡すトークンを取得
  const accessToken = await session.tokenSets.at(0)?.accessToken;
  if (!accessToken) {
    c.status(500);
    return c.render(
      <PageLayout>
        <h1>500: Failed to get access token</h1>
        <p>管理者に連絡してください。</p>
      </PageLayout>,
    );
  };

  // TODO: backend に対してユーザ作成リクエストを送る
  // await kv.put<UserData>(c.env.USER_KV, linkData.slackUserId, { userId: res.user.id });

  // Slack Bot から連携完了のメッセージを送る
  const slackApp = new SlackApp({ env: c.env });
  await slackApp.client.chat.postMessage({
    channel: channelData.channelId,
    text: generateText(),
    blocks: generateBlocks(),
  });

  return c.render(<SuccessPage teamId={c.env.SLACK_BOT_TEAM_ID} appId={c.env.SLACK_BOT_APP_ID} />);
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
