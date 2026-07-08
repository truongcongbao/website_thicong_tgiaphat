import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, CheckCircle, AlertTriangle, FileText, Sparkles, Bell, ArrowRight
} from "lucide-react";

export interface Toast {
  id: string;
  type: "invoice" | "stock-warning" | "success" | "info";
  title: string;
  message: string;
  timestamp: Date;
}

// Play pleasant notification sound chimes using Web Audio API
const playNotificationSound = (type: "invoice" | "stock-warning" | "success" | "info") => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    if (type === "stock-warning") {
      // Urgent, warning dual-tone
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc1.type = "sine";
      osc2.type = "triangle";
      
      osc1.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
      osc2.frequency.setValueAtTime(220, audioCtx.currentTime); // A3
      
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      
      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 0.4);
      osc2.stop(audioCtx.currentTime + 0.4);
    } else {
      // Pleasant high tech chime
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.type = "sine";
      // Double note sequence
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08); // E5
      
      gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    }
  } catch (error) {
    console.warn("Could not play toast audio notification:", error);
  }
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{
        type: "invoice" | "stock-warning" | "success" | "info";
        title: string;
        message: string;
      }>;
      
      const { type, title, message } = customEvent.detail;
      const newToast: Toast = {
        id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type,
        title,
        message,
        timestamp: new Date()
      };

      setToasts(prev => [newToast, ...prev].slice(0, 5)); // Keep last 5 toasts max
      playNotificationSound(type);
    };

    window.addEventListener("kiot-toast", handleToastEvent);
    return () => {
      window.removeEventListener("kiot-toast", handleToastEvent);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] w-full max-w-sm flex flex-col gap-3 pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map(toast => {
          // Dynamic styles based on type
          const isWarning = toast.type === "stock-warning";
          const isInvoice = toast.type === "invoice";
          
          let borderStyle = "";
          let bgStyle = "";
          let icon = null;
          let accentColor = "";

          if (isWarning) {
            borderStyle = "border-rose-500/30";
            bgStyle = "bg-stone-900/95 text-stone-200 border-rose-500/20";
            accentColor = "text-rose-400";
            icon = (
              <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20 shadow-[0_0_10px_rgba(239,68,68,0.15)] shrink-0 animate-pulse">
                <AlertTriangle className="h-5 w-5" />
              </div>
            );
          } else if (isInvoice) {
            borderStyle = "border-emerald-500/30";
            bgStyle = "bg-stone-900/95 text-stone-200 border-emerald-500/20";
            accentColor = "text-emerald-400";
            icon = (
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)] shrink-0">
                <FileText className="h-5 w-5" />
              </div>
            );
          } else if (toast.type === "success") {
            borderStyle = "border-emerald-500/30";
            bgStyle = "bg-stone-900/95 text-stone-200 border-emerald-500/20";
            accentColor = "text-emerald-400";
            icon = (
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shrink-0">
                <CheckCircle className="h-5 w-5" />
              </div>
            );
          } else {
            borderStyle = "border-sky-500/30";
            bgStyle = "bg-stone-900/95 text-stone-200 border-sky-500/20";
            accentColor = "text-sky-400";
            icon = (
              <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20 shrink-0">
                <Bell className="h-5 w-5" />
              </div>
            );
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, x: 20, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              layout
              className={`pointer-events-auto w-full p-4 rounded-2xl border backdrop-blur-md shadow-xl flex items-start gap-3.5 relative overflow-hidden group ${bgStyle}`}
            >
              {/* Left Indicator Accents Line */}
              <div className={`absolute top-0 bottom-0 left-0 w-1 ${isWarning ? "bg-rose-500" : isInvoice ? "bg-emerald-500" : toast.type === "success" ? "bg-emerald-500" : "bg-sky-500"}`} />

              {/* Toast Left Icon */}
              {icon}

              {/* Message Details */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-1.5 justify-between">
                  <span className={`text-[11px] font-black uppercase tracking-wider ${accentColor}`}>
                    {toast.title}
                  </span>
                  <span className="text-[9px] text-stone-500 font-mono">
                    {toast.timestamp.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                </div>
                <p className="text-[11px] text-stone-300 font-medium leading-relaxed">
                  {(() => {
                    const urlRegex = /(https?:\/\/[^\s]+)/g;
                    const parts = toast.message.split(urlRegex);
                    return parts.map((part, idx) => {
                      if (urlRegex.test(part)) {
                        return (
                          <a
                            key={idx}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 underline font-bold break-all cursor-pointer inline-block"
                          >
                            [Xem hộp thư]
                          </a>
                        );
                      }
                      return part;
                    });
                  })()}
                </p>
              </div>

              {/* Toast Manual Dimiss X button */}
              <button
                onClick={() => removeToast(toast.id)}
                className="text-stone-500 hover:text-stone-200 p-1 rounded-lg hover:bg-stone-800/80 transition-colors cursor-pointer shrink-0"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Progress timer bar */}
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 5, ease: "linear" }}
                onAnimationComplete={() => removeToast(toast.id)}
                className={`absolute bottom-0 left-0 h-0.5 ${isWarning ? "bg-rose-500/40" : "bg-emerald-500/40"}`}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
