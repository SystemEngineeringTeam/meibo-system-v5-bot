import type { SlackAppContext } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import type { ApprovalRequestData, PayeeData } from '@/types/kv';
import { kv } from '@/utils/kv';

export interface ConfirmRegistrationApprovalStepResult {
  success: boolean;
  // 送信済み/申請内容なし/システムエラー
  reason?: 'sent' | 'no_request_data' | 'error';
}

export const confirmRegistrationApprovalStep = async (payerSlackUserId: string, payeeName: string, context: SlackAppContext, env: HonoSlackAppEnv): Promise<ConfirmRegistrationApprovalStepResult> => {
  const channelId = env.NOTIFY_CHANNEL_ID;

  // 承認依頼の申請内容を取得
  const approvalRequestData = await kv.get<ApprovalRequestData>(env.APPROVAL_REQUEST_KV, payerSlackUserId);
  if (!approvalRequestData) {
    console.warn(`No request data found for user: ${payerSlackUserId}`);
    return { success: false, reason: 'no_request_data' };
  }

  if (approvalRequestData.ts) {
    // すでに申請が送信されている場合は再送しない
    return { success: false, reason: 'sent' };
  }

  const payeeData = await kv.get<PayeeData>(env.PAYEE_KV, payeeName);

  try {
    const response = await context.client.chat.postMessage({
      channel: channelId,
      text: generateText(payeeData?.slackUserId, payerSlackUserId),
      mrkdwn: true,
    });

    if (!response.ts) return { success: false, reason: 'sent' };

    // 承認依頼のタイムスタンプを保存
    await kv.put<ApprovalRequestData>(env.APPROVAL_REQUEST_KV, payerSlackUserId, {
      ts: response.ts,
      requestData: approvalRequestData.requestData,
    });

    // ✅
    await context.client.reactions.add({
      channel: channelId,
      timestamp: response.ts,
      name: 'white_check_mark',
    });
    // 🚫
    await context.client.reactions.add({
      channel: channelId,
      timestamp: response.ts,
      name: 'no_entry_sign',
    });
  } catch (error) {
    console.error('Failed to send confirmation message:', error);
    return { success: false, reason: 'error' };
  }

  return { success: true };
};

function generateText(payeeSlackUserId?: string, payerSlackUserId?: string): string {
  // ユーザIDがあればメンション、なければ @channel
  const mention = payeeSlackUserId ? `<@${payeeSlackUserId}>` : '<!channel>';

  // TODO: ユーザの登録情報を付加する
  return `${mention} *【新入部員】承認依頼が届いています*
申請者: <@${payerSlackUserId}> `;
}
