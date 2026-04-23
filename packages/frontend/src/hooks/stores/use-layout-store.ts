import { create } from 'zustand';

interface LayoutState {
  headerTitle: string | null;
  setHeaderTitle: (title: string | null) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  headerTitle: null,
  setHeaderTitle: (title) => set({ headerTitle: title }),
}));
