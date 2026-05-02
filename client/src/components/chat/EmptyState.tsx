import React from 'react';
import {
  GraduationCap, BookOpen, HelpCircle, MapPin,
  Phone, DollarSign, Clock, Award, Sparkles,
} from 'lucide-react';

interface Props {
  onSelect: (question: string) => void;
}

const suggestions = [
  { icon: GraduationCap, text: 'Trường có những ngành đào tạo nào?', color: 'from-blue-500/20 to-indigo-500/20', iconColor: 'text-blue-600 dark:text-blue-400' },
  { icon: BookOpen, text: 'Phương thức xét tuyển năm nay?', color: 'from-emerald-500/20 to-teal-500/20', iconColor: 'text-emerald-600 dark:text-emerald-400' },
  { icon: DollarSign, text: 'Học phí các ngành là bao nhiêu?', color: 'from-amber-500/20 to-orange-500/20', iconColor: 'text-amber-600 dark:text-amber-400' },
  { icon: HelpCircle, text: 'Điều kiện xét tuyển đại học?', color: 'from-purple-500/20 to-violet-500/20', iconColor: 'text-purple-600 dark:text-purple-400' },
  { icon: MapPin, text: 'Trường có mấy cơ sở đào tạo?', color: 'from-rose-500/20 to-pink-500/20', iconColor: 'text-rose-600 dark:text-rose-400' },
  { icon: Phone, text: 'Thông tin liên hệ tư vấn tuyển sinh?', color: 'from-cyan-500/20 to-sky-500/20', iconColor: 'text-cyan-600 dark:text-cyan-400' },
  { icon: Clock, text: 'Mốc thời gian tuyển sinh quan trọng?', color: 'from-indigo-500/20 to-blue-500/20', iconColor: 'text-indigo-600 dark:text-indigo-400' },
  { icon: Award, text: 'Có chương trình học bổng nào không?', color: 'from-teal-500/20 to-emerald-500/20', iconColor: 'text-teal-600 dark:text-teal-400' },
];

export const EmptyState: React.FC<Props> = ({ onSelect }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 animate-fade-in overflow-y-auto">
    <div className="relative w-full max-w-2xl flex flex-col items-center">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-64 bg-gradient-to-b from-primary/10 to-transparent blur-3xl -z-10 pointer-events-none rounded-full" />
      
      {/* Hero section */}
      <div className="relative mb-6 group">
        <div className="absolute inset-0 rounded-[28px] bg-gradient-to-tr from-primary to-accent blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
        <div 
          className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-[28px] flex items-center justify-center shadow-xl border border-white/10"
          style={{ background: 'var(--gradient-primary)' }}
        >
          <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12 text-white animate-float" />
        </div>
      </div>

      <div className="text-center mb-10 max-w-lg px-2">
        <h2 className="text-[28px] sm:text-[34px] font-extrabold text-foreground mb-3 tracking-tight leading-tight">
          Sẵn sàng mở lối
          <br className="sm:hidden" />
          <span className="text-gradient"> tương lai tại UTT</span>
        </h2>
        <p className="text-[14px] sm:text-[15px] text-muted-foreground leading-relaxed flex items-center justify-center gap-2 flex-wrap">
          <Sparkles className="w-4 h-4 text-accent flex-shrink-0 animate-pulse" />
          Trợ lý AI chính thức chuyên tư vấn tuyển sinh đại học.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSelect(s.text)}
            className={`group flex items-center gap-3.5 p-4 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm
              hover:border-primary/40 hover:bg-card hover:shadow-lg active:scale-[0.98]
              transition-all duration-300 text-left focus-ring relative overflow-hidden`}
            style={{ animationDelay: `${i * 40}ms` }}
          >
            {/* Hover gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${s.color}`} />
            
            <div className="w-10 h-10 rounded-[14px] bg-background/80 border border-border/50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm relative z-10">
              <s.icon className={`w-5 h-5 ${s.iconColor}`} />
            </div>
            <span className="text-[14px] text-foreground font-medium leading-snug relative z-10">{s.text}</span>
          </button>
        ))}
      </div>

      <p className="mt-8 text-[12px] font-medium text-muted-foreground/60 flex items-center gap-1.5 opacity-80">
        <span className="w-1.5 h-1.5 rounded-full bg-accent/80" />
        Dữ liệu luôn được cập nhật từ nguồn thông tin tuyển sinh UTT
      </p>
    </div>
  </div>
);
