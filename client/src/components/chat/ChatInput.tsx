import React, { useState, useRef, useCallback } from 'react';
import { Send, Square, ImagePlus, X, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  onSend: (content: string, images?: string[]) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const ChatInput: React.FC<Props> = ({ onSend, onStop, isStreaming, disabled }) => {
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed && images.length === 0) return;
    onSend(trimmed, images.length > 0 ? images : undefined);
    setText('');
    setImages([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, images, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming) handleSubmit();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  };

  const processFiles = (files: FileList | File[]) => {
    Array.from(files).forEach(file => {
      if (!ALLOWED_TYPES.includes(file.type)) return;
      if (file.size > MAX_FILE_SIZE) return;
      const reader = new FileReader();
      reader.onload = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const canSend = (text.trim() || images.length > 0) && !disabled;

  return (
    <div
      className={`border-t border-border/80 bg-card/60 backdrop-blur-md p-3 sm:p-4 transition-colors relative z-10 ${
        dragActive ? 'bg-primary/5 border-primary/30' : ''
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Drag overlay */}
      {dragActive && (
        <div className="flex items-center justify-center gap-2 py-3 mb-3 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 text-primary text-sm">
          <Paperclip className="w-4 h-4" />
          Thả ảnh vào đây
        </div>
      )}

      {/* Image previews */}
      {images.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-thin">
          {images.map((img, i) => (
            <div key={i} className="relative flex-shrink-0 animate-scale-in">
              <img
                src={img}
                alt=""
                className="w-16 h-16 rounded-xl object-cover border border-border/50 shadow-sm"
              />
              <button
                onClick={() => removeImage(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive/90 flex items-center justify-center shadow-sm hover:bg-destructive transition-colors"
                title="Xóa ảnh"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        {/* Upload button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="flex-shrink-0 h-[46px] w-[46px] rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          disabled={isStreaming}
          title="Tải ảnh lên"
        >
          <ImagePlus className="w-[22px] h-[22px]" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Text area */}
        <div className="flex-1 relative bg-background/50 rounded-2xl border border-input focus-within:ring-2 focus-within:ring-ring/40 focus-within:border-primary/40 transition-all shadow-sm">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Nhập câu hỏi về tuyển sinh UTT..."
            rows={1}
            disabled={disabled}
            className="w-full resize-none bg-transparent px-4 py-3 text-[14px] sm:text-[15px] placeholder:text-muted-foreground/60 focus:outline-none scrollbar-thin block"
            style={{ maxHeight: '160px' }}
          />
        </div>

        {/* Send/Stop button */}
        {isStreaming ? (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="flex-shrink-0 h-[46px] w-[46px] rounded-xl shadow-sm hover:shadow-md transition-all"
            onClick={onStop}
            title="Dừng trả lời"
          >
            <Square className="w-5 h-5 fill-current" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            className="flex-shrink-0 h-[46px] w-[46px] rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-30 disabled:shadow-none"
            style={canSend ? { background: 'var(--gradient-primary)' } : undefined}
            onClick={handleSubmit}
            disabled={!canSend}
            title="Gửi tin nhắn"
          >
            <Send className="w-5 h-5 text-white ml-0.5" />
          </Button>
        )}
      </div>

      <p className="text-[10px] sm:text-[11px] text-muted-foreground/50 text-center mt-2.5 mb-0.5 max-w-4xl mx-auto px-4 hidden sm:block">
        Nhấn <kbd className="font-sans px-1.5 py-0.5 rounded-md bg-muted/80 border border-border/80">Enter</kbd> để gửi • <kbd className="font-sans px-1.5 py-0.5 rounded-md bg-muted/80 border border-border/80">Shift+Enter</kbd> để xuống dòng • Hỗ trợ kéo thả ảnh
      </p>
    </div>
  );
};
