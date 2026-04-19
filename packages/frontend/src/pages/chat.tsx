import { client } from '@/api/client';
import ChatForm from '@/components/chat-form';
import { BASE_CHAT_API } from '@/config/constant';
import type { ChatMessageMetadata } from '@/hooks/use-messaging';
import { useChat } from '@ai-sdk/react';
import { useQuery } from '@tanstack/react-query';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';

const extractAgentResponse = (rawText: string) => {
  try {
    const parsed = JSON.parse(rawText);
    return parsed.agentResponse || rawText;
  } catch (e) {
    const match = rawText.match(/"agentResponse"\s*:\s*"([\s\S]*)/);
    if (match) {
      let partial = match[1];
      partial = partial.replace(/["}\s]*$/, '');
      partial = partial.replace(/\\n/g, '\n');
      return partial;
    }
    return rawText;
  }
};

const TypewriterText = ({
  text,
  speed = 20,
  animate = true,
}: {
  text: string;
  speed?: number;
  animate?: boolean;
}) => {
  const [displayedText, setDisplayedText] = useState(animate ? '' : text);
  const isAnimating = useRef(animate);

  useEffect(() => {
    if (!isAnimating.current) {
      setDisplayedText(text);
      return;
    }

    let timer: NodeJS.Timeout;

    if (displayedText.length < text.length) {
      timer = setInterval(() => {
        setDisplayedText((prev) => {
          if (prev.length >= text.length) {
            clearInterval(timer);
            return prev;
          }
          return text.substring(0, prev.length + 1);
        });
      }, speed);
    }

    return () => clearInterval(timer);
  }, [text, speed, displayedText.length]);

  return <span className="whitespace-pre-wrap">{displayedText}</span>;
};

export default function Chat() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const startNewSession = (newId: string) => {
    setSearchParams((prev) => {
      prev.set('sessionId', newId);
      return prev;
    });
  };

  const handleSendMessage = async (
    message: string,
    metadata: ChatMessageMetadata,
  ) => {
    if (!sessionId) {
      startNewSession(metadata.sessionId);
    }
    await sendMessage({
      text: message,
      metadata,
    });
  };

  const { data: historicalMessages, isLoading } = useQuery({
    queryKey: ['chatSessionMessages', sessionId],
    queryFn: async () => {
      const data = await client.api.chatControllerGetMessagesBySessionId(
        sessionId as string,
        { skip: 0, take: 10 },
      );
      return data;
    },
    enabled: !!sessionId,
  });

  const { messages, sendMessage, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: BASE_CHAT_API,
      credentials: 'include',
    }),
    messages: (historicalMessages?.data?.messages as UIMessage[]) ?? [],
  });

  // Track only the initial count of messages
  const initialMessageCount = useRef<number | null>(null);

  // Set it once when messages first load
  if (initialMessageCount.current === null && messages.length > 0) {
    initialMessageCount.current = messages.length;
  }

  useEffect(() => {
    if (historicalMessages?.data?.messages) {
      console.log('Setting', historicalMessages?.data?.messages);
      setMessages(historicalMessages.data.messages as UIMessage[]);
    }
  }, [historicalMessages, setMessages]);

  if (isLoading) {
    return <div>Loading messages...</div>;
  }

  return (
    <div className="flex flex-col h-full justify-end items-center p-4">
      <div className="flex flex-col-reverse w-full overflow-x-hidden overflow-y-auto">
        {messages.map((m, index) => {
          const isHistory =
            initialMessageCount.current !== null &&
            index < initialMessageCount.current;

          return (
            <div key={m.id} className="mb-4">
              {m.parts.map((part, i) => {
                if (part.type !== 'text') return null;

                if (m.role === 'user') {
                  return <span key={i}>{part.text}</span>;
                }

                const cleanText = extractAgentResponse(part.text);
                return (
                  <TypewriterText
                    key={i}
                    text={cleanText}
                    speed={15}
                    animate={!isHistory}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
      <ChatForm handleSendMessage={handleSendMessage} />
    </div>
  );
}
