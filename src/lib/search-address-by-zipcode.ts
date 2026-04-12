import type { Address } from '@/types/address';
import { ofetch } from 'ofetch';

export const searchAddressByZipcode = async (zipcode: string): Promise<string> => {
  const addressRes = await ofetch<string>('https://zipcloud.ibsnet.co.jp/api/search', {
    query: { zipcode },
  });
  const addressResParsed = JSON.parse(addressRes) as Address;
  const prefecture = addressResParsed.results[0].address1;
  const city = addressResParsed.results[0].address2;
  const town = addressResParsed.results[0].address3;

  return `${prefecture}${city}${town}`;
};
