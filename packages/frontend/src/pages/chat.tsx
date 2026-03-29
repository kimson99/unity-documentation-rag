import ChatForm from '@/components/chat-form';
import { useChat } from '@ai-sdk/react';

export default function Chat() {
  const { messages, sendMessage, status } = useChat();

  return (
    <div className="flex h-full justify-center items-end p-4">
      <ChatForm />
    </div>
  );
}
