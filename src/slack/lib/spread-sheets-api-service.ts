import type { TmpApiAltData } from '@/types/kv';
import type { SlackHandlerOptions } from '@/types/slack-handler-options';
import { ofetch } from 'ofetch';
import { getNotifyChannelId } from './get-notify-channel-id';

export const SpreadSheetsApiService = {
  async postMemberInfo(userData: TmpApiAltData | null, approverSlackUserId: string, teamId: string | undefined, { env, client }: SlackHandlerOptions) {
    const approverSlackUser = await client.users.info({ user: approverSlackUserId });

    if (userData === null) {
      await client.chat.postMessage({
        channel: await getNotifyChannelId(teamId, env),
        text: `:warning: Spread Sheets への登録に失敗しました
          userData が見つかりませんでした...
          - 部費受け渡し相手: ${approverSlackUserId}`,
      });
      return;
    }

    const studentId = 'studentId' in userData ? userData.studentId : userData.organization;
    const name = `${userData.lastName} ${userData.firstName}`;
    const approver = approverSlackUser.user?.profile?.display_name ?? approverSlackUser;

    try {
      await ofetch(env.SPREAD_SHEET_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          name,
          payee: approver,
        }),
        redirect: 'follow',
      });
    } catch (error) {
      console.error('Failed to post member info to Spread Sheets API:', error);

      const channelId = await getNotifyChannelId(teamId, env);
      await client.chat.postMessage({
        channel: channelId,
        text: `:warning: Spread Sheets への登録に失敗しました
          登録内容:
          - 学籍番号(団体名): ${studentId}
          - 氏名: ${name}
          - 部費受け渡し相手: ${approver}`,
      });
    }
  },
};
