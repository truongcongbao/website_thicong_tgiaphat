import { useState, useEffect } from "react";
import { Phone, Compass, Calendar, Menu, X, MessageSquare, ShieldCheck, Home } from "lucide-react";

interface HeaderProps {
  onNavigate: (sectionId: string) => void;
  activeSection: string;
  onOpenChat: () => void;
}

export default function Header({ onNavigate, activeSection, onOpenChat }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const menuItems = [
    { id: "hero", label: "Trang Chủ", icon: Home },
    { id: "styles", label: "Trắc Nghiệm Gu", icon: Compass },
    { id: "calculator", label: "Dự Toán Chi Phí", icon: Calendar },
    { id: "projects", label: "Dự Án Đã Làm", icon: ShieldCheck },
  ];

  const handleItemClick = (id: string) => {
    onNavigate(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      id="main-header"
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-stone-900/90 backdrop-blur-md shadow-lg border-b border-stone-800/50 py-3"
          : "bg-gradient-to-b from-stone-950/80 to-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <div 
          onClick={() => handleItemClick("hero")} 
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="h-10 w-10 rounded-lg bg-amber-500 flex items-center justify-center text-stone-950 font-bold text-sm shadow-md group-hover:bg-amber-400 transition-colors">
            TGP
          </div>
          <div>
            <span className="block text-sm sm:text-base font-bold tracking-wider text-amber-500 font-sans uppercase">
              TRƯƠNG GIA PHÁT
            </span>
            <span className="block text-[8px] uppercase tracking-widest text-stone-300">
              Thiết Kế & Thi Công Trần Vách
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`text-sm tracking-wide font-medium transition-colors relative py-1 hover:text-amber-400 cursor-pointer ${
                activeSection === item.id ? "text-amber-500 font-semibold" : "text-stone-200"
              }`}
            >
              {item.label}
              {activeSection === item.id && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-amber-500 rounded-full" />
              )}
            </button>
          ))}
        </nav>

        {/* Action Buttons (Desktop) */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href="tel:0901234567"
            className="flex items-center gap-2 text-stone-200 hover:text-amber-400 transition-colors font-medium text-sm"
          >
            <Phone className="h-4 w-4 text-amber-500 animate-pulse" />
            <span>090.123.4567</span>
          </a>
          <button
            onClick={onOpenChat}
            className="px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs tracking-wider uppercase transition-all shadow-lg shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Kiến Trúc Sư AI
          </button>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={onOpenChat}
            className="p-2 rounded-full bg-amber-500 text-stone-950 shadow-md flex items-center justify-center cursor-pointer"
            aria-label="Chatbot AI"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg bg-stone-800/80 text-stone-200 hover:bg-stone-700/80 transition-colors cursor-pointer"
            aria-label="Mở menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[65px] bg-stone-950 border-b border-stone-800 shadow-xl z-40 transition-all duration-300 animate-fade-in">
          <div className="px-4 pt-4 pb-6 space-y-3 bg-stone-950/95 backdrop-blur-md">
            {menuItems.map((item) => {
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-colors cursor-pointer ${
                    activeSection === item.id
                      ? "bg-amber-500/10 text-amber-500 border-l-4 border-amber-500"
                      : "text-stone-300 hover:bg-stone-900"
                  }`}
                >
                  <IconComp className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <div className="h-[1px] bg-stone-800/80 my-4" />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <a
                href="tel:0901234567"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-sm font-medium hover:bg-stone-850"
              >
                <Phone className="h-4 w-4 text-amber-500" />
                <span>Gọi Ngay</span>
              </a>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenChat();
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 text-stone-950 text-sm font-bold shadow-lg shadow-amber-500/10 cursor-pointer"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Trợ Lý AI</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
