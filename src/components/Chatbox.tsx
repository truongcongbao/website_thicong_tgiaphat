import { useState, useRef, useEffect, FormEvent } from "react";
import { Message } from "../types";
import { MessageSquare, Send, X, Bot, AlertTriangle, ArrowRight, User } from "lucide-react";

interface ChatboxProps {
  isOpen: boolean;
  onClose: () => void;
  externalPrompt?: string;
  onClearExternalPrompt?: () => void;
}

export default function Chatbox({ isOpen, onClose, externalPrompt, onClearExternalPrompt }: ChatboxProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "model",
      text: "Xin chào! Tôi là Kiến trúc sư Minh Khôi, trưởng bộ phận thiết kế thi công trần vách tại Trương Gia Phát. Rất vui được hỗ trợ quý khách!\n\nQuý khách đang cần tôi tư vấn thiết kế phối cảnh 3D trần thạch cao giật cấp đèn LED, báo giá thi công tấm nhựa giả gỗ Composite/PVC vân đá, hay khảo sát đo đạc mặt bằng miễn phí?",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestionChips = [
    "Báo giá trần thạch cao Vĩnh Tường?",
    "Nhựa lam sóng có chống ẩm mốc?",
    "Mẫu vách tivi PVC giả đá đẹp",
    "Có miễn phí bản vẽ thiết kế 3D?"
  ];

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Handle external prompts (like when a user finishes the Style Quiz or Price Calculator)
  useEffect(() => {
    if (isOpen && externalPrompt) {
      handleSendMessage(externalPrompt);
      if (onClearExternalPrompt) onClearExternalPrompt();
    }
  }, [isOpen, externalPrompt]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // 1. Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: text,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      // Create history for API (maximum last 10 messages to save context and tokens)
      const formattedHistory = messages
        .filter((m) => m.id !== "welcome")
        .slice(-10)
        .map((m) => ({
          role: m.role,
          text: m.text
        }));

      // 2. Fetch from Express API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: formattedHistory
        })
      });

      const data = await response.json();
      
      const modelMsg: Message = {
        id: `model-${Date.now()}`,
        role: "model",
        text: data.text || "Cảm ơn bạn. Tôi đã ghi nhận thông tin và sẽ phản hồi sớm nhất qua Zalo hoặc SĐT hotline nhé!",
        timestamp: new Date()
      };
      
      setMessages((prev) => [...prev, modelMsg]);
    } catch (error) {
      console.error("Chatbot API fetch error:", error);
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: "model",
        text: "Xin lỗi bạn! Hệ thống AI đang bận một chút. Bạn vui lòng kết nối trực tiếp với tôi qua số điện thoại/Zalo hotline 090.123.4567 để tôi gửi báo giá bóc tách và mẫu thiết kế 3D chi tiết ngay nhé!",
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[450px] bg-stone-900 border-l border-stone-800 shadow-2xl flex flex-col animate-slide-in">
      {/* Drawer Header */}
      <div className="p-4 border-b border-stone-800 bg-stone-950 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-100 font-sans">KTS Minh Khôi</h3>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              Tư vấn trực tuyến miễn phí
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-100 cursor-pointer transition-colors"
          aria-label="Đóng Chat"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="grow overflow-y-auto p-4 space-y-4 bg-stone-900/40">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
              {/* Avatar indicator */}
              <div
                className={`h-7 w-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${
                  isUser ? "bg-amber-500 text-stone-950" : "bg-stone-800 text-stone-300"
                }`}
              >
                {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5 text-amber-500" />}
              </div>

              {/* Text Bubble */}
              <div
                className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-sm border ${
                  isUser
                    ? "bg-amber-500 border-amber-500/20 text-stone-950 font-medium rounded-tr-none"
                    : "bg-stone-950 border-stone-800 text-stone-200 rounded-tl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator Bubble */}
        {isLoading && (
          <div className="flex gap-3 max-w-[80%] mr-auto">
            <div className="h-7 w-7 rounded-full bg-stone-850 text-stone-300 shrink-0 flex items-center justify-center">
              <Bot className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 text-stone-400 text-xs flex items-center gap-1.5 rounded-tl-none">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-bounce" />
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-bounce delay-150" />
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-bounce delay-300" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length <= 2 && !isLoading && (
        <div className="px-4 py-2 bg-stone-950/40 border-t border-stone-800/40">
          <span className="block text-[10px] uppercase font-bold text-stone-500 mb-2">Gợi ý câu hỏi nhanh:</span>
          <div className="flex flex-wrap gap-2">
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                className="text-[11px] text-stone-300 bg-stone-950 border border-stone-800 rounded-lg py-1.5 px-3 hover:border-amber-500/50 hover:bg-stone-900 transition-all cursor-pointer text-left"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Form Input */}
      <form onSubmit={handleFormSubmit} className="p-4 border-t border-stone-800 bg-stone-950">
        <div className="relative flex items-center rounded-xl bg-stone-900 border border-stone-800 focus-within:border-amber-500/60 p-1.5 transition-all">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder="Viết tin nhắn tư vấn nội thất..."
            className="grow px-3 py-2 bg-transparent text-stone-200 text-xs sm:text-sm focus:outline-none placeholder-stone-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="p-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-stone-850 text-stone-950 disabled:text-stone-600 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
            aria-label="Gửi tin nhắn"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        
        {/* Quick callback / Zalo link */}
        <div className="flex justify-between items-center text-[10px] text-stone-500 pt-3">
          <span>Gặp sự cố? Gọi ngay 090.123.4567</span>
          <a
            href="https://zalo.me/0901234567"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-500 hover:underline font-semibold"
          >
            Liên hệ qua Zalo →
          </a>
        </div>
      </form>
    </div>
  );
}
