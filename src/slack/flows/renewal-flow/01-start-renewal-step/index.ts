import type { AnyMessageBlock, SlackAPIClient } from 'slack-cloudflare-workers';
import type { ChannelData } from '@/types/kv';
import type { SlackHandlerOptions } from '@/types/slack-handler-options';
import { getOrOpenDMChannelId } from '@/slack/lib/get-dm-channel-id';
import { getUserId } from '@/slack/lib/get-user-id';
import { kv } from '@/utils/kv';

export const startContinuationStep = async (slackUserId: string, { client, env }: SlackHandlerOptions) => {
  const _userId = await getUserId(slackUserId, { client, env });
  const channelId = await getOrOpenDMChannelId(slackUserId, { client, env });

  // TODO: API から登録内容を取得
  // 継続可能な状態(部員登録済み/継続登録済み ではない)かを確認

  await Promise.all([
    kv.put<ChannelData>(env.CHANNEL_KV, slackUserId, { channelId }),
    sendContinuationMessage(channelId, client),
  ]);
};

async function sendContinuationMessage(channelId: string, client: SlackAPIClient) {
  await client.chat.postMessage({
    channel: channelId,
    text: generateText(),
    blocks: generateBlocks(false),
  });
}

export const closeContinuationMessage = async (slackUserId: string, timestamp: string, { client, env }: SlackHandlerOptions) => {
  const channelId = await getOrOpenDMChannelId(slackUserId, { client, env });

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
        text: `*【重要】継続手続きをしてください* – 名簿管理システム
※ 継続手続きをしなかった場合は，自動的に退部扱いとなります

[継続手続きの流れ]
  STEP 1: 継続手続きを開始
  STEP 2: 登録内容の確認
  STEP 3: 部費の支払い相手の選択
    ↓ 承認待ち
  部員登録完了 :tada:

*STEP 1*: 継続ボタンを押して，登録情報を確認してください`,
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
