import type { SlackHandlerOptions } from '@/types/slack-handler-options';
import { ofetch } from 'ofetch';
import { apiClient } from './fetche-client';
import { getNotifyChannelId } from './get-notify-channel-id';
import { getUserId } from './get-user-id';

export const SpreadSheetsApiService = {
  async postMemberInfo(payerSlackUserId: string, approverSlackUserId: string, teamId: string | undefined, { env, client }: SlackHandlerOptions) {
    const userId = await getUserId(payerSlackUserId, { client, env });
    const userRes = await apiClient.GET('/members/{publicId}/info', { params: { path: { publicId: userId } } });

    const approverSlackUser = await client.users.info({ user: approverSlackUserId });
    const approver = approverSlackUser.user?.profile?.display_name || approverSlackUser.user?.profile?.real_name || approverSlackUser;

    if (userRes.data === undefined) {
      await client.chat.postMessage({
        channel: await getNotifyChannelId(teamId, env),
        text: `:warning: Spread Sheets への登録に失敗しました
・ 部費受け渡し相手: ${approver}`,
      });
      return;
    }

    const detail = userRes.data.value.detail;
    if (detail.type === 'ALUMNI') {
      console.warn('卒業生のため Spread Sheets への登録をスキップします');
      return;
    }

    const studentId = detail.active.type === 'INTERNAL' ? detail.active.detail.studentId : detail.active.detail.organization;
    const name = `${userRes.data.value.profile.base.lastName} ${userRes.data.value.profile.base.firstName}`;

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
・学籍番号(団体名): ${studentId}
・氏名: ${name}
・部費受け渡し相手: ${approver}`,
      });
    }
  },
};
