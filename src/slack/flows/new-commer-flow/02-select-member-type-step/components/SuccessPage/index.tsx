import { css } from 'hono/css';
import PageLayout from '@/components/layouts/PageLayout';

interface Props {
  teamId: string;
  appId: string;
}

const buttonWrapperStyle = css`
  padding-top: 30px;
`;

const buttonStyle = css`
  padding: 15px 15px;
  color: #fff;
  background-color: #1777FF;
  text-decoration: none;
  border-radius: 8px;
`;

export function SuccessPage({ teamId, appId }: Props) {
  return (
    <PageLayout>
      <h1>Gmail の紐付けが完了しました</h1>
      <p>SlackのDMより，引き続き登録を行ってください。</p>

      <div class={buttonWrapperStyle}>
        <a class={buttonStyle} href={`slack://app?team=${teamId}&id=${appId}&tab=message`}>Slackを開く</a>
      </div>
    </PageLayout>
  );
}
