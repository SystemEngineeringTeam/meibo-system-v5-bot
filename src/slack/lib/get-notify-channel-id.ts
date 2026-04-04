import type { HonoSlackAppEnv } from '@/types/hono';
import type { SettingsData } from '@/types/kv';
import { kv } from '@/utils/kv';

export const getNotifyChannelId = async (teamId: string | undefined, env: HonoSlackAppEnv): Promise<string> => {
  if (!teamId) {
    console.warn('Team ID is null, cannot get notify channel ID');
    throw new Error('Team ID is required to get notify channel ID');
  }

  const settingsData = await kv.get<SettingsData>(env.SETTINGS_KV, teamId);

  if (!settingsData?.notifyChannelId) {
    console.warn(`Notify channel ID not found for team ${teamId}`);
    throw new Error('Notify channel ID not found');
  }

  return settingsData.notifyChannelId;
};
