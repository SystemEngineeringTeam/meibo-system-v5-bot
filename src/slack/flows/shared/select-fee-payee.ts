import type { AnyMessageBlock } from 'slack-cloudflare-workers';
import type { InferResponseType } from '@/types/openapi';
import type { SlackHandlerOptions } from '@/types/slack-handler-options';
import { getOrOpenDMChannelId } from '@/lib/get-dm-channel-id';

type RequestData = InferResponseType<'/members/_rpc/submit-info', 'post'>;

export const baseSelectFeePayeeStep = (stepNumber: number, actionId: string) => async (slackUserId: string, requestData: RequestData | undefined, { client, env }: SlackHandlerOptions) => {
  // ユーザのDMチャンネルIDを取得
  const channelId = await getOrOpenDMChannelId(slackUserId, { client, env });

  const payeeKeyList = await env.PAYEE_KV.list();
  const payeeList = payeeKeyList.keys.map(({ name }) => name);

  if (payeeList.length === 0) {
    await client.chat.postEphemeral({
      user: slackUserId,
      channel: channelId,
      text: '支払い相手の候補が設定されていません。役員に連絡してください。',
    });
    return;
  }

  await client.chat.postMessage({
    channel: channelId,
    text: generateText(stepNumber),
    blocks: generateBlocks(stepNumber, payeeList, actionId),
    metadata: {
      event_type: 'request_fee_payee',
      event_payload: requestData ? { data: JSON.stringify(requestData) } : {},
    },
  });
};

export const baseCloseSelectFeePayeeMessage = (stepNumber: number) => async (slackUserId: string, payeeName: string, timestamp: string, { client, env }: SlackHandlerOptions) => {
  // ユーザのDMチャンネルIDを取得
  const channelId = await getOrOpenDMChannelId(slackUserId, { client, env });

  await client.chat.update({
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
