import { create } from 'zustand';

interface ChatSessionState {
  sessionId: string | null;
  setChatSession: (sessionId: string | null) => void;
}

const useChatSession = create<ChatSessionState>((set) => ({
  sessionId: null,
  setChatSession: (sessionId: string | null) => set({ sessionId }),
}));

export default useChatSession;
