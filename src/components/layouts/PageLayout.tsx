import type { JSX } from 'hono/jsx/jsx-runtime';
import { css, Style } from 'hono/css';
import Header from '@/components/base/Header';

const globalStyle = css`
  :-hono-global {
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      font-size: 16px;
    }
  }
`;

const mainStyle = css`
  height: calc(100vh - 64px);
  padding: 40px 20px 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

interface Props {
  children: JSX.Element | JSX.Element[];
}

export default function PageLayout({ children }: Props) {
  return (
    <html>
      <head>
        <Style />
      </head>
      <body className={globalStyle}>
        <Header />
        <main className={mainStyle}>{children}</main>
      </body>
    </html>
  )
  ;
}
