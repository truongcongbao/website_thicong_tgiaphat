import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { 
  LayoutDashboard, Users, HelpCircle, FolderOpen, Layers, 
  Package, DollarSign, ShoppingCart, FileText, Sparkles, 
  Tag, Sliders, MapPin, Phone, Ticket, PhoneCall, Settings, 
  LogOut, Globe, Menu, X, ChevronLeft, ChevronRight
} from "lucide-react";

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onLogout: () => void;
  onClose: () => void;
  postsCount: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  onClose,
  postsCount,
  isCollapsed = false,
  onToggleCollapse
}: AdminSidebarProps) {
  
  const menuGroups = [
    {
      title: "MENU CHÍNH",
      items: [
        { id: "dashboard", label: "Bảng điều khiển", icon: LayoutDashboard },
        { id: "users", label: "Người dùng", icon: Users },
        { id: "products", label: "Sản phẩm", icon: Package },
        { id: "orders", label: "Đơn hàng", icon: ShoppingCart },
        { id: "posts", label: "Bài viết", icon: FileText, badge: postsCount > 0 ? postsCount : undefined },
        { id: "consultations", label: "Yêu cầu tư vấn", icon: PhoneCall, badge: 4 },
        { id: "coupons", label: "Mã giảm giá", icon: Ticket },
        { id: "plugins", label: "Cẩm nang Plugin WP", icon: Sparkles },
        { id: "settings", label: "Thiết lập", icon: Settings },
      ]
    },
    {
      title: "TÙY CHỌN KHÁC",
      items: [
        { id: "support", label: "Hỗ trợ kỹ thuật", icon: HelpCircle },
        { id: "locations", label: "Văn phòng & Showroom", icon: MapPin },
        { id: "contact", label: "Thông tin liên hệ", icon: Phone },
      ]
    }
  ];

  return (
    <div className={`w-full ${isCollapsed ? "md:w-16" : "md:w-64"} bg-[#1e2d3b] text-slate-300 flex flex-col h-full border-r border-[#1a2530] select-none shrink-0 transition-all duration-300`}>
      {/* Brand Header */}
      <div className={`p-4 bg-[#18232e] border-b border-[#141d26] flex ${isCollapsed ? "flex-col items-center gap-2 justify-center" : "items-center justify-between gap-3"}`}>
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
          <img
            src="/src/assets/images/tgp_logo_1782393737704.jpg"
            alt="TGP Logo"
            className="h-8 w-8 rounded-lg object-cover border border-amber-500/20 shrink-0"
          />
          {!isCollapsed && (
            <div className="transition-all duration-300">
              <h1 className="text-xs font-black tracking-wider text-amber-500 uppercase font-sans">
                TRƯƠNG GIA PHÁT
              </h1>
              <p className="text-[9px] text-slate-400 font-mono font-bold">ADMIN CMS v1.5</p>
            </div>
          )}
        </div>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg hover:bg-[#1f2d3a] text-slate-400 hover:text-amber-500 transition-all cursor-pointer shrink-0"
            title={isCollapsed ? "Mở rộng thanh menu" : "Thu gọn thanh menu"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* User Info Header - Matches image styling */}
      <div className={`p-4 bg-[#18232e]/60 border-b border-[#141d26]/80 flex ${isCollapsed ? "flex-col items-center justify-center py-5" : "items-center gap-4"}`}>
        {currentUser?.photoURL ? (
          <img
            src={currentUser.photoURL}
            alt="Avatar"
            className={`${isCollapsed ? "h-9 w-9" : "h-12 w-12"} rounded-full border-2 border-slate-500/40 object-cover transition-all duration-300`}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className={`${isCollapsed ? "h-9 w-9" : "h-12 w-12"} rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-500/30 text-amber-500 transition-all duration-300`}>
            <Users className={`${isCollapsed ? "h-4.5 w-4.5" : "h-6 w-6"}`} />
          </div>
        )}
        {!isCollapsed && (
          <div className="flex-1 min-w-0 transition-all duration-300">
            <p className="text-[10px] text-slate-400 font-medium">Welcome,</p>
            <p className="text-sm font-bold text-slate-100 truncate">
              {currentUser?.displayName || "admin"}
            </p>
            <span className="inline-flex mt-1 items-center gap-1 text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold uppercase font-sans tracking-wide">
              Quản trị viên
            </span>
          </div>
        )}
      </div>

      {/* Menu scroll area */}
      <div className="flex-grow overflow-y-auto py-4">
        {menuGroups.map((group, gIdx) => (
          <div key={gIdx} className="mb-6">
            {!isCollapsed ? (
              <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-sans transition-all duration-300">
                {group.title}
              </p>
            ) : (
              <div className="mx-3 my-2 border-t border-slate-800/60" />
            )}
            <div className="space-y-[2px]">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full py-2.5 px-4 flex items-center ${isCollapsed ? "justify-center" : "gap-3"} font-sans transition-all text-xs cursor-pointer text-left relative group ${
                      isActive 
                        ? "bg-[#16212b] text-white border-l-4 border-amber-500" 
                        : "hover:bg-[#1a2734]/50 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Icon className={`h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-105 ${
                      isActive ? "text-amber-500" : "text-slate-500"
                    }`} />
                    {!isCollapsed && <span className="flex-1 font-semibold truncate">{item.label}</span>}
                    
                    {/* Tooltip for collapsed mode */}
                    {isCollapsed && (
                      <div className="absolute left-16 bg-[#121b24] text-slate-200 text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg border border-stone-800 shadow-xl pointer-events-none whitespace-nowrap z-50 transition-all opacity-0 invisible translate-x-2 group-hover:opacity-100 group-hover:visible group-hover:translate-x-0">
                        {item.label}
                        {item.badge !== undefined && (
                          <span className="ml-1.5 px-1 rounded bg-amber-500 text-stone-950 font-black">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}

                    {item.badge !== undefined && (
                      isCollapsed ? (
                        <span className="absolute top-1.5 right-1.5 h-4 w-4 flex items-center justify-center text-[8px] font-black rounded-full bg-amber-500 text-stone-950 shadow-md">
                          {item.badge}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 text-[9px] font-black rounded bg-amber-500 text-stone-950">
                          {item.badge}
                        </span>
                      )
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer log out action */}
      <div className={`p-4 bg-[#141d26] border-t border-[#0e151c] flex flex-col gap-2 ${isCollapsed ? "items-center px-2" : ""}`}>
        <button
          onClick={onClose}
          className={`w-full py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold cursor-pointer border border-stone-700 transition-all flex items-center justify-center ${isCollapsed ? "px-0 justify-center" : "gap-1.5"}`}
          title="Xem Trang Chủ"
        >
          <Globe className="h-4 w-4 text-amber-500 shrink-0" />
          {!isCollapsed && <span>Xem Trang Chủ</span>}
        </button>
        <button
          onClick={onLogout}
          className={`w-full py-2.5 rounded-lg bg-[#281a1a] hover:bg-[#3d1f1f] text-red-300 hover:text-red-200 text-xs font-semibold cursor-pointer border border-[#441a1a] transition-all flex items-center justify-center ${isCollapsed ? "px-0 justify-center" : "gap-1.5"}`}
          title="Đăng Xuất"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span>Đăng Xuất</span>}
        </button>
      </div>
    </div>
  );
}
