import { css } from 'hono/css';

const headerStyle = css`
  height: 64px;
  display: flex;
  align-items: center;

  position: sticky;
  top: 0;

  padding: 10px 40px;

  background-color: #fff;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03),
      0 1px 6px -1px rgba(0, 0, 0, 0.02),
      0 2px 4px 0 rgba(0, 0, 0, 0.02);

  h1 {
    font-size: 1.2rem;
  }
`;

export default function Header() {
  return (
    <header className={headerStyle}>
      <h1>名簿管理システム</h1>
    </header>
  );
}
