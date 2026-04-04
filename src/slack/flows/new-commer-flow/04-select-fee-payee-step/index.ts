import type { AnyMessageBlock, SlackAppContext } from 'slack-cloudflare-workers';
import type { InferInput } from 'valibot';
import type { memberDetailSchema } from '@/slack/flows/new-commer-flow/03-input-member-detail-step/validation';
import type { HonoSlackAppEnv } from '@/types/hono';
import type { ApprovalRequestData, ChannelData } from '@/types/kv';
import { kv } from '@/utils/kv';

export const selectFeePayeeStep = async (slackUserId: string, requestData: InferInput<typeof memberDetailSchema>, context: SlackAppContext, env: HonoSlackAppEnv) => {
  // ユーザのDMチャンネルIDを取得
  const channelData = await kv.get<ChannelData>(env.CHANNEL_KV, slackUserId);
  if (!channelData) {
    console.error(`No channel data found for user ${slackUserId}`);
    return;
  }

  const payeeKeyList = await env.PAYEE_KV.list();
  const payeeList = payeeKeyList.keys.map(({ name }) => name);

  await context.client.chat.postMessage({
    channel: channelData.channelId,
    text: `*STEP 4*: 部費の支払い相手を選択してください`,
    blocks: generateBlocks([...payeeList, 'ぺんぎん :penguin:', 'あざらし', 'えびふらい']), // TODO: テスト用のダミーデータ
  });

  // 承認依頼内容の保存
  await kv.put<ApprovalRequestData>(env.APPROVAL_REQUEST_KV, slackUserId, { requestData });
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
