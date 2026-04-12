import type { HonoSlackAppBindings } from '@/types/hono';
import { Hono } from 'hono';
import { SlackApp } from 'slack-cloudflare-workers';
import { autoFillAddressActionHandler } from './handlers/actions/aut-fill-address';
import { continuingMemberApprovalActionHandler } from './handlers/actions/continuting-member-approval';
import { copyCurrentAddressActionHandler } from './handlers/actions/copy-current-address';
import { newcommerApprovalActionHandler } from './handlers/actions/newcommer-approval';
import { selectContinuingMemberFeePayeeActionHandler } from './handlers/actions/select-continuting-member-fee-payee';
import { selectMemberTypeActionHandler } from './handlers/actions/select-member-type';
import { selectNewcommerFeePayeeActionHandler } from './handlers/actions/select-newcommer-fee-payee';
import { startContinuationActionHandler } from './handlers/actions/start-continuation';
import { healthCheckCommandHandler } from './handlers/commands/health-check';
import { recoveryNewcommerCommandHandler } from './handlers/commands/recovery-newcommer';
import { removePayeeNicknameCommandHandler } from './handlers/commands/remove-payee-nickname';
import { setNotifyChannelCommandHandler } from './handlers/commands/set-notify-channel';
import { setPayeeNicknameCommandHandler } from './handlers/commands/set-payee-nickname';
import { startContinuationCommandHandler } from './handlers/commands/start-continuation';
import { messageHandler } from './handlers/events/message';
import { teamJoinEventHandler } from './handlers/events/team-join';
import { inputContinuingMemberDetailViewHandler } from './handlers/views/input-continuing-member-detail';
import { inputNewCommerMemberDetailViewHandler } from './handlers/views/input-newcommer-member-detail';
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
  // リカバリーコマンド
  app.command('/recovery-newcommer', recoveryNewcommerCommandHandler);

  // STEP 1
  app.event('team_join', teamJoinEventHandler);

  // STEP 2: /logged-in エンドポイントから呼び出すためなし

  // STEP 3: 選択肢に応じたアクション
  app.action('select_member_type_internal', selectMemberTypeActionHandler('internal'));
  app.action('select_member_type_external', selectMemberTypeActionHandler('external'));

  // STEP 3 → 4: 入力情報のチェック・支払い相手の選択肢の表示
  app.view('input_newcomer_member_detail', inputNewCommerMemberDetailViewHandler);

  // STEP 5: 承認依頼の送信
  app.action('select_newcommer_fee_payee', selectNewcommerFeePayeeActionHandler);

  // STEP 6: 承認・拒否
  app.action('newcommer_approve', newcommerApprovalActionHandler(true));
  app.action('newcommer_reject', newcommerApprovalActionHandler(false));

  // ===== [continuing-member-flow] =====
  // STEP 1: 継続手続きの開始
  app.command('/start-continuation', startContinuationCommandHandler);

  // STEP 2: 登録情報の確認
  app.action('start_continuation', startContinuationActionHandler);

  // STEP 2 → 3: 入力情報のチェック・支払い相手の選択肢の表示
  app.view('input_continuing_member_profile', inputContinuingMemberDetailViewHandler);

  // STEP 4: 承認依頼の送信
  app.action('select_continuing_member_fee_payee', selectContinuingMemberFeePayeeActionHandler);

  // STEP 5: 承認・拒否
  app.action('continuing_member_approve', continuingMemberApprovalActionHandler(true));
  app.action('continuing_member_reject', continuingMemberApprovalActionHandler(false));

  // ===== 共通 =====
  // 住所の自動入力
  app.action('auto_fill_address', autoFillAddressActionHandler);
  // 現在の住所を実家の住所にコピー
  app.action('copy_current_address', copyCurrentAddressActionHandler);

  return await app.run(c.req.raw, c.executionCtx);
});
