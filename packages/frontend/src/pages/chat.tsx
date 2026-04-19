import ChatForm from '@/components/chat-form';
import { BASE_CHAT_API } from '@/config/constant';
import type { ChatMessageMetadata } from '@/hooks/use-messaging';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef } from 'react';

export default function Chat() {
  const { messages, sendMessage, isLoading } = useChat({
    transport: new DefaultChatTransport({
      api: BASE_CHAT_API,
      credentials: 'include',
    }),
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (
    message: string,
    metadata: ChatMessageMetadata,
  ) => {
    await sendMessage({
      text: message,
      metadata,
    });
  };

  const parseMessageContent = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      if (parsed.agentResponse) {
        return parsed.agentResponse;
      }
      return text;
    } catch {
      return text;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] p-6 max-w-5xl mx-auto w-full">
      <div className="mb-4">
        <h1 className="text-3xl font-bold">Unity Documentation Assistant</h1>
        <p className="text-muted-foreground">Ask questions about Unity documentation</p>
      </div>

      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center space-y-2">
              <p className="text-lg">Start a conversation by asking a question about Unity</p>
              <p className="text-sm">For example: "How do I create a GameObject?"</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-lg p-4 ${
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {m.parts.map((part, i) =>
                    part.type === 'text' ? (
                      <div key={i} className="whitespace-pre-wrap break-words">
                        {parseMessageContent(part.text)}
                      </div>
                    ) : null,
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="flex justify-center">
        <ChatForm handleSendMessage={handleSendMessage} />
      </div>
    </div>
  );
}
