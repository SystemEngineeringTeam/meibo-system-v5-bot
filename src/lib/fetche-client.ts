import type { paths } from '@/types/openapi.gen';
import createClient from 'openapi-fetch';

export const client = createClient<paths>({ baseUrl: process.env.API_BASE_URL });
