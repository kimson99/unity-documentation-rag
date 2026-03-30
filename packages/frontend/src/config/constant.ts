export const API_BASE_URL =
  process.env.VITE_API_BASE_URL ?? 'http://localhost:5500/api';

export const BASE_CHAT_API = `${API_BASE_URL}/chat/stream`;
