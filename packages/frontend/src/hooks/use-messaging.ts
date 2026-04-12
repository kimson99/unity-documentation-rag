import { client } from '@/api/client';
import { useMutation } from '@tanstack/react-query';
import useChatSession from './stores/use-chat-session';

export interface ChatMessageMetadata {
  sessionId: string;
}

export const useMessaging = () => {
  const { sessionId, setChatSession } = useChatSession();

  const mutateSession = useMutation({
    mutationFn: async () => {
      const response = await client.api.chatSessionControllerCreateSession();
      return response.data;
    },
    onSuccess: (data) => {
      setChatSession(data.id);
    },
  });

  return {
    sessionId,
    setChatSession,
    mutateSession,
  };
};

export default useMessaging;
