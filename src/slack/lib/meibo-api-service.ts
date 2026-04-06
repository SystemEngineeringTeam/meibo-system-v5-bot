import type { InferInput } from 'valibot';
import type { memberDetailSchema } from '../schemas/member';
import type { HonoSlackAppEnv } from '@/types/hono';
import type { TmpApiAltData, UserData } from '@/types/kv';
import { v4 } from 'uuid';
import { kv } from '@/utils/kv';
import { getUserId } from './get-user-id';

interface Options {
  env: HonoSlackAppEnv;
}

export const MeiboApiService = {
  async createMember(slackUserId: string, { env }: Options) {
    // TODO: API にユーザ作成リクエストを送る
    // API から帰ってくる userId を想定
    const uuid = v4();

    await kv.put<UserData>(env.USER_KV, slackUserId, { userId: uuid });
  },

  async putMemberDetail(slackUserId: string, memberDetail: InferInput<typeof memberDetailSchema>, { env }: Options) {
    const userId = await getUserId(slackUserId, { env });

    // TODO: API にユーザの詳細情報を保存するリクエストを送る
    await kv.put<TmpApiAltData>(env.TMP_API_ALT_KV, userId, { ...memberDetail, status: 'temporary' });
  },

  async updateMemberStatus(slackUserId: string, status: 'temporary' | 'approved' | 'rejected', { env }: Options) {
    const userId = await getUserId(slackUserId, { env });

    // TODO: API にユーザのステータスを更新するリクエストを送る
    const memberDetail = await kv.get<TmpApiAltData>(env.TMP_API_ALT_KV, userId);
    if (!memberDetail) throw new Error('Member detail not found');
    await kv.put<TmpApiAltData>(env.TMP_API_ALT_KV, userId, { ...memberDetail, status });
  },

  /**
   * TODO: 作成し直す
   * 'BEFORE_CREATE': ユーザ作成前
   * 'CREATED': ユーザ作成後、詳細情報保存前
   * 'DETAIL_SAVED': 詳細情報保存後
   * 'APPROVED': 承認後
   */
  async getMemberNewcommerStep(slackUserId: string, { env }: Options): Promise<'BEFORE_CREATE' | 'CREATED' | 'DETAIL_SAVED' | 'APPROVED' | ''> {
    const userData = await kv.get<UserData>(env.USER_KV, slackUserId);
    if (!userData) return 'BEFORE_CREATE';

    const memberDetail = await kv.get<TmpApiAltData>(env.TMP_API_ALT_KV, userData.userId);
    if (!memberDetail) return 'CREATED';

    if (memberDetail.status === 'temporary') return 'DETAIL_SAVED';

    return 'APPROVED';
  },
};
