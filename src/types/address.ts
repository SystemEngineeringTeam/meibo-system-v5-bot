export interface Address {
  message: null;
  results: [
    {
      address1: string; // 都道府県
      address2: string; // 市区町村
      address3: string; // 町域
      kana1: string;
      kana2: string;
      kana3: string;
      prefcode: string; // 都道府県コード
      zipcode: string; // 郵便番号
    },
  ];
  status: number;
}
