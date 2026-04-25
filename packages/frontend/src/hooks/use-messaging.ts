import { client } from '@/api/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useChatSession from './stores/use-chat-session';

export interface ChatMessageMetadata {
  sessionId: string;
}

export const useMessaging = () => {
  const { sessionId, setChatSession } = useChatSession();
  const queryClient = useQueryClient();

  const mutateSession = useMutation({
    mutationFn: async () => {
      const response = await client.api.chatSessionControllerCreateSession();
      return response.data;
    },
    onSuccess: (data) => {
      setChatSession(data.id);
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
    },
  });

  return {
    sessionId,
    setChatSession,
    mutateSession,
  };
};

export default useMessaging;
