import React from "react";
import { ShieldAlert, Lock, UserCheck, ArrowRight, LogOut } from "lucide-react";
import { Staff } from "../types";

interface KiotRestrictedViewProps {
  activeTab: string;
  currentStaff: Staff;
  onLogout: () => void;
  onSwitchToOwner: () => void;
  onSwitchToManager: () => void;
}

export default function KiotRestrictedView({
  activeTab,
  currentStaff,
  onLogout,
  onSwitchToOwner,
  onSwitchToManager
}: KiotRestrictedViewProps) {
  
  const getTabLabel = (tab: string) => {
    switch (tab) {
      case "dashboard": return "Báo cáo Tổng quan & Doanh thu";
      case "products": return "Quản lý Hàng hóa & Kho hàng";
      case "partners": return "Quản lý Khách hàng & Nhà cung cấp";
      case "settings": return "Cấu hình Hệ thống & Sao lưu";
      case "cashbook": return "Quản lý Sổ quỹ Dòng tiền";
      case "projects": return "Quản lý Dự án & Công trình Thi công";
      default: return "Tính năng quản trị";
    }
  };

  const getRequiredRole = (tab: string) => {
    if (tab === "settings") return "Chủ cửa hàng (OWNER)";
    return "Chủ cửa hàng (OWNER) hoặc Quản lý (MANAGER)";
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "OWNER": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "MANAGER": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "CASHIER": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default: return "bg-stone-500/10 text-stone-400 border-stone-500/20";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "OWNER": return "Chủ cửa hàng (OWNER)";
      case "MANAGER": return "Quản lý (MANAGER)";
      case "CASHIER": return "Thu ngân (CASHIER)";
      default: return role;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center animate-fade-in relative z-10">
      
      {/* Glow Rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-rose-500/5 blur-[100px] pointer-events-none" />
      
      {/* Icon Shield Container */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-rose-500/20 blur-xl animate-pulse" />
        <div className="h-20 w-20 rounded-3xl bg-stone-900 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-2xl relative z-10">
          <ShieldAlert className="h-10 w-10 animate-bounce" />
        </div>
        <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-stone-950 border border-rose-500/40 flex items-center justify-center text-rose-400 z-20">
          <Lock className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* Main Headers */}
      <h3 className="text-xl font-black uppercase tracking-wider text-stone-100 max-w-md">
        Không có quyền truy cập
      </h3>
      <p className="text-xs font-mono text-rose-400 uppercase tracking-widest mt-1 mb-4">
        ACCESS RESTRICTED AREA
      </p>

      {/* Detail Explanation Card */}
      <div className="max-w-md w-full bg-stone-900/60 backdrop-blur-xl border border-stone-800 rounded-2xl p-5 text-left space-y-4 mb-6 shadow-xl">
        <div className="text-xs text-stone-400 space-y-1 leading-relaxed">
          <p>
            Bạn vừa yêu cầu truy cập tính năng: <strong className="text-stone-100">{getTabLabel(activeTab)}</strong>.
          </p>
          <p>
            Hệ thống phân quyền KiotX bảo mật nghiêm ngặt chức năng này nhằm ngăn chặn rò rỉ dữ liệu tài chính hoặc thay đổi cấu hình kho không mong muốn.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-800/80">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Vai trò của bạn:</span>
            <span className={`inline-flex px-2 py-1 rounded-lg border text-xs font-bold leading-none ${getRoleBadgeColor(currentStaff.role)}`}>
              {getRoleLabel(currentStaff.role)}
            </span>
          </div>
          
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Yêu cầu tối thiểu:</span>
            <span className="inline-flex px-2 py-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-bold leading-none">
              {getRequiredRole(activeTab)}
            </span>
          </div>
        </div>
      </div>

      {/* Action CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
        
        {activeTab !== "settings" && currentStaff.role === "CASHIER" && (
          <button
            type="button"
            onClick={onSwitchToManager}
            className="flex-1 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-200 border border-stone-800 hover:border-stone-750 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <UserCheck className="h-4 w-4 text-amber-400" />
            <span>Đóng vai Quản lý</span>
            <ArrowRight className="h-3 w-3 text-stone-500" />
          </button>
        )}

        <button
          type="button"
          onClick={onSwitchToOwner}
          className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
        >
          <UserCheck className="h-4 w-4" />
          <span>Đóng vai Chủ tiệm (Owner)</span>
        </button>

      </div>

      <button
        type="button"
        onClick={onLogout}
        className="mt-6 text-xs text-stone-500 hover:text-stone-300 font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer"
      >
        <LogOut className="h-3.5 w-3.5" />
        <span>Đăng xuất tài khoản hiện tại</span>
      </button>

    </div>
  );
}
