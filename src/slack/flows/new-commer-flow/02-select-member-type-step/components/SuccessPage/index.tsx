import { css } from 'hono/css';
import PageLayout from '@/components/layouts/PageLayout';

interface Props {
  teamId: string;
  appId: string;
}

const buttonWrapperStyle = css`
  padding: 20px;
`;

export function SuccessPage({ teamId, appId }: Props) {
  return (
    <PageLayout>
      <h1>Gmail の紐付けが完了しました</h1>
      <p>SlackのDMより，引き続き登録を行ってください。</p>

      <div class={buttonWrapperStyle}>
        <a href={`slack://app?team=${teamId}&id=${appId}&tab=message`}>Slackを開く</a>
      </div>
    </PageLayout>
  );
}
