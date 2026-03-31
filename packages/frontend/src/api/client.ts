import { API_BASE_URL } from '@/config/constant';
import { Api } from './sdk';

export const client = new Api({
  format: 'json',
  baseURL: API_BASE_URL,
});
