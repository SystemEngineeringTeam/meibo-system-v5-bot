import type { SlashCommandAckHandler } from 'slack-cloudflare-workers';
import type { Sex } from '@/slack/schemas/member';
import type { HonoSlackAppEnv } from '@/types/hono';
import dayjs from 'dayjs';
import { MeiboApiService } from '@/lib/meibo-api-service';

export const profileCommandHandler: SlashCommandAckHandler<HonoSlackAppEnv> = async ({ payload, context, env }) => {
  const userId = payload.user_id;

  const memberInfoRes = await MeiboApiService.getMemberInfo(userId, { env });
  if (!memberInfoRes.data) {
    await context.client.chat.postEphemeral({
      channel: payload.channel_id,
      user: payload.user_id,
      text: ':x: 登録情報が見つかりませんでした。名簿に登録されていません',
    });
    return;
  }

  // 卒業生
  if (memberInfoRes.data.value.detail.type === 'ALUMNI') {
    const base = memberInfoRes.data.value.profile.base;
    const sensitive = memberInfoRes.data.value.profile.sensitive;
    const detail = memberInfoRes.data.value.detail.detail;

    await context.client.chat.postEphemeral({
      channel: payload.channel_id,
      user: payload.user_id,
      text: `:white_check_mark: *卒業生* として登録されています

登録情報
・氏名: ${base.lastName} ${base.firstName}
・氏名（カナ）: ${base.lastNameKana} ${base.firstNameKana}
・性別: ${formatSex(sensitive.sex)}
・誕生日: ${dayjs(sensitive.birthday).format('YYYY年MM月DD日')}
・卒業年: ${detail.graduatedYear}年
・電話番号: ${sensitive.phoneNumber}
・郵便番号: ${sensitive.currentZipCode}
・住所: ${sensitive.currentAddress}
・実家の郵便番号: ${sensitive.parentsZipCode}
・実家の住所: ${sensitive.parentsAddress}
・旧役職: ${detail.oldRole}`,
    });
    return;
  }

  // 内部現役生
  if (memberInfoRes.data.value.detail.active.type === 'INTERNAL') {
    const base = memberInfoRes.data.value.profile.base;
    const sensitive = memberInfoRes.data.value.profile.sensitive;
    const active = memberInfoRes.data.value.detail.active.detail;

    await context.client.chat.postEphemeral({
      channel: payload.channel_id,
      user: payload.user_id,
      text: `:white_check_mark: *内部現役生* として登録されています

登録情報
・氏名: ${base.lastName} ${base.firstName}
・氏名（カナ）: ${base.lastNameKana} ${base.firstNameKana}
・性別: ${formatSex(sensitive.sex)}
・誕生日: ${dayjs(sensitive.birthday).format('YYYY年MM月DD日')}
・電話番号: ${sensitive.phoneNumber}
・郵便番号: ${sensitive.currentZipCode}
・住所: ${sensitive.currentAddress}
・実家の郵便番号: ${sensitive.parentsZipCode}
・実家の住所: ${sensitive.parentsAddress}
・学籍番号: ${active.studentId}
・役職: ${active.role || '-'}`,
    });
  }

  // 外部現役生
  if (memberInfoRes.data.value.detail.active.type === 'EXTERNAL') {
    const base = memberInfoRes.data.value.profile.base;
    const sensitive = memberInfoRes.data.value.profile.sensitive;
    const active = memberInfoRes.data.value.detail.active.detail;

    await context.client.chat.postEphemeral({
      channel: payload.channel_id,
      user: payload.user_id,
      text: `:white_check_mark: *外部現役生* として登録されています

登録情報
・氏名: ${base.lastName} ${base.firstName}
・氏名（カナ）: ${base.lastNameKana} ${base.firstNameKana}
・性別: ${formatSex(sensitive.sex)}
・誕生日: ${dayjs(sensitive.birthday).format('YYYY年MM月DD日')}
・電話番号: ${sensitive.phoneNumber}
・郵便番号: ${sensitive.currentZipCode}
・住所: ${sensitive.currentAddress}
・実家の郵便番号: ${sensitive.parentsZipCode}
・実家の住所: ${sensitive.parentsAddress}
・学校名: ${active.schoolName}
・学部・学科名: ${active.schoolMajor}
・所属: ${active.organization || '-'}`,
    });
  }
};

// 性別をコードから文字列に変換
function formatSex(sex: Sex): string {
  switch (sex) {
    case 'MALE':
      return '男性';
    case 'FEMALE':
      return '女性';
    case 'NOT_APPLICABLE':
    case 'NOT_KNOWN':
      return 'その他';
  }
}
