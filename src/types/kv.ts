// slackUserId と Email 紐付け時の個人特定用

import type { InferInput } from 'valibot';
import type { memberDetailSchema } from '@/slack/flows/new-commer-flow/03-input-member-detail-step/validation';

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

// 承認申請の保存用
// key: payerSlackUserId
export interface ApprovalRequestData {
  // timestamp(=メッセージの特定用)
  ts?: string;
  // TODO: API から取得したユーザ情報を保存するようにする
  requestData: InferInput<typeof memberDetailSchema>;
}
