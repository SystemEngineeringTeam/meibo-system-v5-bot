import type { HonoSlackAppBindings } from '@/types/hono';
import { Hono } from 'hono';
import { SlackApp } from 'slack-cloudflare-workers';
import { memberApprovalActionHandler } from './handlers/actions/member-approval';
import { selectFeePayeeActionHandler } from './handlers/actions/select-fee-payee';
import { selectMemberTypeActionHandler } from './handlers/actions/select-member-type';
import { healthCheckCommandHandler } from './handlers/commands/health-check';
import { removePayeeNicknameCommandHandler } from './handlers/commands/remove-payee-nickname';
import { setNotifyChannelCommandHandler } from './handlers/commands/set-notify-channel';
import { setPayeeNicknameCommandHandler } from './handlers/commands/set-payee-nickname';
import { messageHandler } from './handlers/events/message';
import { teamJoinEventHandler } from './handlers/events/team-join';
import { inputMemberDetailViewHandler } from './handlers/views/input-member-detail';
import { adminOnlyCommand } from './middlewares/admin-only';
import { notifyChannelOnlyCommand } from './middlewares/notify-channel-only';

export const slackApp = new Hono<HonoSlackAppBindings>();

slackApp.all('/', async (c) => {
  const app = new SlackApp({ env: c.env });

  app.command('/health-check', healthCheckCommandHandler);
  app.event('message', messageHandler);

  // [管理者用] 通知チャンネルの設定
  app.command('/set-notify-channel', adminOnlyCommand(setNotifyChannelCommandHandler));

  // 受け取り人を設定
  app.command('/set-payee-nickname', notifyChannelOnlyCommand(setPayeeNicknameCommandHandler));
  app.command('/remove-payee-nickname', notifyChannelOnlyCommand(removePayeeNicknameCommandHandler));

  // ===== [new-commer-flow] =====
  // STEP 1
  app.event('team_join', teamJoinEventHandler);

  // STEP 2: /logged-in エンドポイントから呼び出すためなし

  // STEP 3: 選択肢に応じたアクション
  app.action('select_member_type_internal', selectMemberTypeActionHandler('internal'));
  app.action('select_member_type_external', selectMemberTypeActionHandler('external'));

  // STEP 3 → 4: 入力情報のチェック・支払い相手の選択肢の表示
  app.view('input_member_detail', inputMemberDetailViewHandler);

  // STEP 5: 承認依頼の送信
  app.action('select_fee_payee', selectFeePayeeActionHandler);

  // STEP 6: 承認・拒否
  app.action('member_approve', memberApprovalActionHandler(true));
  app.action('member_reject', memberApprovalActionHandler(false));

  return await app.run(c.req.raw, c.executionCtx);
});
