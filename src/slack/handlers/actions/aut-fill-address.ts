import type { AnyModalBlock, BlockActionAckHandler, ButtonAction, SlackAPIClient, ViewBlockAction, ViewInputBlock } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { safeParse } from 'valibot';
import { getViewValue } from '@/slack/lib/get-view-value';
import { replaceModalBlock } from '@/slack/lib/replace-modal-block';
import { searchAddressByZipcode } from '@/slack/lib/search-address-by-zipcode';
import { zipCodeSchema } from '@/slack/schemas/member';

export const autoFillAddressActionHandler: BlockActionAckHandler<'button', HonoSlackAppEnv, ViewBlockAction<ButtonAction>> = async ({ context, payload }) => {
  const isCurrentAddress = payload.actions.at(0)?.value === 'currentAddress';
  const zipCodeBlockId = isCurrentAddress ? 'currentZipCode' : 'parentsZipCode';
  const addressBlockId = isCurrentAddress ? 'currentAddress' : 'parentsAddress';

  if (payload.view.type !== 'modal') {
    return {
      status: 500,
      body: '[システムエラー] モーダル以外のビューで住所の自動入力が発生しました。',
    };
  }

  const zipCode = getViewValue(payload.view, zipCodeBlockId);
  if (zipCode === undefined) {
    return {
      status: 500,
      body: '[システムエラー] 郵便番号入力欄が見つかりませんでした。',
    };
  }

  const validatedZipCodeRes = safeParse(zipCodeSchema, zipCode);
  if (!validatedZipCodeRes.success) {
    const blocks = replaceModalBlock<ViewInputBlock>(payload.view.blocks, zipCodeBlockId, (block) => ({
      ...block,
      label: {
        type: 'plain_text',
        text: `${block.label.text}\n:warning: 郵便番号の形式が誤っています`,
      },
    }));
    await updateView(context.client, blocks, payload);

    return { status: 200 };
  }

  try {
    const address = await searchAddressByZipcode(validatedZipCodeRes.output);

    let blocks = replaceModalBlock<ViewInputBlock>(payload.view.blocks, zipCodeBlockId, (block) => ({
      ...block,
      label: {
        type: 'plain_text',
        text: isCurrentAddress ? '現住所の郵便番号: 例) 123-4567' : '実家の住所の郵便番号: 例) 123-4567',
      },
    }));
    blocks = replaceModalBlock<ViewInputBlock>(blocks, addressBlockId, (block) => ({
      ...block,
      element: {
        type: 'plain_text_input',
        action_id: Date.now().toString(),
        initial_value: address,
      },
    }));
    await updateView(context.client, blocks, payload);
  } catch (error) {
    console.warn('住所情報の取得に失敗', error);

    const blocks = replaceModalBlock<ViewInputBlock>(payload.view.blocks, zipCodeBlockId, (block) => ({
      ...block,
      label: {
        type: 'plain_text',
        text: `${block.label.text}\n:warning: 住所情報が見つかりませんでした`,
      },
    }));

    await updateView(context.client, blocks, payload);
  }

  return {
    status: 200,
  };
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
