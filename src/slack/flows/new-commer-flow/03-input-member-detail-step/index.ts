import type { AnyModalBlock, SlackAppContext } from 'slack-cloudflare-workers';
import type { InferInput, InferIssue } from 'valibot';
import type { HonoSlackAppEnv } from '@/types/hono';
import type { ChannelData } from '@/types/kv';
import type { NormalizedViewState } from '@/utils/normalize-slack-view-state';
import dayjs from 'dayjs';
import { safeParse } from 'valibot';
import { kv } from '@/utils/kv';
import { memberDetailSchema } from './validation';

export const inputMemberDetailStep = async (userId: string, selectedValue: string, context: SlackAppContext, env: HonoSlackAppEnv) => {
  // ユーザのDMチャンネルIDを取得
  const channelData = await kv.get<ChannelData>(env.CHANNEL_KV, userId);
  if (!channelData) {
    console.error(`No channel data found for user ${userId}`);
    return;
  }

  if (!context.triggerId) {
    await context.client.chat.postMessage({
      channel: channelData.channelId,
      text: ':warning: 部員情報モーダルの表示に失敗しました。管理者に連絡してください。',
    });
    return;
  }

  const memberTypeText = selectedValue === 'internal' ? '内部生' : '外部生';
  await context.client.views.open({
    trigger_id: context.triggerId,
    view: {
      type: 'modal',
      callback_id: 'input_member_detail',
      title: {
        type: 'plain_text',
        text: `部員情報の入力（${memberTypeText}）`,
      },
      submit: {
        type: 'plain_text',
        text: '送信',
      },
      close: {
        type: 'plain_text',
        text: 'キャンセル',
      },
      blocks: generateBlocks(selectedValue),
    },
  });
};

interface CreateMemberDetailResultSuccess {
  success: true;
  // TODO: API から取得したユーザ情報を返す
  data: InferInput<typeof memberDetailSchema>;
}

interface CreateMemberDetailResultFailure {
  success: false;
  errors: Record<string, string>;
}

export const createMemberDetail = async (inputValues: NormalizedViewState): Promise<CreateMemberDetailResultSuccess | CreateMemberDetailResultFailure> => {
  const memberDetail = safeParse(memberDetailSchema, inputValues);

  if (!memberDetail.success) {
    return {
      success: false,
      errors: toSlackErrors(memberDetail.issues),
    };
  }

  try {
  // TODO: ユーザ詳細情報を作成する API を呼び出す
    return {
      success: true,
      data: memberDetail.output,
    };
  } catch (error) {
    console.error('Failed to create member detail:', error);
    return {
      success: false,
      errors: {
        warning_divider: '部員情報の登録に失敗しました。時間をおいて再度お試しください。',
      },
    };
  }
};

function generateBlocks(selectedValue: string): AnyModalBlock[] {
  const isInternal = selectedValue === 'internal';

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*STEP 3*: 部員情報を入力してください\n:warning: 必ず大学に登録されている正式な情報を入力してください :warning:',
      },
    },
    {
      type: 'divider',
      block_id: 'warning_divider',
    },
    ...generateMemberBaseBlocks(),
    ...generateMemberSensitiveBlocks(),
    ...(isInternal ? generateInternalOnlyBlocks() : generateExternalOnlyBlocks()),
  ];
}

function generateMemberBaseBlocks(): AnyModalBlock[] {
  return [
    {
      type: 'input',
      block_id: 'lastName',
      label: {
        type: 'plain_text',
        text: '苗字: 例) 佐藤',
      },
      element: {
        type: 'plain_text_input',
        action_id: 'lastName',
      },
    },
    {
      type: 'input',
      block_id: 'firstName',
      label: {
        type: 'plain_text',
        text: '名前: 例) 智',
      },
      element: {
        type: 'plain_text_input',
        action_id: 'firstName',
      },
    },
    {
      type: 'input',
      block_id: 'lastNameKana',
      label: {
        type: 'plain_text',
        text: '苗字のフリガナ: 例) サトウ',
      },
      element: {
        type: 'plain_text_input',
        action_id: 'lastNameKana',
      },
    },
    {
      type: 'input',
      block_id: 'firstNameKana',
      label: {
        type: 'plain_text',
        text: '名前のフリガナ: 例) サトル',
      },
      element: {
        type: 'plain_text_input',
        action_id: 'firstNameKana',
      },
    },
  ];
}

