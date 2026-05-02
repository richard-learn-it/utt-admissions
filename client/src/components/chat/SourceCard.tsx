import React from 'react';
import { SearchSource } from '@/types/chat';
import { ExternalLink } from 'lucide-react';

interface Props {
  source: SearchSource;
  index: number;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export const SourceCard: React.FC<Props> = ({ source, index }) => (
  <a
    href={source.link}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/60 hover:border-primary/40 hover:shadow-md transition-all duration-200 group"
  >
    {/* Index badge */}
    <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
      <span className="text-[11px] font-bold text-primary">[{index}]</span>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-semibold text-foreground truncate group-hover:text-primary transition-colors">
        {source.title}
      </p>
      <p className="text-[11px] text-primary/70 mt-0.5 truncate">{getDomain(source.link)}</p>
      <p className="text-[12px] text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">{source.snippet}</p>
    </div>
    <ExternalLink className="w-4 h-4 text-muted-foreground/30 flex-shrink-0 mt-1 group-hover:text-primary transition-colors" />
  </a>
);
