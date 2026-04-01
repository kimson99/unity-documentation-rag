import { type UserDto } from '@/api/sdk';
import { create } from 'zustand';

interface UserState {
  user: UserDto | null;
  setUser: (user: UserDto | null) => void;
}

const useUser = create<UserState>((set) => ({
  user: null,
  setUser: (user: UserDto | null) => set({ user }),
}));

export default useUser;
