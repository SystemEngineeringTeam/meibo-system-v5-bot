import type { AnyModalBlock, BlockActionAckHandler, ButtonAction, SlackAPIClient, ViewBlockAction, ViewInputBlock } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { getViewValue } from '@/slack/lib/get-view-value';
import { replaceModalBlock } from '@/slack/lib/replace-modal-block';

export const copyCurrentAddressActionHandler: BlockActionAckHandler<'button', HonoSlackAppEnv, ViewBlockAction<ButtonAction>> = async ({ payload, context }) => {
  if (payload.view.type !== 'modal') {
    return {
      status: 500,
      body: '[システムエラー] モーダル以外のビューで住所のコピーが発生しました。',
    };
  }

  const currentZipCodeBlockId = 'currentZipCode';
  const currentAddressBlockId = 'currentAddress';
  const parentsZipCodeBlockId = 'parentsZipCode';
  const parentsAddressBlockId = 'parentsAddress';

  const zipCode = getViewValue(payload.view, currentZipCodeBlockId);
  const currentAddress = getViewValue(payload.view, currentAddressBlockId);

  let blocks = replaceModalBlock<ViewInputBlock>(payload.view.blocks, parentsAddressBlockId, (block) => ({
    ...block,
    element: {
      type: 'plain_text_input',
      action_id: Date.now().toString(),
      initial_value: currentAddress ?? '',
    },
  }));
  blocks = replaceModalBlock<ViewInputBlock>(blocks, parentsZipCodeBlockId, (block) => ({
    ...block,
    element: {
      type: 'plain_text_input',
      action_id: Date.now().toString(),
      initial_value: zipCode ?? '',
    },
  }));
  await updateView(context.client, blocks, payload);
};

async function updateView(client: SlackAPIClient, blocks: AnyModalBlock[], payload: ViewBlockAction<ButtonAction>) {
  await client.views.update({
    view_id: payload.view.id,
    hash: payload.view.hash,
    view: {
      type: 'modal',
      callback_id: payload.view.callback_id,
      title: payload.view.title,
      submit: {
        type: 'plain_text',
        text: payload.view.submit?.text || '送信',
      },
      close: {
        type: 'plain_text',
        text: payload.view.close?.text || 'キャンセル',
      },
      blocks,
      private_metadata: payload.view.private_metadata,
    },
  });
}
