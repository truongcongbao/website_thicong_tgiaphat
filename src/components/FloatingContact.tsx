import { Phone, MessageCircle, MessageSquare } from "lucide-react";

interface FloatingContactProps {
  onOpenChat: () => void;
}

export default function FloatingContact({ onOpenChat }: FloatingContactProps) {
  return (
    <div id="floating-contact" className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
      {/* 1. Direct Phone call floating button */}
      <a
        href="tel:0901234567"
        className="h-12 w-12 rounded-full bg-emerald-500 text-stone-950 flex items-center justify-center shadow-xl hover:bg-emerald-400 transition-all cursor-pointer group relative hover:scale-105"
        title="Gọi Điện Hotline"
      >
        <span className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" />
        <Phone className="h-5 w-5 text-stone-950 group-hover:rotate-12 transition-transform" />
      </a>

      {/* 2. Zalo Chat floating button (Zalo uses typical blue colors) */}
      <a
        href="https://zalo.me/0901234567"
        target="_blank"
        rel="noopener noreferrer"
        className="h-12 w-12 rounded-full bg-blue-600 text-stone-100 flex items-center justify-center shadow-xl hover:bg-blue-500 transition-all cursor-pointer group relative hover:scale-105"
        title="Chat Zalo"
      >
        <span className="absolute -top-1 -right-1 bg-amber-500 text-stone-950 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse border border-stone-950">
          Zalo
        </span>
        {/* Simple elegant speech-bubble like shape */}
        <MessageCircle className="h-5 w-5 text-stone-100 group-hover:scale-110 transition-transform" />
      </a>

      {/* 3. AI Architect Bubble */}
      <button
        onClick={onOpenChat}
        className="h-12 w-12 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center shadow-xl hover:bg-amber-400 transition-all cursor-pointer group relative hover:scale-105 border border-amber-400/20"
        title="Kiến Trúc Sư AI"
      >
        <span className="absolute -top-1 -right-1 bg-rose-500 text-stone-100 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider border border-stone-950">
          AI
        </span>
        <MessageSquare className="h-5 w-5 text-stone-950 group-hover:scale-110 transition-transform" />
      </button>
    </div>
  );
}
