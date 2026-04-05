import type { AnyMessageBlock, SlackAPIClient, SlackAppContext } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import type { ChannelData, UserData } from '@/types/kv';
import { getOrOpenDMChannelId } from '@/slack/lib/get-dm-channel-id';
import { kv } from '@/utils/kv';

export const startContinuationStep = async (slackUserId: string, context: SlackAppContext, env: HonoSlackAppEnv) => {
  const userId = await kv.get<UserData>(env.USER_KV, slackUserId);
  if (!userId) {
    await context.client.chat.postEphemeral({
      channel: slackUserId,
      user: slackUserId,
      text: 'ユーザーID が見つかりませんでした。管理者に連絡してください',
    });
    return;
  }

  // DM を開く
  const im = await context.client.conversations.open({
    users: slackUserId,
  });

  const channelId = im.channel?.id;
  if (!channelId) {
    await context.client.chat.postEphemeral({
      channel: slackUserId,
      user: slackUserId,
      text: 'DM チャンネルの作成に失敗しました。管理者に連絡してください',
    });
    return;
  }

  // TODO: API から登録内容を取得
  // 継続可能な状態(部員登録済み/継続登録済み ではない)かを確認

  await Promise.allSettled([
    kv.put<ChannelData>(env.CHANNEL_KV, slackUserId, { channelId }),
    sendContinuationMessage(channelId, context.client),
  ]);
};

async function sendContinuationMessage(channelId: string, client: SlackAPIClient) {
  await client.chat.postMessage({
    channel: channelId,
    text: generateText(),
    blocks: generateBlocks(false),
  });
}

export const closeContinuationMessage = async (client: SlackAPIClient, slackUserId: string, timestamp: string, env: HonoSlackAppEnv) => {
  const channelId = await getOrOpenDMChannelId(slackUserId, client, env);

  await client.chat.update({
    channel: channelId,
    ts: timestamp,
    text: generateText(),
    blocks: generateBlocks(true),
  });
};

function generateText(): string {
  return '継続手続きをしてください – 名簿管理システム';
}

function generateBlocks(selected: boolean): AnyMessageBlock[] {
  const blocks: AnyMessageBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*STEP 1*: 継続ボタンを押して，登録情報を確認してください\n継続しない場合は何もしなくて大丈夫です',
      },
    },
  ];

  if (selected) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `選択済み`,
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
            text: '継続する',
          },
          style: 'primary',
          value: 'continue',
          action_id: 'start_continuation',
        },
      ],
    });
  }

  return blocks;
}
