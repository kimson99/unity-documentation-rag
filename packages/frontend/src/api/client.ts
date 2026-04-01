import { API_BASE_URL } from '@/config/constant';
import { Api } from './sdk';

export const client = new Api({
  format: 'json',
  baseURL: API_BASE_URL,
});

client.instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return config;
  }
  const parsed: { state: { accessToken: string } } = JSON.parse(token);
  if (parsed) {
    config.headers.Authorization = `Bearer ${parsed.state.accessToken}`;
  }
  return config;
});
