import type { AnyMessageBlock, SlackAppContext } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import type { ChannelData } from '@/types/kv';
import { kv } from '@/utils/kv';

export const selectFeePayeeStep = async (userId: string, context: SlackAppContext, env: HonoSlackAppEnv) => {
  // ユーザのDMチャンネルIDを取得
  const channelData = await kv.get<ChannelData>(env.CHANNEL_KV, userId);
  if (!channelData) {
    console.error(`No channel data found for user ${userId}`);
    return;
  }

  const payeeKeyList = await env.PAYEE_KV.list();
  const payeeList = payeeKeyList.keys.map(({ name }) => name);

  await context.client.chat.postMessage({
    channel: channelData.channelId,
    text: `*STEP 4*: 部費の支払い相手を選択してください`,
    blocks: generateBlocks([...payeeList, 'ぺんぎん :penguin:', 'あざらし', 'えびふらい', 'ぺんぎん', 'あざらし', 'えびふらい', 'ぺんぎん', 'あざらし', 'えびふらい', 'ぺんぎん', 'あざらし', 'えびふらい']), // TODO: テスト用のダミーデータ
  });
};

function generateBlocks(payeeList: string[]): AnyMessageBlock[] {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*STEP 4*: 部費の支払い相手を選択してください\n支払い相手は近くの役員に聞いてください',
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'static_select',
          options: payeeList.map((payee) => ({
            text: {
              type: 'plain_text',
              text: payee,
            },
            value: payee,
          })),
          action_id: 'select_fee_payee',
        },
      ],
    },
  ];
}
