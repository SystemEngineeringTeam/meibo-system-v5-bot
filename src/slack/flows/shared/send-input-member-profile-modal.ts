import type { AnyModalBlock, SlackAPIClient } from 'slack-cloudflare-workers';
import dayjs from 'dayjs';

export const sendInputMemberProfileModal = async (selectedValue: string, callbackId: string, triggerId: string, selectMemberTypeTimestamp: string, client: SlackAPIClient, defaultValues?: Record<string, string>) => {
  const memberTypeText = selectedValue === 'internal' ? '内部生' : '外部生';
  const titleText = defaultValues ? `部員情報の確認（${memberTypeText}）` : `部員情報の入力（${memberTypeText}）`;
  await client.views.open({
    trigger_id: triggerId,
    view: {
      type: 'modal',
      callback_id: callbackId,
      title: {
        type: 'plain_text',
        text: titleText,
      },
      submit: {
        type: 'plain_text',
        text: '送信',
      },
      close: {
        type: 'plain_text',
        text: 'キャンセル',
      },
      blocks: generateBlocks(selectedValue, defaultValues),
      private_metadata: selectMemberTypeTimestamp, // 部員種別選択肢メッセージの更新のため
    },
  });
};

function generateBlocks(selectedValue: string, defaultValues?: Record<string, string>): AnyModalBlock[] {
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
    ...generateMemberBaseBlocks(defaultValues),
    {
      type: 'divider',
    },
    ...generateMemberSensitiveBlocks(defaultValues),
    {
      type: 'divider',
    },
    ...generateActiveOnlyBlocks(defaultValues),
    ...(isInternal ? generateInternalOnlyBlocks() : generateExternalOnlyBlocks()),
  ];
}

function generateMemberBaseBlocks(defaultValues?: Record<string, string>): AnyModalBlock[] {
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
        initial_value: defaultValues?.lastName || '',
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
        initial_value: defaultValues?.firstName || '',
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
        initial_value: defaultValues?.lastNameKana || '',

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
        initial_value: defaultValues?.firstNameKana || '',
      },
    },
  ];
}

function generateMemberSensitiveBlocks(defaultValues?: Record<string, string>): AnyModalBlock[] {
  // 今年度から見て18年前の4月1日
  const initialDate = defaultValues?.birthday ?? dayjs().subtract(19, 'year').month(3).date(1).format('YYYY-MM-DD');

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
      block_id: 'sex',
      label: {
        type: 'plain_text',
        text: '性別',
      },
      element: {
        type: 'static_select',
        action_id: 'sex',
        placeholder: {
          type: 'plain_text',
          text: '性別を選択',
        },
        // TODO: 初期値の設定を要確認
        initial_option: defaultValues?.sex
          ? {
              text: {
                type: 'plain_text',
                text: defaultValues.sex ?? '',
              },
            }
          : undefined,
        options: [
          {
            text: { type: 'plain_text', text: '男性' },
            value: 'MALE',
          },
          {
            text: { type: 'plain_text', text: '女性' },
            value: 'FEMALE',
          },
          {
            text: { type: 'plain_text', text: 'その他' },
            value: 'NOT_KNOWN',
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
        initial_value: defaultValues?.phoneNumber || '',
      },
    },
    {
      type: 'divider',
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
        initial_value: defaultValues?.currentZipCode || '',
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          action_id: 'auto_fill_address',
          text: {
            type: 'plain_text',
            text: '郵便番号から住所を自動入力',
          },
          value: 'currentAddress',
        },
      ],
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
        initial_value: defaultValues?.currentAddress || '',
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*実家の住所を入力してください*\n実家住みの場合は現住所と同じ内容を入力してください`,
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          style: 'primary',
          action_id: 'copy_current_address',
          text: {
            type: 'plain_text',
            text: '現住所を実家の住所にコピー',
          },
          value: 'sameAsCurrentAddress',
        },
      ],
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
        initial_value: defaultValues?.parentsZipCode || '',
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          action_id: 'auto_fill_address',
          text: {
            type: 'plain_text',
            text: '郵便番号から住所を自動入力',
          },
          value: 'parentsAddress',
        },
      ],
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
        initial_value: defaultValues?.parentsAddress || '',
      },
    },
  ];
}

function generateActiveOnlyBlocks(defaultValues?: Record<string, string>): AnyModalBlock[] {
  return [
    {
      type: 'input',
      block_id: 'grade',
      label: {
        type: 'plain_text',
        text: '学年',
      },
      element: {
        type: 'static_select',
        action_id: 'grade',
        placeholder: {
          type: 'plain_text',
          text: '学年を選択',
        },
        // TODO: 初期値の設定を要確認
        initial_option: defaultValues?.grade
          ? {
              text: {
                type: 'plain_text',
                text: defaultValues.grade ?? '',
              },
            }
          : undefined,
        options: [
          {
            text: { type: 'plain_text', text: '学部1年 (B1)' },
            value: 'B1',
          },
          {
            text: { type: 'plain_text', text: '学部2年 (B2)' },
            value: 'B2',
          },
          {
            text: { type: 'plain_text', text: '学部3年 (B3)' },
            value: 'B3',
          },
          {
            text: { type: 'plain_text', text: '学部4年 (B4)' },
            value: 'B4',
          },
          {
            text: { type: 'plain_text', text: '修士1年 (M1)' },
            value: 'M1',
          },
          {
            text: { type: 'plain_text', text: '修士2年 (M2)' },
            value: 'M2',
          },
          {
            text: { type: 'plain_text', text: '博士1年 (D1)' },
            value: 'D1',
          },
          {
            text: { type: 'plain_text', text: '博士2年 (D2)' },
            value: 'D2',
          },
          {
            text: { type: 'plain_text', text: '博士3年 (D3)' },
            value: 'D3',
          },
        ],
      },
    },
  ];
}

function generateInternalOnlyBlocks(defaultValues?: Record<string, string>): AnyModalBlock[] {
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
        initial_value: defaultValues?.studentId || '',
      },
    },
  ];
}

function generateExternalOnlyBlocks(defaultValues?: Record<string, string>): AnyModalBlock[] {
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
        initial_value: defaultValues?.schoolName || '',
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
        initial_value: defaultValues?.schoolMajor || '',
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
        initial_value: defaultValues?.organization || '',
      },
      optional: true,
    },
  ];
}
