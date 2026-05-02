import React, { useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatArea } from '@/components/chat/ChatArea';
import { ChatInput } from '@/components/chat/ChatInput';
import { EmptyState } from '@/components/chat/EmptyState';
import { AlertCircle, RefreshCw } from 'lucide-react';

const Index: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    conversations,
    activeId,
    messages,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    selectConversation,
    newConversation,
    deleteConversation,
    clearAll,
  } = useChat();

  const handleSend = (content: string, images?: string[]) => {
    sendMessage(content, images);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:flex w-[280px] flex-shrink-0">
        <ChatSidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={selectConversation}
          onNew={newConversation}
          onDelete={deleteConversation}
          onClearAll={clearAll}
        />
      </div>

      {/* Sidebar - Mobile overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-[280px] z-50 lg:hidden animate-slide-left shadow-xl">
            <ChatSidebar
              conversations={conversations}
              activeId={activeId}
              onSelect={(id) => {
                selectConversation(id);
                setSidebarOpen(false);
              }}
              onNew={() => {
                newConversation();
                setSidebarOpen(false);
              }}
              onDelete={deleteConversation}
              onClearAll={clearAll}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader onToggleSidebar={() => setSidebarOpen(v => !v)} />

        {messages.length === 0 ? (
          <EmptyState onSelect={(q) => handleSend(q)} />
        ) : (
          <ChatArea messages={messages} />
        )}

        {/* Error banner */}
        {error && (
          <div className="px-4 py-2.5 bg-destructive/10 border-t border-destructive/20 flex items-center justify-center gap-2 animate-slide-up">
            <AlertCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
            <p className="text-xs text-destructive">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-destructive underline ml-2 flex items-center gap-1 hover:text-destructive/80"
            >
              <RefreshCw className="w-3 h-3" />
              Tải lại
            </button>
          </div>
        )}

        <ChatInput
          onSend={handleSend}
          onStop={stopStreaming}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
};

export default Index;
