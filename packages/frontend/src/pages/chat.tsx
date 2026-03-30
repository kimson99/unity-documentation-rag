import ChatForm from '@/components/chat-form';
import { BASE_CHAT_API } from '@/config/constant';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

export default function Chat() {
  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: BASE_CHAT_API,
      credentials: 'include',
    }),
  });

  const handleSendMessage = async (message: string) => {
    await sendMessage({
      text: message,
    });
  };

  return (
    <div className="flex flex-col h-full justify-end items-center p-4">
      <div className="flex flex-col-reverse w-full overflow-x-hidden overflow-y-auto">
        {messages.map((m) => (
          <div key={m.id}>
            {m.parts.map((part, i) =>
              part.type === 'text' ? <span key={i}>{part.text}</span> : null,
            )}
          </div>
        ))}
      </div>
      <ChatForm handleSendMessage={handleSendMessage} />
    </div>
  );
}
