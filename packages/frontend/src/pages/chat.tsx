import { client } from '@/api/client';
import ChatForm from '@/components/chat-form';
import { BASE_CHAT_API } from '@/config/constant';
import { useLayoutStore } from '@/hooks/stores/use-layout-store';
import { useMessaging, type ChatMessageMetadata } from '@/hooks/use-messaging';
import { useChat } from '@ai-sdk/react';
import { useQuery } from '@tanstack/react-query';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useSearchParams } from 'react-router';
import remarkGfm from 'remark-gfm';

const extractAgentResponse = (rawText: string) => {
  try {
    const parsed = JSON.parse(rawText);
    return parsed.agentResponse || rawText;
  } catch {
    // Fallback for partial JSON streamed as text
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
  speed = 100,
  animate = true,
  onUpdate,
}: {
  text: string;
  speed?: number;
  animate?: boolean;
  onUpdate?: () => void;
}) => {
  const [displayedText, setDisplayedText] = useState(animate ? '' : text);
  const isAnimating = useRef(animate);

  useEffect(() => {
    isAnimating.current = animate;
    setDisplayedText(animate ? '' : text);
  }, [text, animate]);

  useEffect(() => {
    if (!isAnimating.current) return;

    if (displayedText.length >= text.length) return;

    const timer: ReturnType<typeof setInterval> = setInterval(() => {
      setDisplayedText((prev) => text.substring(0, prev.length + 1));
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, displayedText]);

  useEffect(() => {
    if (isAnimating.current && onUpdate) onUpdate();
  }, [displayedText, onUpdate]);

  return (
    <div className="prose dark:prose-invert max-w-none w-full">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayedText}</ReactMarkdown>
    </div>
  );
};

export default function Chat() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const { setChatSession } = useMessaging();
  const setHeaderTitle = useLayoutStore((state) => state.setHeaderTitle);

  const startNewSession = (newId: string) => {
    setSearchParams((prev) => {
      prev.set('sessionId', newId);
      return prev;
    });
  };

  const { data: chatSession, refetch: refetchChatSession } = useQuery({
    queryKey: ['chatSessionId', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      return await client.api.chatSessionControllerGetSessionById(sessionId);
    },
    enabled: !!sessionId,
  });

  const { data: historicalMessages, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['chatSessionMessages', sessionId],
    queryFn: async () => {
      const data = await client.api.chatControllerGetMessagesBySessionId(
        sessionId as string,
        { skip: 0, take: 500 },
      );
      return data;
    },
    enabled: !!sessionId,
  });

  const { messages, sendMessage, setMessages, status } = useChat({
    transport: new DefaultChatTransport({
      api: BASE_CHAT_API,
      credentials: 'include',
    }),
    messages: (historicalMessages?.data?.messages as UIMessage[]) ?? [],
  });

  const historicalMessageIds = useMemo(() => {
    if (!historicalMessages?.data?.messages) return new Set<string>();
    return new Set(
      (historicalMessages.data.messages as UIMessage[]).map((m) => m.id),
    );
  }, [historicalMessages?.data?.messages]);

  const sortedMessages = useMemo(() => {
    const live = messages.filter((m) => !historicalMessageIds.has(m.id));
    const historical = messages.filter((m) => historicalMessageIds.has(m.id));
    return [...live.reverse(), ...historical];
  }, [messages, historicalMessageIds]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  useEffect(() => {
    if (!sessionId) {
      setMessages([]);
      return;
    }
    if (historicalMessages?.data?.messages) {
      setMessages(historicalMessages.data.messages as UIMessage[]);
    }
  }, [sessionId, historicalMessages?.data?.messages, setMessages]);

  useEffect(() => {
    setChatSession(sessionId);
  }, [sessionId, setChatSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (chatSession?.data?.title) {
      setHeaderTitle(chatSession.data.title);
    } else {
      setHeaderTitle('Chat');
    }

    return () => setHeaderTitle(null);
  }, [chatSession?.data?.title, setHeaderTitle]);

  const prevStatusRef = useRef(status);
  useEffect(() => {
    if (
      prevStatusRef.current === 'streaming' &&
      status === 'ready' &&
      sessionId
    ) {
      refetchChatSession();
    }
    prevStatusRef.current = status;
  }, [status, sessionId, refetchChatSession]);

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

  if (sessionId && isLoadingHistory) {
    return <div className="p-4">Loading messages...</div>;
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col h-full bg-background items-center justify-center px-4">
        <div className="flex flex-col items-center gap-6 w-full max-w-3xl -mt-16">
          <div className="text-4xl font-semibold text-foreground">
            What do you want to know about Unity?
          </div>
          <ChatForm handleSendMessage={handleSendMessage} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex flex-col-reverse flex-1 overflow-y-auto p-4 gap-4">
        <div ref={messagesEndRef} />
        {sortedMessages.map((m) => {
          const isHistory = historicalMessageIds.has(m.id);

          return (
            <div key={m.id} className="flex flex-col gap-1">
              {m.parts.map((part, i) => {
                if (part.type !== 'text') return null;

                if (m.role === 'user') {
                  return (
                    <div
                      key={i}
                      className="flex flex-row-reverse items-end gap-2"
                    >
                      <div className="max-w-[72%] bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-100 px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {part.text}
                        </ReactMarkdown>
                      </div>
                    </div>
                  );
                }

                const cleanText = extractAgentResponse(part.text);
                return (
                  <div key={i} className="flex items-end gap-2">
                    <div className="max-w-[72%] bg-muted/60 border border-border/20 px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm leading-relaxed">
                      <TypewriterText
                        text={cleanText}
                        speed={15}
                        animate={!isHistory}
                        onUpdate={scrollToBottom}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {status === 'submitted' && (
        <div className="flex px-4">
          <div className="font-semibold max-w-[72%] bg-muted/40 border border-border/20 px-4 py-2 rounded-2xl rounded-bl-sm text-sm leading-relaxed text-muted-foreground animate-pulse">
            Thinking...
          </div>
        </div>
      )}

      <div className="flex flex-col px-4 py-3 border-t border-border/20 justify-center items-center">
        <ChatForm handleSendMessage={handleSendMessage} />
      </div>
    </div>
  );
}
