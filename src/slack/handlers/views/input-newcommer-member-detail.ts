import type { ViewAckHandler, ViewLazyHandler } from 'slack-cloudflare-workers';
import type { CreateMemberDetailResult } from '@/slack/flows/new-commer-flow/03-input-member-profile-step';
import type { HonoSlackAppEnv } from '@/types/hono';
import { closeSelectMemberTypeMessage } from '@/slack/flows/new-commer-flow/02-select-member-type-step';
import { createMemberDetail } from '@/slack/flows/new-commer-flow/03-input-member-profile-step';
import { selectFeePayeeStep } from '@/slack/flows/new-commer-flow/04-select-fee-payee-step';
import { normalizeViewState } from '@/utils/normalize-slack-view-state';

export const inputNewCommerMemberDetailViewAckHandler: ViewAckHandler<HonoSlackAppEnv> = async ({ context, payload, env }) => {
  const inputValues = normalizeViewState(payload.view.state.values);
  const res = await createMemberDetail(payload.user.id, inputValues, env);
  if (!res.success) {
    return {
      response_action: 'errors',
      errors: res.errors,
    };
  }

  context.custom.createMemberResult = res;

  return {
    response_action: 'clear',
  };
};

export const inputNewCommerMemberDetailLazyViewHandler: ViewLazyHandler<HonoSlackAppEnv> = async ({ context, payload, env }) => {
  const selectMemberTypeTimestamp = payload.view.private_metadata;

  const createMemberResult: CreateMemberDetailResult | undefined = context.custom.createMemberResult;
  if (createMemberResult?.success !== true) return;

  await Promise.all([
    selectFeePayeeStep(payload.user.id, createMemberResult.data, { client: context.client, env }),
    closeSelectMemberTypeMessage(payload.user.id, selectMemberTypeTimestamp, { client: context.client, env }),
  ]);
};