function generateMemberSensitiveBlocks(): AnyModalBlock[] {
  // 今年度から見て18年前の4月1日
  const initialDate = dayjs().subtract(19, 'year').month(3).date(1).format('YYYY-MM-DD');

  return [
    {
      type: 'input',
      block_id: 'birthday',
      label: {
        type: 'plain_text',
        text: '生年月日',
      },
      element: {
        type: 'datepicker',
        action_id: 'birthday',
        initial_date: initialDate,
        placeholder: {
          type: 'plain_text',
          text: '日付を選択',
        },
      },
    },
    {
      type: 'input',
      block_id: 'gender',
      label: {
        type: 'plain_text',
        text: '性別',
      },
      element: {
        type: 'static_select',
        action_id: 'gender',
        placeholder: {
          type: 'plain_text',
          text: '性別を選択',
        },
        options: [
          {
            text: { type: 'plain_text', text: '男性' },
            value: 'male',
          },
          {
            text: { type: 'plain_text', text: '女性' },
            value: 'female',
          },
          {
            text: { type: 'plain_text', text: 'その他' },
            value: 'other',
          },
        ],
      },
    },
    {
      type: 'input',
      block_id: 'phoneNumber',
      label: {
        type: 'plain_text',
        text: '電話番号: 例) 090-1234-5678',
      },
      element: {
        type: 'plain_text_input',
        action_id: 'phoneNumber',
      },
    },
    {
      type: 'input',
      block_id: 'currentZipCode',
      label: {
        type: 'plain_text',
        text: '現住所の郵便番号: 例) 123-4567',
      },
      element: {
        type: 'plain_text_input',
        action_id: 'currentZipCode',
      },
    },
    {
      type: 'input',
      block_id: 'currentAddress',
      label: {
        type: 'plain_text',
        text: '現住所: 例) 愛知県名古屋市中区本丸1-1',
      },
      element: {
        type: 'plain_text_input',
        action_id: 'currentAddress',
      },
    },
    {
      type: 'input',
      block_id: 'parentsZipCode',
      label: {
        type: 'plain_text',
        text: '実家の住所の郵便番号: 例) 123-4567',
      },
      element: {
        type: 'plain_text_input',
        action_id: 'parentsZipCode',
      },
    },
    {
      type: 'input',
      block_id: 'parentsAddress',
      label: {
        type: 'plain_text',
        text: '実家の住所: 例) 愛知県名古屋市中区本丸1-1',
      },
      element: {
        type: 'plain_text_input',
        action_id: 'parentsAddress',
      },
    },
  ];
}

function generateInternalOnlyBlocks(): AnyModalBlock[] {
  return [
    {
      type: 'input',
      block_id: 'studentId',
      label: {
        type: 'plain_text',
        text: '学籍番号: 例) k23001',
      },
      element: {
        type: 'plain_text_input',
        action_id: 'studentId',
      },
    },
  ];
}

function generateExternalOnlyBlocks(): AnyModalBlock[] {
  return [
    {
      type: 'input',
      block_id: 'schoolName',
      label: {
        type: 'plain_text',
        text: '学校名',
      },
      element: {
        type: 'plain_text_input',
        action_id: 'schoolName',
      },
    },
    {
      type: 'input',
      block_id: 'schoolMajor',
      label: {
        type: 'plain_text',
        text: '学部・学科・専攻など',
      },
      element: {
        type: 'plain_text_input',
        action_id: 'schoolMajor',
      },
      optional: true,
    },
    {
      type: 'input',
      block_id: 'organization',
      label: {
        type: 'plain_text',
        text: '所属団体名',
      },
      element: {
        type: 'plain_text_input',
        action_id: 'organization',
      },
      optional: true,
    },
  ];
}

function toSlackErrors(issues: Array<InferIssue<typeof memberDetailSchema>>): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const issue of issues) {
    const blockId = issue.path?.[0]?.key;
    if (typeof blockId === 'string') {
      errors[blockId] = issue.message;
    }
  }

  return errors;
}
