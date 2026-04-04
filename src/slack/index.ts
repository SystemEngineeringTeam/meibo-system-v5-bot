import type { HonoSlackAppBindings } from '@/types/hono';
import { Hono } from 'hono';
import { SlackApp } from 'slack-cloudflare-workers';
import { selectFeePayeeActionHandler } from './handlers/actions/select-fee-payee';
import { selectMemberTypeActionHandler } from './handlers/actions/select-member-type';
import { healthCheckCommandHandler } from './handlers/commands/health-check';
import { selectMemberTypeStepTestCommandHandler } from './handlers/commands/select-member-type-step-test';
import { selectFeePayeeStepTestCommandHandler } from './handlers/commands/select-payee-step-test';
import { teamJoinTestCommandHandler } from './handlers/commands/team-join-test';
import { messageHandler } from './handlers/events/message';
import { teamJoinEventHandler } from './handlers/events/team-join';
import { inputMemberDetailViewHandler } from './handlers/views/input-member-detail';

export const slackApp = new Hono<HonoSlackAppBindings>();

slackApp.all('/', async (c) => {
  const app = new SlackApp({ env: c.env });

  app.command('/health-check', healthCheckCommandHandler);
  app.event('message', messageHandler);

  // STEP 1
  app.event('team_join', teamJoinEventHandler);
  app.command('/test-team-join', teamJoinTestCommandHandler);

  // STEP 2 (選択肢の表示のみ): 実際は /logged-in エンドポイントから呼び出す
  app.command('/test-select-member-type-step', selectMemberTypeStepTestCommandHandler);

  // STEP 3: 選択肢に応じたアクション
  app.action('select_member_type_internal', selectMemberTypeActionHandler('internal'));
  app.action('select_member_type_external', selectMemberTypeActionHandler('external'));

  // STEP 3 → 4: 入力情報のチェック・支払い相手の選択肢の表示
  app.view('input_member_detail', inputMemberDetailViewHandler);
  app.command('/test-select-fee-payee-step', selectFeePayeeStepTestCommandHandler);

  // STEP 5: 承認依頼の送信
  app.action('select_fee_payee', selectFeePayeeActionHandler);

  return await app.run(c.req.raw, c.executionCtx);
});
