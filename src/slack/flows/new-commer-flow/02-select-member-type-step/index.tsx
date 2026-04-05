import type { AnyMessageBlock, SlackAPIClient } from 'slack-cloudflare-workers';
import type { SlackHandlerOptions } from '@/types/slack-handler-options';
import type { HonoContext } from '@/types/hono';
import type { LinkData } from '@/types/kv';
import { deleteCookie, getCookie } from 'hono/cookie';
import { SlackApp } from 'slack-cloudflare-workers';
import PageLayout from '@/components/layouts/PageLayout';
import { getDMChannelId, getOrOpenDMChannelId } from '@/slack/lib/get-dm-channel-id';
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
  const channelId = await getDMChannelId(linkData.slackUserId, c.env);
  if (!channelId) {
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
  await sendSelectMemberTypeMessage(slackApp.client, channelId);

  return c.render(<SuccessPage teamId={c.env.SLACK_BOT_TEAM_ID} appId={c.env.SLACK_BOT_APP_ID} />);
};

export async function sendSelectMemberTypeMessage(client: SlackAPIClient, channelId: string) {
  return client.chat.postMessage({
    channel: channelId,
    text: generateText(),
    blocks: generateBlocks(false),
  });
};

export async function closeSelectMemberTypeMessage(slackUserId: string, timestamp: string, { client, env }: SlackHandlerOptions) {
  const channelId = await getOrOpenDMChannelId(slackUserId, client, env);

  return client.chat.update({
    channel: channelId,
    ts: timestamp,
    text: generateText(),
    blocks: generateBlocks(true),
  });
};

function generateText(): string {
  return '部員種別を選択してください – 名簿管理システム';
}

function generateBlocks(selected: boolean): AnyMessageBlock[] {
  const blocks: AnyMessageBlock[] = [];
  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*STEP 2*: 部員種別を選択してください',
    },
  });

  if (selected) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*STEP 3*: 部員情報が入力されました',
      },
    });
  } else {
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '内部生(愛工大生)',
          },
          value: 'internal',
          action_id: 'select_member_type_internal',
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '外部生(他大学生)',
          },
          value: 'external',
          action_id: 'select_member_type_external',
        },
      ],
    });
  }

  return blocks;
}
