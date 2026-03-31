export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5500';

export const BASE_CHAT_API = `${API_BASE_URL}/chat/stream`;
