import React, { useState, useEffect } from 'react';
import { Conversation } from '@/types/chat';
import { MessageSquare, Plus, Trash2, X, Brain, ChevronDown, ChevronUp, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { getAllFacts, clearAllMemory, deleteFact, getMemoryStats, type MemoryFact } from '@/lib/memoryService';

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onClose?: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  personal: '👤 Cá nhân',
  academic: '🎓 Học vấn',
  interest: '💡 Quan tâm',
  location: '📍 Vị trí',
  preference: '⚙️ Ưu tiên',
};

const KEY_LABELS: Record<string, string> = {
  name: 'Tên',
  gender: 'Giới tính',
  birth_year: 'Năm sinh',
  location: 'Nơi ở',
  high_school: 'Trường THPT',
  exam_score: 'Điểm thi',
  subject_combination: 'Tổ hợp',
  interested_major: 'Ngành quan tâm',
};

export const ChatSidebar: React.FC<Props> = ({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onClearAll,
  onClose,
}) => {
  const [showMemory, setShowMemory] = useState(false);
  const [facts, setFacts] = useState<MemoryFact[]>([]);
  const [stats, setStats] = useState(() => getMemoryStats());

  useEffect(() => {
    if (showMemory) {
      setFacts(getAllFacts());
      setStats(getMemoryStats());
    }
  }, [showMemory, conversations]); // Refresh when conversations change (new messages)

  const handleDeleteFact = (id: string) => {
    deleteFact(id);
    setFacts(getAllFacts());
    setStats(getMemoryStats());
  };

  const handleClearMemory = () => {
    if (confirm('Xóa toàn bộ bộ nhớ? Bot sẽ quên hết thông tin về bạn.')) {
      clearAllMemory();
      setFacts([]);
      setStats(getMemoryStats());
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-card border-r border-border overflow-hidden relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-sm text-foreground">Lịch sử chat</h3>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onNew} title="Cuộc hội thoại mới">
            <Plus className="w-4 h-4" />
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Memory section */}
      <div className="border-b border-border">
        <button
          onClick={() => setShowMemory(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Brain className="w-3.5 h-3.5 text-accent" />
            Bộ nhớ AI
            {stats.totalFacts > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-accent/15 text-accent text-[10px] font-bold">
                {stats.totalFacts}
              </span>
            )}
          </span>
          {showMemory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showMemory && (
          <div className="px-3 pb-3 space-y-2 animate-fade-in max-h-[260px] overflow-y-auto scrollbar-thin">
            {facts.length === 0 ? (
              <p className="text-[11px] text-muted-foreground text-center py-4 px-2">
                Chưa có thông tin nào. Hãy trò chuyện để bot ghi nhớ thông tin về bạn (tên, trường, ngành quan tâm, điểm thi...).
              </p>
            ) : (
              <>
                {facts.map(fact => (
                  <div
                    key={fact.id}
                    className="group flex items-start gap-2 p-2 rounded-lg bg-secondary/50 border border-border/50 hover:border-accent/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground/70">
                        {CATEGORY_LABELS[fact.category] || fact.category}
                      </p>
                      <p className="text-[12px] text-foreground font-medium truncate">
                        {KEY_LABELS[fact.key] || fact.key}: <span className="text-primary">{fact.value}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteFact(fact.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-opacity flex-shrink-0"
                      title="Xóa thông tin này"
                    >
                      <Trash className="w-3 h-3 text-destructive" />
                    </button>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-[10px] text-destructive/70 hover:text-destructive mt-1"
                  onClick={handleClearMemory}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Xóa toàn bộ bộ nhớ
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
        {conversations.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">Chưa có cuộc hội thoại nào</p>
        ) : (
          conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => {
                onSelect(conv.id);
                onClose?.();
              }}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${conv.id === activeId
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-secondary text-foreground'
                }`}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm truncate flex-1">{conv.title}</span>
              <button
                onClick={e => {
                  e.stopPropagation();
                  onDelete(conv.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10"
              >
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {conversations.length > 0 && (
        <div className="p-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onClearAll}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Xóa toàn bộ
          </Button>
        </div>
      )}
    </div>
  );
};
