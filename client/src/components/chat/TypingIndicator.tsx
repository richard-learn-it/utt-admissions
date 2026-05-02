import React from 'react';

export const TypingIndicator: React.FC = () => (
  <div className="flex items-center gap-1.5 py-1.5 px-0.5">
    <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse-dot" />
    <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse-dot animate-pulse-dot-delay-1" />
    <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse-dot animate-pulse-dot-delay-2" />
    <span className="text-[11px] text-muted-foreground/60 ml-1">Đang soạn...</span>
  </div>
);
