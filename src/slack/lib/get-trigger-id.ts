import type { SlackAPIClient } from 'slack-cloudflare-workers';

export const getTriggerId = async (triggerId: string | undefined, channelId: string, client: SlackAPIClient): Promise<string> => {
  if (!triggerId) {
    await client.chat.postMessage({
      channel: channelId,
      text: ':warning: 部員情報モーダルの表示に失敗しました。管理者に連絡してください。',
    });
    throw new Error('Invalid trigger ID');
  }

  return triggerId;
};
