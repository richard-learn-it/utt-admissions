import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { Bot, User, Copy, Check } from 'lucide-react';
import { SourceCard } from './SourceCard';
import { TypingIndicator } from './TypingIndicator';

interface Props {
  message: ChatMessageType;
}

/**
 * Build full copyable text including source references
 */
function buildCopyText(message: ChatMessageType): string {
  let text = message.content;

  if (message.sources && message.sources.length > 0) {
    text += '\n\n---\nNguồn tham khảo:\n';
    message.sources.forEach((source, i) => {
      text += `[${i + 1}] ${source.title} - ${source.link}\n`;
    });
  }

  return text;
}

export const ChatMessageBubble: React.FC<Props> = ({ message }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = React.useState(false);
  const time = new Date(message.timestamp).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(buildCopyText(message));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 animate-fade-in group ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shadow-md ${
          isUser ? '' : 'border border-border/50'
        }`}
        style={isUser ? { background: 'var(--gradient-primary)' } : undefined}
      >
        {isUser ? (
          <User className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-white" />
        ) : (
          <Bot className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-accent font-bold" />
        )}
      </div>

      {/* Content */}
      <div className={`flex flex-col min-w-0 max-w-[85%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Role label */}
        <span className={`text-[11px] font-semibold text-muted-foreground/60 mb-1.5 px-1 ${isUser ? 'text-right' : ''}`}>
          {isUser ? 'Bạn' : 'Trợ lý UTT'}
        </span>

        {/* Images */}
        {message.images?.map((img, i) => (
          <img
            key={i}
            src={img}
            alt="Ảnh đã tải lên"
            className="rounded-2xl mb-2 max-w-full sm:max-w-[320px] max-h-[260px] object-cover shadow-sm border border-border/40 hover:shadow-md transition-shadow"
          />
        ))}

        {/* Text bubble */}
        <div
          className={`relative rounded-2xl px-4 py-3 sm:px-5 sm:py-4 transition-shadow break-words ${
            isUser
              ? 'text-white rounded-br-md shadow-md'
              : 'bg-chat-bot text-chat-bot-foreground rounded-bl-md shadow-sm border border-border/50'
          }`}
          style={isUser ? { background: 'var(--gradient-primary)' } : undefined}
        >
          {message.isStreaming && !message.content ? (
            <TypingIndicator />
          ) : (
            <div className={isUser ? '' : 'chat-markdown'}>
              {isUser ? (
                <p className="text-[14px] sm:text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  className="text-[14px] sm:text-[15px]"
                  components={{
                    // Custom table rendering to ensure dark mode compat and responsive scroll
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-3 rounded-lg border border-border/50">
                        <table className="w-full min-w-[400px]">{children}</table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-muted/60">{children}</thead>
                    ),
                    th: ({ children }) => (
                      <th className="border-b border-border/50 px-3 py-2 text-left text-[13px] font-semibold text-foreground whitespace-nowrap">{children}</th>
                    ),
                    td: ({ children }) => (
                      <td className="border-b border-border/30 px-3 py-2 text-[13px] text-foreground">{children}</td>
                    ),
                    tr: ({ children }) => (
                      <tr className="hover:bg-muted/30 transition-colors">{children}</tr>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )}
            </div>
          )}

          {/* Copy button for assistant messages */}
          {!isUser && message.content && !message.isStreaming && (
            <button
              onClick={handleCopy}
              className="absolute -bottom-3.5 right-2 opacity-0 group-hover:opacity-100 
                w-7 h-7 rounded-lg bg-card border border-border shadow-md
                flex items-center justify-center transition-all hover:bg-secondary active:scale-95"
              title="Sao chép (bao gồm trích dẫn nguồn)"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-accent" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </button>
          )}
        </div>

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3.5 space-y-2 w-full animate-fade-in max-w-full">
            <p className="text-[12px] text-muted-foreground font-semibold flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center text-[10px]">📚</span>
              Nguồn tham khảo
            </p>
            <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
              {message.sources.map((source, i) => (
                <SourceCard key={i} index={i + 1} source={source} />
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[11px] text-muted-foreground/50 mt-2 px-1">{time}</span>
      </div>
    </div>
  );
};
