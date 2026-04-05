import type { AnyMessageBlock, SlackAppContext } from 'slack-cloudflare-workers';
import type { InferInput } from 'valibot';
import type { memberDetailSchema } from '@/slack/schemas/member';
import type { HonoSlackAppEnv } from '@/types/hono';
import { getOrOpenDMChannelId } from '@/slack/lib/get-dm-channel-id';

export const baseSelectFeePayeeStep = (stepNumber: number, actionId: string) => async (slackUserId: string, requestData: InferInput<typeof memberDetailSchema> | undefined, context: SlackAppContext, env: HonoSlackAppEnv) => {
  // ユーザのDMチャンネルIDを取得
  const channelId = await getOrOpenDMChannelId(slackUserId, context.client, env);

  const payeeKeyList = await env.PAYEE_KV.list();
  const payeeList = payeeKeyList.keys.map(({ name }) => name);

  await context.client.chat.postMessage({
    channel: channelId,
    text: generateText(stepNumber),
    blocks: generateBlocks(stepNumber, payeeList, actionId),
    metadata: requestData
      ? {
          event_type: 'request_fee_payee',
          event_payload: requestData,
        }
      : undefined,
  });
};

export const baseCloseSelectFeePayeeMessage = (stepNumber: number) => async (slackUserId: string, payeeName: string, timestamp: string, context: SlackAppContext, env: HonoSlackAppEnv) => {
  // ユーザのDMチャンネルIDを取得
  const channelId = await getOrOpenDMChannelId(slackUserId, context.client, env);

  await context.client.chat.update({
    channel: channelId,
    ts: timestamp,
    text: generateText(stepNumber),
    blocks: generateBlocks(stepNumber, [], undefined, payeeName),
  });
};

function generateText(stepNumber: number): string {
  return `*STEP ${stepNumber}*: 部費の支払い相手を選択してください`;
}

function generateBlocks(stepNumber: number, payeeList: string[], actionId?: string, selectedPayeeName?: string): AnyMessageBlock[] {
  const blocks: AnyMessageBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*STEP ${stepNumber}*: 部費の支払い相手を選択してください\n支払い相手は近くの役員に聞いてください`,
      },
    },
  ];

  if (!actionId && selectedPayeeName) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `選択済み`,
      },
    });
  } else if (actionId && !selectedPayeeName) {
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
          action_id: actionId,
        },
      ],
    });
  } else {
    throw new Error('Invalid state: actionId and selectedPayeeName cannot be both set or both undefined');
  }

  return blocks;
}
