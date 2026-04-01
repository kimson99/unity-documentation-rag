import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthTokenState {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
}

const useAuthToken = create<AuthTokenState>()(
  persist(
    (set) => ({
      accessToken: null,
      setAccessToken: (token) => set({ accessToken: token }),
    }),
    {
      name: 'authToken',
    },
  ),
);

export default useAuthToken;
