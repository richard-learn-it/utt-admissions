import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '@/types/chat';
import { ChatMessageBubble } from './ChatMessageBubble';

interface Props {
  messages: ChatMessage[];
}

export const ChatArea: React.FC<Props> = ({ messages }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-6 space-y-4">
      {messages.map(msg => (
        <ChatMessageBubble key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
};
