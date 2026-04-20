import { client } from '@/api/client';
import ChatForm from '@/components/chat-form';
import { BASE_CHAT_API } from '@/config/constant';
import { useLayoutStore } from '@/hooks/stores/use-layout-store';
import { useMessaging, type ChatMessageMetadata } from '@/hooks/use-messaging';
import { useChat } from '@ai-sdk/react';
import { useQuery } from '@tanstack/react-query';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useSearchParams } from 'react-router';
import remarkGfm from 'remark-gfm';

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
  speed = 100,
  animate = true,
}: {
  text: string;
  speed?: number;
  animate?: boolean;
}) => {
  const [displayedText, setDisplayedText] = useState(animate ? '' : text);
  const isAnimating = useRef(animate);
  const containerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (isAnimating.current) {
      containerRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, [displayedText]);

  return (
    <div
      ref={containerRef}
      className="prose dark:prose-invert max-w-none w-full"
    >
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

  const { data: chatSession } = useQuery({
    queryKey: ['chatSessionId', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const session =
        await client.api.chatSessionControllerGetSessionById(sessionId);
      return session;
    },
    enabled: !!sessionId,
  });

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

  const initialMessageCount = useRef<number | null>(null);
  if (initialMessageCount.current === null && messages.length > 0) {
    initialMessageCount.current = messages.length;
  }

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  useEffect(() => {
    if (historicalMessages?.data?.messages) {
      setMessages(historicalMessages.data.messages as UIMessage[]);
    }
  }, [historicalMessages, setMessages]);

  // Set chat session on nav
  useEffect(() => {
    if (!sessionId) return;
    setChatSession(sessionId);
  }, [sessionId, setChatSession]);

  // Set count to prevent effect re-render
  useEffect(() => {
    if (initialMessageCount.current === null && messages.length > 0) {
      initialMessageCount.current = messages.length;
    }
    scrollToBottom();
  }, [messages]);

  // Sync the fetched title to the global layout store
  useEffect(() => {
    if (chatSession?.data.title) {
      setHeaderTitle(chatSession.data.title);
    }

    return () => setHeaderTitle(null);
  }, [chatSession?.data.title, setHeaderTitle]);

  if (isLoading) {
    return <div>Loading messages...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages */}
      <div className="flex flex-col flex-1 overflow-y-auto p-4 gap-4">
        {messages.map((m, index) => {
          const isHistory =
            initialMessageCount.current !== null &&
            index < initialMessageCount.current;

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
                      {/* Bubble */}
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
                    {/* Bubble */}
                    <div className="max-w-[72%] bg-muted/60 border border-border/20 px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm leading-relaxed">
                      <TypewriterText
                        text={cleanText}
                        speed={15}
                        animate={!isHistory}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex px-4 py-3 border-t border-border/20 justify-center">
        <ChatForm handleSendMessage={handleSendMessage} />
      </div>
    </div>
  );
}
