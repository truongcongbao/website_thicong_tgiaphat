import React, { useState } from "react";
import { 
  Sparkles, Search, Calendar, Phone, Mail, MapPin, FileText, CheckCircle, 
  XCircle, Trash2, Clock, ShieldCheck, Heart, User, RefreshCw, Layers, Plus,
  Eye, EyeOff
} from "lucide-react";
import { TrialRegistration } from "../types";

const safeFormatInputDate = (dateStr: string): string => {
  try {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch (e) {
    return "";
  }
};

const safeFormatLocalDate = (dateStr: string): string => {
  try {
    if (!dateStr) return "Chưa rõ";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Chưa rõ";
    return d.toLocaleDateString("vi-VN");
  } catch (e) {
    return "Chưa rõ";
  }
};

interface KiotTrialsManagerProps {
  trials: TrialRegistration[];
  onUpdateTrialStatus: (id: string, status: "TRIAL_ACTIVE" | "EXPIRED" | "CONVERTED") => Promise<void>;
  onExtendTrial: (id: string, days: number) => Promise<void>;
  onSetTrialExpirationDate: (id: string, dateStr: string) => Promise<void>;
  onDeleteTrial: (id: string) => Promise<void>;
  onUpdateTrialPassword: (id: string, newPassword: string) => Promise<void>;
}

export default function KiotTrialsManager({
  trials,
  onUpdateTrialStatus,
  onExtendTrial,
  onSetTrialExpirationDate,
  onDeleteTrial,
  onUpdateTrialPassword
}: KiotTrialsManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<("TRIAL_ACTIVE" | "EXPIRED" | "CONVERTED")[]>(["TRIAL_ACTIVE", "EXPIRED", "CONVERTED"]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [editingPasswordTrialId, setEditingPasswordTrialId] = useState<string | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [confirmingDeleteTrialId, setConfirmingDeleteTrialId] = useState<string | null>(null);

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Statistics calculation
  const totalCount = trials.length;
  const activeCount = trials.filter(t => t.status === "TRIAL_ACTIVE").length;
  const expiredCount = trials.filter(t => t.status === "EXPIRED").length;
  const convertedCount = trials.filter(t => t.status === "CONVERTED").length;

  // Filtered list
  const filteredTrials = trials.filter(t => {
    const matchesSearch = 
      t.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.phone.includes(searchQuery) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch && selectedStatuses.includes(t.status as any);
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "TRIAL_ACTIVE":
        return (
          <span className="px-2.5 py-1 text-[10px] font-black uppercase rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 w-fit">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Đang dùng thử</span>
          </span>
        );
      case "EXPIRED":
        return (
          <span className="px-2.5 py-1 text-[10px] font-black uppercase rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1.5 w-fit">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            <span>Hết hạn dùng thử</span>
          </span>
        );
      case "CONVERTED":
        return (
          <span className="px-2.5 py-1 text-[10px] font-black uppercase rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5 w-fit">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span>Đã mua bản quyền</span>
          </span>
        );
      default:
        return null;
    }
  };

  const calculateDaysLeft = (expireDateStr: string) => {
    try {
      if (!expireDateStr) return 0;
      const t = new Date(expireDateStr).getTime();
      if (isNaN(t)) return 0;
      const diffTime = t - Date.now();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (e) {
      return 0;
    }
  };

  const handleAction = async (id: string, actionFn: () => Promise<void>) => {
    setActionLoadingId(id);
    try {
      await actionFn();
    } catch (err) {
      console.error("Action error:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-850 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
              <Layers className="h-4.5 w-4.5" />
            </div>
            <h1 className="text-lg font-black uppercase tracking-wider text-stone-100 flex items-center gap-2">
              Quản Lý Cửa Hàng & Dùng Thử
            </h1>
          </div>
          <p className="text-xs text-stone-400 leading-relaxed">
            Hệ thống phân phối và theo dõi các nhà hàng đăng ký dùng thử KiotX trong 20 ngày. Bạn có thể gia hạn hoặc tạm khóa.
          </p>
        </div>

        {/* OWNER BADGE */}
        <div className="px-4 py-2 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center gap-3 self-start sm:self-auto shadow-md">
          <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center font-black text-xs text-white">
            CB
          </div>
          <div className="text-left">
            <span className="text-[10px] text-indigo-400 font-black uppercase tracking-wider block leading-none">Chủ phần mềm</span>
            <span className="text-xs font-bold text-stone-200">Trương Công Bảo</span>
          </div>
        </div>
      </div>

      {/* STATS BENTO GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* STAT 1: TOTAL */}
        <div className="bg-stone-900/40 border border-stone-850/80 p-4 rounded-2xl flex items-center justify-between relative overflow-hidden group hover:border-stone-800 transition-all">
          <div className="space-y-1">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">Tổng số đăng ký</span>
            <span className="text-2xl font-black text-stone-100 font-mono leading-none block">{totalCount}</span>
            <span className="text-[10px] text-stone-400 block">Nhà hàng / Quán ăn</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-stone-950 flex items-center justify-center text-stone-400 border border-stone-850 group-hover:text-indigo-400 transition-all">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        {/* STAT 2: ACTIVE */}
        <div className="bg-stone-900/40 border border-stone-850/80 p-4 rounded-2xl flex items-center justify-between relative overflow-hidden group hover:border-emerald-500/20 transition-all">
          <div className="space-y-1">
            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider block flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              Đang hoạt động
            </span>
            <span className="text-2xl font-black text-emerald-400 font-mono leading-none block">{activeCount}</span>
            <span className="text-[10px] text-stone-400 block">Trong thời gian 20 ngày</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-stone-950 flex items-center justify-center text-emerald-500 border border-stone-850/40">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        {/* STAT 3: EXPIRED */}
        <div className="bg-stone-900/40 border border-stone-850/80 p-4 rounded-2xl flex items-center justify-between relative overflow-hidden group hover:border-rose-500/20 transition-all">
          <div className="space-y-1">
            <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block">Đã hết hạn</span>
            <span className="text-2xl font-black text-rose-400 font-mono leading-none block">{expiredCount}</span>
            <span className="text-[10px] text-stone-400 block">Cần gia hạn hoặc nâng cấp</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-stone-950 flex items-center justify-center text-rose-500 border border-stone-850/40">
            <XCircle className="h-5 w-5" />
          </div>
        </div>

        {/* STAT 4: CONVERTED */}
        <div className="bg-stone-900/40 border border-stone-850/80 p-4 rounded-2xl flex items-center justify-between relative overflow-hidden group hover:border-indigo-500/20 transition-all">
          <div className="space-y-1">
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">Đã mua bản quyền</span>
            <span className="text-2xl font-black text-indigo-400 font-mono leading-none block">{convertedCount}</span>
            <span className="text-[10px] text-stone-400 block">Khách hàng chính thức</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-stone-950 flex items-center justify-center text-indigo-400 border border-stone-850/40">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-stone-950/40 border border-stone-850/80">
        {/* Search */}
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-500" />
          <input
            type="text"
            placeholder="Tìm kiếm tên quán, số điện thoại, người đại diện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-300 text-xs focus:outline-none focus:border-indigo-500 placeholder-stone-500 transition-all font-sans font-medium"
          />
        </div>

        {/* Tabs Filter (Multiple Selection) */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500">Lọc trạng thái (chọn nhiều):</span>
          <div className="flex flex-wrap gap-1.5 bg-stone-950 p-1 rounded-xl border border-stone-850">
            {[
              { key: "TRIAL_ACTIVE", label: `Dùng thử (${activeCount})` },
              { key: "EXPIRED", label: `Đã hết hạn (${expiredCount})` },
              { key: "CONVERTED", label: `Mua bản quyền (${convertedCount})` }
            ].map(btn => {
              const isSelected = selectedStatuses.includes(btn.key as any);
              return (
                <button
                  key={btn.key}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedStatuses(selectedStatuses.filter(s => s !== btn.key) as any);
                    } else {
                      setSelectedStatuses([...selectedStatuses, btn.key as any]);
                    }
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 border ${
                    isSelected
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-md font-black"
                      : "bg-stone-900/40 border-stone-850 text-stone-400 hover:text-stone-200 hover:bg-stone-900/80"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    isSelected ? "bg-white" : "bg-stone-600"
                  }`} />
                  {btn.label}
                </button>
              );
            })}
            
            <button
              onClick={() => setSelectedStatuses(["TRIAL_ACTIVE", "EXPIRED", "CONVERTED"])}
              className="px-2.5 py-1.5 text-[10px] font-black uppercase text-stone-400 hover:text-stone-250 cursor-pointer transition-all hover:bg-stone-900/50 rounded-lg"
            >
              Chọn tất cả
            </button>
            <button
              onClick={() => setSelectedStatuses([])}
              className="px-2.5 py-1.5 text-[10px] font-black uppercase text-stone-500 hover:text-stone-400 cursor-pointer transition-all hover:bg-stone-900/50 rounded-lg"
            >
              Xóa lọc
            </button>
          </div>
        </div>
      </div>

      {/* TABLE STATS CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Shops */}
        <div className="bg-stone-900/30 border border-stone-850 p-4 rounded-xl flex items-center justify-between relative overflow-hidden group hover:border-indigo-500/20 transition-all">
          <div className="space-y-1">
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Tổng số cửa hàng</span>
            <span className="text-xl font-black text-stone-100 font-mono leading-none block">{totalCount}</span>
            <span className="text-[9px] text-stone-500 block">Hệ thống SaaS KiotX</span>
          </div>
          <div className="h-9 w-9 rounded-lg bg-stone-950 flex items-center justify-center text-indigo-400 border border-stone-850">
            <Layers className="h-4 w-4" />
          </div>
        </div>

        {/* Card 2: TRIAL_ACTIVE */}
        <div className="bg-stone-900/30 border border-stone-850 p-4 rounded-xl flex items-center justify-between relative overflow-hidden group hover:border-emerald-500/20 transition-all">
          <div className="space-y-1">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Đang hoạt động (Trial Active)
            </span>
            <span className="text-xl font-black text-emerald-400 font-mono leading-none block">{activeCount}</span>
            <span className="text-[9px] text-stone-500 block">Truy cập đầy đủ tính năng</span>
          </div>
          <div className="h-9 w-9 rounded-lg bg-stone-950 flex items-center justify-center text-emerald-500 border border-stone-850/50">
            <Clock className="h-4 w-4" />
          </div>
        </div>

        {/* Card 3: EXPIRED */}
        <div className="bg-stone-900/30 border border-stone-850 p-4 rounded-xl flex items-center justify-between relative overflow-hidden group hover:border-rose-500/20 transition-all">
          <div className="space-y-1">
            <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block">Đã hết hạn (Expired)</span>
            <span className="text-xl font-black text-rose-400 font-mono leading-none block">{expiredCount}</span>
            <span className="text-[9px] text-stone-500 block">Yêu cầu gia hạn thêm ngày</span>
          </div>
          <div className="h-9 w-9 rounded-lg bg-stone-950 flex items-center justify-center text-rose-500 border border-stone-850/50">
            <XCircle className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* REGISTRATION LIST TABLE */}
      <div className="bg-stone-900/20 border border-stone-850 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-850 bg-stone-950/40 text-[10px] text-stone-400 font-black uppercase tracking-wider">
                <th className="py-4 px-4 sm:px-6">Thông tin cửa hàng</th>
                <th className="py-4 px-4">Người đại diện</th>
                <th className="py-4 px-4">Mật khẩu</th>
                <th className="py-4 px-4">Ngày đăng ký / hết hạn</th>
                <th className="py-4 px-4">Hạn dùng thử</th>
                <th className="py-4 px-4 text-center">Trạng thái</th>
                <th className="py-4 px-4 sm:px-6 text-right">Thao tác quản trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-850/60 text-xs text-stone-300">
              {filteredTrials.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-500 font-sans font-medium">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Layers className="h-8 w-8 mx-auto text-stone-600 opacity-60 animate-bounce" />
                      <p className="text-xs">Không tìm thấy yêu cầu dùng thử nào phù hợp.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTrials.map(trial => {
                  const daysLeft = calculateDaysLeft(trial.expireDate);
                  const isExpired = trial.status === "EXPIRED" || daysLeft <= 0;

                  return (
                    <tr key={trial.id} className="hover:bg-stone-950/20 transition-all">
                      {/* Shop Info */}
                      <td className="py-4 px-4 sm:px-6 space-y-1">
                        <div className="font-extrabold text-stone-200 text-sm">{trial.shopName}</div>
                        <div className="flex items-center gap-1.5 text-stone-400 text-[11px]">
                          <MapPin className="h-3 w-3 shrink-0 text-stone-500" />
                          <span>{trial.address || "Chưa cung cấp địa chỉ"}</span>
                        </div>
                        {trial.notes && (
                          <div className="text-[10px] text-indigo-400 italic bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10 w-fit">
                            Ghi chú: {trial.notes}
                          </div>
                        )}
                      </td>

                      {/* Rep Person */}
                      <td className="py-4 px-4 space-y-1">
                        <div className="font-bold text-stone-200 flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-stone-500" />
                          <span>{trial.ownerName}</span>
                        </div>
                        <div className="space-y-0.5 font-mono text-[11px] text-stone-400">
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-stone-500" />
                            <span>{trial.phone}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-stone-500" />
                            <span>{trial.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Mật khẩu */}
                      <td className="py-4 px-4 font-mono text-xs text-stone-300">
                        {editingPasswordTrialId === trial.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={newPasswordValue}
                              onChange={(e) => setNewPasswordValue(e.target.value)}
                              className="bg-stone-950 border border-stone-800 text-amber-400 font-bold px-2 py-1 rounded text-[11px] w-28 focus:outline-none focus:border-amber-500 font-mono"
                              placeholder="Mật khẩu mới"
                              autoFocus
                            />
                            <button
                              disabled={actionLoadingId !== null}
                              onClick={async () => {
                                if (!newPasswordValue.trim()) {
                                  alert("Mật khẩu không được để trống!");
                                  return;
                                }
                                setActionLoadingId(trial.id);
                                try {
                                  await onUpdateTrialPassword(trial.id, newPasswordValue.trim());
                                  setEditingPasswordTrialId(null);
                                } catch (e) {}
                                setActionLoadingId(null);
                              }}
                              className="px-2 py-1 bg-emerald-500 hover:bg-emerald-400 text-stone-950 rounded text-[10px] font-sans font-bold uppercase transition-all cursor-pointer"
                            >
                              Lưu
                            </button>
                            <button
                              onClick={() => setEditingPasswordTrialId(null)}
                              className="px-2 py-1 bg-stone-800 hover:bg-stone-750 text-stone-400 rounded text-[10px] font-sans font-bold uppercase transition-all cursor-pointer"
                            >
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="bg-stone-950 border border-stone-800 px-2 py-1 rounded-xl text-amber-400 font-bold text-[11px] select-all cursor-help flex items-center min-w-[70px] justify-center tracking-wider" title="Nhấp đúp chuột để sao chép">
                              {visiblePasswords[trial.id] ? (trial.password || "(Trống)") : "••••••"}
                            </span>
                            <button
                              onClick={() => togglePasswordVisibility(trial.id)}
                              className="p-1.5 hover:bg-stone-850 rounded-lg text-stone-400 hover:text-stone-250 transition-all cursor-pointer flex items-center justify-center border border-stone-850 bg-stone-950/40"
                              title={visiblePasswords[trial.id] ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                            >
                              {visiblePasswords[trial.id] ? (
                                <EyeOff className="h-3.5 w-3.5 shrink-0" />
                              ) : (
                                <Eye className="h-3.5 w-3.5 shrink-0" />
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setEditingPasswordTrialId(trial.id);
                                setNewPasswordValue(trial.password || "");
                              }}
                              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-sans font-bold underline cursor-pointer hover:no-underline ml-1"
                            >
                              Đổi
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Reg / Exp Dates */}
                      <td className="py-4 px-4 space-y-1.5 font-mono text-[11px] text-stone-400">
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-stone-500 font-sans font-extrabold uppercase">Tạo:</span>
                          <span>{safeFormatLocalDate(trial.createdAt)}</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] text-amber-500 font-sans font-extrabold uppercase">Hết hạn:</span>
                          <div className="flex items-center gap-1.5 bg-stone-950 hover:bg-stone-900 border border-stone-850 hover:border-amber-500/50 rounded-xl px-2 py-1 transition-all w-fit cursor-pointer group shadow-inner">
                            <Calendar className="h-3.5 w-3.5 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
                            <input 
                              type="date"
                              value={safeFormatInputDate(trial.expireDate)}
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAction(trial.id, () => onSetTrialExpirationDate(trial.id, e.target.value));
                                }
                              }}
                              className="bg-transparent text-stone-200 text-xs font-mono outline-none cursor-pointer w-28 [color-scheme:dark] select-none"
                              title="Nhấp vào để chọn ngày hết hạn tùy ý bằng lịch"
                            />
                          </div>
                        </div>
                      </td>

                      {/* Days remaining badge */}
                      <td className="py-4 px-4 font-sans">
                        {trial.status === "CONVERTED" ? (
                          <span className="text-[11px] text-indigo-400 font-black flex items-center gap-1">
                            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                            <span>Vĩnh viễn</span>
                          </span>
                        ) : trial.status === "EXPIRED" || daysLeft <= 0 ? (
                          <span className="text-[11px] text-rose-400 font-black flex items-center gap-1">
                            <span>Quá hạn</span>
                          </span>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 font-black">
                              <span className="text-sm font-black text-emerald-400 font-mono">{daysLeft}</span>
                              <span className="text-[10px] text-stone-400 font-medium">ngày còn lại</span>
                            </div>
                            <div className="w-20 bg-stone-900 rounded-full h-1 overflow-hidden border border-stone-800">
                              <div 
                                className="bg-emerald-500 h-full rounded-full" 
                                style={{ width: `${Math.min(100, (daysLeft / 20) * 100)}%` }} 
                              />
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex justify-center">
                          <select
                            value={trial.status}
                            disabled={actionLoadingId !== null}
                            onChange={(e) => {
                              const newStatus = e.target.value as "TRIAL_ACTIVE" | "EXPIRED" | "CONVERTED";
                              handleAction(trial.id, () => onUpdateTrialStatus(trial.id, newStatus));
                            }}
                            className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border cursor-pointer outline-none transition-all [color-scheme:dark] select-none ${
                              trial.status === "TRIAL_ACTIVE"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                : trial.status === "EXPIRED"
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                                : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20"
                            }`}
                            title="Nhấp để thay đổi trạng thái đăng ký"
                          >
                            <option value="TRIAL_ACTIVE" className="bg-stone-950 text-emerald-400 font-black uppercase">
                              Đang dùng thử
                            </option>
                            <option value="EXPIRED" className="bg-stone-950 text-rose-400 font-black uppercase">
                              Hết hạn
                            </option>
                            <option value="CONVERTED" className="bg-stone-950 text-indigo-400 font-black uppercase">
                              Đã mua bản quyền
                            </option>
                          </select>
                        </div>
                      </td>

                      {/* Administrative Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {/* EXTEND BUTTONS */}
                          {trial.status !== "CONVERTED" && (
                            <>
                              <button
                                disabled={actionLoadingId !== null}
                                onClick={() => handleAction(trial.id, () => onExtendTrial(trial.id, 7))}
                                className="px-2 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/20 rounded-lg text-[10px] font-black uppercase cursor-pointer transition-all flex items-center gap-1"
                                title="Gia hạn dùng thử thêm 7 ngày"
                              >
                                <Clock className="h-3 w-3" />
                                <span>+7 Ngày</span>
                              </button>
                              <button
                                disabled={actionLoadingId !== null}
                                onClick={() => handleAction(trial.id, () => onExtendTrial(trial.id, 30))}
                                className="px-2 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 rounded-lg text-[10px] font-black uppercase cursor-pointer transition-all flex items-center gap-1"
                                title="Gia hạn dùng thử thêm 30 ngày"
                              >
                                <Calendar className="h-3 w-3" />
                                <span>+30 Ngày</span>
                              </button>
                            </>
                          )}

                          {/* ACTIVATE / DEACTIVATE BUTTONS */}
                          {trial.status === "TRIAL_ACTIVE" && (
                            <button
                              disabled={actionLoadingId !== null}
                              onClick={() => handleAction(trial.id, () => onUpdateTrialStatus(trial.id, "EXPIRED"))}
                              className="px-2 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded-lg text-[10px] font-black uppercase cursor-pointer transition-all"
                              title="Khóa dùng thử của cửa hàng"
                            >
                              Khóa dùng
                            </button>
                          )}

                          {trial.status === "EXPIRED" && (
                            <button
                              disabled={actionLoadingId !== null}
                              onClick={() => handleAction(trial.id, () => onUpdateTrialStatus(trial.id, "TRIAL_ACTIVE"))}
                              className="px-2 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 rounded-lg text-[10px] font-black uppercase cursor-pointer transition-all"
                              title="Kích hoạt lại tài khoản dùng thử"
                            >
                              Mở khóa
                            </button>
                          )}


                          {/* DELETE REQUEST */}
                          {confirmingDeleteTrialId === trial.id ? (
                            <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 p-1 rounded-lg animate-pulse">
                              <span className="text-[9px] text-rose-400 font-bold uppercase px-1">Xác nhận xóa?</span>
                              <button
                                disabled={actionLoadingId !== null}
                                onClick={() => handleAction(trial.id, async () => {
                                  await onDeleteTrial(trial.id);
                                  setConfirmingDeleteTrialId(null);
                                })}
                                className="px-1.5 py-0.5 bg-rose-500 text-stone-950 hover:bg-rose-400 rounded text-[9px] font-sans font-bold uppercase transition-all cursor-pointer"
                              >
                                Có
                              </button>
                              <button
                                onClick={() => setConfirmingDeleteTrialId(null)}
                                className="px-1.5 py-0.5 bg-stone-800 text-stone-400 hover:bg-stone-700 rounded text-[9px] font-sans font-bold uppercase transition-all cursor-pointer"
                              >
                                Không
                              </button>
                            </div>
                          ) : (
                            <button
                              disabled={actionLoadingId !== null}
                              onClick={() => setConfirmingDeleteTrialId(trial.id)}
                              className="p-1.5 text-stone-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-all border border-transparent hover:border-rose-500/10"
                              title="Xóa vĩnh viễn thông tin đăng ký"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
