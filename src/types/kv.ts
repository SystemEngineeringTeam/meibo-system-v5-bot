// slackUserId と Email 紐付け時の個人特定用

import type { InferInput } from 'valibot';
import type { memberDetailSchema } from '@/slack/schemas/member';

// key: slackUserId 紐付けk用 key
export interface LinkData {
  slackUserId: string;
}

// ユーザのDMチャンネルID保存用
// key: slackUserId
export interface ChannelData {
  channelId: string;
}

// backend のユーザIDと slackUserId の紐付け用
// key: slackUserId
export interface UserData {
  userId: string;
}

// 部費の支払い相手の選択肢保存用
// key: name
export interface PayeeData {
  slackUserId: string;
}

// key: ワークスペースID
export interface SettingsData {
  notifyChannelId: string;
}

// 仮のAPI代替用
// key: userId
export type TmpApiAltData = InferInput<typeof memberDetailSchema> & {
  // 仮登録/入部/退部/継続
  status: 'temporary' | 'approved' | 'rejected';
};
