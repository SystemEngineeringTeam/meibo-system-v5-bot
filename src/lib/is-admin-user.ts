import type { SlackAPIClient } from 'slack-cloudflare-workers';

/** Slack ワークスペースの管理者・オーナーかどうかを判定する */
export const isAdminUser = async (client: SlackAPIClient, userId: string): Promise<boolean> => {
  const res = await client.users.info({ user: userId });
  const user = res.user;

  return user?.is_admin === true
    || user?.is_owner === true
    || user?.is_primary_owner === true;
};
