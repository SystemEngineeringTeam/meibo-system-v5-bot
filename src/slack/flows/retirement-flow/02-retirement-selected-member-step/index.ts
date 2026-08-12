import type { SlackHandlerOptions } from '@/types/slack-handler-options';
import { apiClient } from '@/lib/fetch-client';
import { getNotifyChannelId } from '@/lib/get-notify-channel-id';

export const retirementSelectedMemberStep = async (teamId: string | undefined, channelId: string | undefined, userId: string, selectedMemberIds: string[], { client, env }: SlackHandlerOptions): Promise<boolean> => {
  try {
    const res = await apiClient.POST('/members/_rpc/create-bulk-member-status-log', {
      body: { __updaterSlackId: userId, body: { status: 'LEAVE' }, memberIds: selectedMemberIds },
    });

    if (!res.data) {
      console.error('Failed to create bulk member status log', { selectedMemberIds, response: res });
      await client.chat.postEphemeral({
        channel: channelId ?? await getNotifyChannelId(teamId, env),
        user: userId,
        text: '退部処理の実行中にエラーが発生しました。管理者に連絡してください。',
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in retirementSelectedMemberStep:', error);
    await client.chat.postEphemeral({
      channel: channelId ?? await getNotifyChannelId(teamId, env),
      user: userId,
      text: '退部処理の実行中にエラーが発生しました。管理者に連絡してください。',
    });
    return false;
  }
};
