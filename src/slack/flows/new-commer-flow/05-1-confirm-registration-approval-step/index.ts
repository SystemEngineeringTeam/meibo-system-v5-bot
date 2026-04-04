import type { AnyMessageBlock, SlackAppContext } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import type { PayeeData } from '@/types/kv';
import { getNotifyChannelId } from '@/slack/lib/get-notify-channel-id';
import { kv } from '@/utils/kv';

export interface ConfirmRegistrationApprovalStepResult {
  success: boolean;
  // 送信済み/申請内容なし/システムエラー
  reason?: 'no_request_data' | 'error';
}

export const confirmRegistrationApprovalStep = async (payerSlackUserId: string, payeeName: string, teamId: string | undefined, context: SlackAppContext, env: HonoSlackAppEnv): Promise<ConfirmRegistrationApprovalStepResult> => {
  const channelId = await getNotifyChannelId(teamId, env);

  const payeeData = await kv.get<PayeeData>(env.PAYEE_KV, payeeName);

  try {
    await context.client.chat.postMessage({
      channel: channelId,
      text: generateText(payerSlackUserId, payeeData?.slackUserId),
      blocks: generateBlocks(payerSlackUserId, payeeData?.slackUserId),
      mrkdwn: true,
      metadata: {
        event_type: 'approval_request',
        event_payload: {
          payerSlackUserId,
        },
      },
    });
  } catch (error) {
    console.error('Failed to send confirmation message:', error);
    return { success: false, reason: 'error' };
  }

  return { success: true };
};

function generateText(payerSlackUserId: string, payeeSlackUserId?: string): string {
  // ユーザIDがあればメンション、なければ @channel
  const mention = payeeSlackUserId ? `<@${payeeSlackUserId}>` : '<!channel>';

  // TODO: ユーザの登録情報を付加する
  return `${mention} *【新入部員】承認依頼が届いています* <@${payerSlackUserId}> `;
}

function generateBlocks(payerSlackUserId: string, payeeSlackUserId?: string): AnyMessageBlock[] {
  const mention = payeeSlackUserId ? `<@${payeeSlackUserId}>` : '<!channel>';

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${mention} *【新入部員】承認依頼が届いています*
申請者: <@${payerSlackUserId}>`,
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '承認',
            emoji: true,
          },
          style: 'primary',
          value: payeeSlackUserId,
          action_id: 'member_approve',
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '拒否',
            emoji: true,
          },
          style: 'danger',
          value: payeeSlackUserId,
          action_id: 'member_reject',
        },
      ],
    },
  ];
}
