import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { v4 as uuidv4 } from 'uuid';

export const slackUsers = sqliteTable('slack_users', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  // SlackのユーザーID(再参加の場合は重複する)
  slackUserId: text('slack_user_id').notNull(),
  // ワークスペース参加日時
  joinnedAt: int('joined_at', { mode: 'timestamp' }).notNull().$default(() => new Date()),
  // ワークスペース退出日時（退出していない場合はnull）
  leftAt: int('left_at', { mode: 'timestamp' }),
});
