import React from 'react';
import { GraduationCap, Menu, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  onToggleSidebar: () => void;
}

export const ChatHeader: React.FC<Props> = ({ onToggleSidebar }) => (
  <header className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-3 h-[68px] border-b border-border/80 bg-card/95 backdrop-blur-md z-10 w-full relative">
    <div className="flex items-center gap-3 w-full min-w-0">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-9 w-9 lg:hidden flex-shrink-0 text-muted-foreground hover:text-foreground" 
        onClick={onToggleSidebar}
      >
        <Menu className="w-5 h-5" />
      </Button>

      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md bg-gradient-to-br from-primary to-blue-600">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-accent border-2 border-card flex items-center justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        </div>
      </div>
      
      <div className="flex flex-col min-w-0 flex-1 justify-center">
        <h1 className="text-[15px] sm:text-base font-bold text-foreground leading-tight truncate flex items-center gap-1.5">
          Tư vấn Tuyển sinh UTT
          <Sparkles className="w-3.5 h-3.5 text-accent hidden sm:inline-block" />
        </h1>
        <p className="text-[11px] sm:text-[12px] text-muted-foreground truncate leading-tight mt-0.5">
          Trường Đại học Công nghệ Giao thông Vận tải
        </p>
      </div>
    </div>

    <div className="flex items-center gap-2 flex-shrink-0 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
      </span>
      <span className="text-[11px] font-medium text-accent whitespace-nowrap hidden sm:inline-block">
        Trực tuyến
      </span>
    </div>
  </header>
);

