import type { AnyMessageBlock, SlackAppContext } from 'slack-cloudflare-workers';
import type { InferInput } from 'valibot';
import type { memberDetailSchema } from '@/slack/flows/new-commer-flow/03-input-member-detail-step/validation';
import type { HonoSlackAppEnv } from '@/types/hono';
import type { ChannelData } from '@/types/kv';
import { kv } from '@/utils/kv';

export const selectFeePayeeStep = async (slackUserId: string, requestData: InferInput<typeof memberDetailSchema> | undefined, context: SlackAppContext, env: HonoSlackAppEnv) => {
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
    text: generateText(),
    blocks: generateBlocks(payeeList),
    metadata: requestData
      ? {
          event_type: 'request_fee_payee',
          event_payload: requestData,
        }
      : undefined,
  });
};

export async function closeSelectFeePayeeMessage(slackUserId: string, payeeName: string, timestamp: string, context: SlackAppContext, env: HonoSlackAppEnv) {
  // ユーザのDMチャンネルIDを取得
  const channelData = await kv.get<ChannelData>(env.CHANNEL_KV, slackUserId);
  if (!channelData) {
    console.error(`No channel data found for user ${slackUserId}`);
    return;
  }

  await context.client.chat.update({
    channel: channelData.channelId,
    ts: timestamp,
    text: generateText(),
    blocks: generateBlocks([], payeeName),
  });
}

function generateText(): string {
  return `*STEP 4*: 部費の支払い相手を選択してください`;
}

function generateBlocks(payeeList: string[], selectedPayeeName?: string): AnyMessageBlock[] {
  const blocks: AnyMessageBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*STEP 4*: 部費の支払い相手を選択してください\n支払い相手は近くの役員に聞いてください',
      },
    },
  ];

  if (selectedPayeeName) {
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
    });
  }

  return blocks;
}
