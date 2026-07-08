import React, { useState } from "react";
import { X, Sparkles, Clock, Key, CheckCircle, Calendar, Building, Phone, Mail, Award, Check } from "lucide-react";
import { TrialRegistration } from "../types";

interface TrialExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  trialInfo: TrialRegistration | null;
  onExtendTrial: (id: string, days: number) => Promise<any>;
  onUpdateTrialStatus: (id: string, status: "TRIAL_ACTIVE" | "EXPIRED" | "CONVERTED") => Promise<any>;
}

export default function TrialExtensionModal({
  isOpen,
  onClose,
  trialInfo,
  onExtendTrial,
  onUpdateTrialStatus
}: TrialExtensionModalProps) {
  const [activationCode, setActivationCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !trialInfo) return null;

  // Calculate days remaining
  const now = new Date();
  const expire = new Date(trialInfo.expireDate);
  const diffTime = expire.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const handleSelfExtension = async (days: number) => {
    setIsSubmitting(true);
    try {
      const success = await onExtendTrial(trialInfo.id, days);
      if (success) {
        // Update local copy of trialInfo if stored in localStorage
        const localTrialStr = localStorage.getItem("kiot_trial_info");
        if (localTrialStr) {
          try {
            const localTrial = JSON.parse(localTrialStr);
            const newExpireDate = new Date(new Date(localTrial.expireDate).getTime() + days * 24 * 60 * 60 * 1000).toISOString();
            localTrial.expireDate = newExpireDate;
            localStorage.setItem("kiot_trial_info", JSON.stringify(localTrial));
          } catch (err) {}
        }
        alert(`Gia hạn thành công thêm ${days} ngày dùng thử miễn phí cho nhà hàng "${trialInfo.shopName}"!`);
      } else {
        alert("Có lỗi xảy ra trong quá trình gia hạn.");
      }
    } catch (err: any) {
      alert("Lỗi kết nối cơ sở dữ liệu: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivationCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = activationCode.trim().toUpperCase();
    if (!cleanCode) {
      alert("Vui lòng nhập mã kích hoạt bản quyền!");
      return;
    }

    setIsSubmitting(true);
    try {
      if (cleanCode === "KIOTX_PRO_FOREVER" || cleanCode === "TRUONGCONGBAO_PRO") {
        // Upgrade to lifetime converted
        const extendSuccess = await onExtendTrial(trialInfo.id, 3650); // Add 10 years
        const statusSuccess = await onUpdateTrialStatus(trialInfo.id, "CONVERTED");

        if (extendSuccess && statusSuccess) {
          // Update local copy
          const localTrialStr = localStorage.getItem("kiot_trial_info");
          if (localTrialStr) {
            try {
              const localTrial = JSON.parse(localTrialStr);
              localTrial.status = "CONVERTED";
              localTrial.expireDate = new Date(new Date().getTime() + 3650 * 24 * 60 * 60 * 1000).toISOString();
              localStorage.setItem("kiot_trial_info", JSON.stringify(localTrial));
            } catch (err) {}
          }
          alert("🎉 KÍCH HOẠT THÀNH CÔNG!\n\nChúc mừng bạn đã nâng cấp thành công lên KiotX Bản quyền PRO Vĩnh viễn (Trọn đời). Toàn bộ các giới hạn dùng thử đã được gỡ bỏ.");
          setActivationCode("");
          onClose();
        } else {
          alert("Không thể cập nhật thông tin bản quyền trên hệ thống đám mây.");
        }
      } else if (cleanCode === "GIAHAN_30D") {
        const extendSuccess = await onExtendTrial(trialInfo.id, 30);
        if (extendSuccess) {
          const localTrialStr = localStorage.getItem("kiot_trial_info");
          if (localTrialStr) {
            try {
              const localTrial = JSON.parse(localTrialStr);
              localTrial.expireDate = new Date(new Date(localTrial.expireDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
              localStorage.setItem("kiot_trial_info", JSON.stringify(localTrial));
            } catch (err) {}
          }
          alert("🎉 Kích hoạt thành công!\n\nTài khoản dùng thử đã được gia hạn thêm 30 ngày sử dụng.");
          setActivationCode("");
          onClose();
        }
      } else if (cleanCode === "GIAHAN_99D") {
        const extendSuccess = await onExtendTrial(trialInfo.id, 99);
        if (extendSuccess) {
          const localTrialStr = localStorage.getItem("kiot_trial_info");
          if (localTrialStr) {
            try {
              const localTrial = JSON.parse(localTrialStr);
              localTrial.expireDate = new Date(new Date(localTrial.expireDate).getTime() + 99 * 24 * 60 * 60 * 1000).toISOString();
              localStorage.setItem("kiot_trial_info", JSON.stringify(localTrial));
            } catch (err) {}
          }
          alert("🎉 Kích hoạt thành công!\n\nTài khoản dùng thử đã được gia hạn thêm 99 ngày sử dụng.");
          setActivationCode("");
          onClose();
        }
      } else {
        alert("❌ Mã kích hoạt không hợp lệ hoặc đã quá hạn sử dụng. Vui lòng liên hệ Trương Công Bảo (congbaotruong8@gmail.com) để nhận mã bản quyền chính xác!");
      }
    } catch (err: any) {
      alert("Đã xảy ra lỗi khi kết nối máy chủ kích hoạt: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="p-6 border-b border-stone-800 flex items-center justify-between bg-stone-950/50">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-stone-100 uppercase tracking-wider">Thông Tin Bản Quyền & Gia Hạn</h3>
              <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest font-mono">License Management System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-stone-800 bg-stone-900 hover:bg-stone-850 text-stone-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto scrollbar-thin">
          {/* Current License Card */}
          <div className="bg-stone-950 border border-stone-850 p-4 rounded-2xl space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-stone-500 uppercase font-black tracking-wider block">Trạng thái bản quyền</span>
              <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${
                trialInfo.status === "CONVERTED"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : daysLeft <= 3
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}>
                {trialInfo.status === "CONVERTED" ? "Bản quyền PRO" : `Dùng thử còn ${daysLeft} ngày`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <span className="text-[10px] text-stone-500 block font-bold">Tên cửa hàng:</span>
                <span className="text-xs text-stone-200 font-bold truncate block">{trialInfo.shopName}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-stone-500 block font-bold">Hạn sử dụng:</span>
                <span className="text-xs text-stone-200 font-mono font-bold block">
                  {trialInfo.status === "CONVERTED" ? "Vô thời hạn" : new Date(trialInfo.expireDate).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-stone-900 pt-3">
              <div className="space-y-1">
                <span className="text-[10px] text-stone-500 block font-bold">Người quản lý:</span>
                <span className="text-xs text-stone-300 font-medium truncate block">{trialInfo.ownerName}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-stone-500 block font-bold">Liên hệ SĐT:</span>
                <span className="text-xs text-stone-300 font-mono block">{trialInfo.phone}</span>
              </div>
            </div>
          </div>

          {trialInfo.status !== "CONVERTED" ? (
            <>
              {/* Option 1: Self-Service Extension for Testing */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-stone-300">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-black uppercase tracking-wider">1. Tự gia hạn dùng thử (Kiểm thử)</span>
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Là một khách hàng trải nghiệm, bạn có quyền tự phục vụ gia hạn thêm số ngày dùng thử miễn phí để tiếp tục khám phá toàn bộ tính năng cao cấp của KiotX:
                </p>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSelfExtension(7)}
                    className="py-3 px-4 bg-stone-950 border border-stone-850 hover:border-emerald-500/30 hover:bg-stone-850 text-stone-300 hover:text-emerald-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>Thêm +7 ngày dùng</span>
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSelfExtension(30)}
                    className="py-3 px-4 bg-stone-950 border border-stone-850 hover:border-indigo-500/30 hover:bg-stone-850 text-stone-300 hover:text-indigo-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>Thêm +30 ngày dùng</span>
                  </button>
                </div>
              </div>

              {/* Option 2: Enterprise Activation Key */}
              <form onSubmit={handleActivationCode} className="space-y-3 pt-3 border-t border-stone-800">
                <div className="flex items-center gap-1.5 text-stone-300">
                  <Key className="h-4 w-4 text-indigo-400" />
                  <span className="text-xs font-black uppercase tracking-wider">2. Kích hoạt Bản quyền Chính thức</span>
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Nếu bạn đã ký hợp đồng hoặc muốn nâng cấp lên bản quyền PRO chính thức, vui lòng nhập mã code kích hoạt bản quyền nhận được từ Admin Trương Công Bảo:
                </p>

                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Mã kích hoạt (Ví dụ: KIOTX_PRO_FOREVER)"
                      value={activationCode}
                      onChange={e => setActivationCode(e.target.value)}
                      className="flex-1 px-3 py-2.5 bg-stone-950 border border-stone-850 rounded-xl text-xs text-stone-200 placeholder-stone-700 font-mono uppercase tracking-wider focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
                    >
                      {isSubmitting ? (
                        <div className="h-4 w-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>Xác nhận</span>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-stone-600 font-mono">
                    <span>Mẹo demo: Sử dụng mã <strong className="text-amber-500/80">KIOTX_PRO_FOREVER</strong> để nâng cấp PRO Trọn đời</span>
                    <span>Admin Support</span>
                  </div>
                </div>
              </form>
            </>
          ) : (
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-2.5 text-center py-6">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 mx-auto flex items-center justify-center text-emerald-400">
                <CheckCircle className="h-6 w-6 stroke-[2]" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider">Cửa Hàng Đã Được Kích Hoạt Bản Quyền PRO</h4>
                <p className="text-[11px] text-stone-400 leading-relaxed max-w-xs mx-auto">
                  Tuyệt vời! Nhà hàng của bạn đã kích hoạt gói chuyên nghiệp trọn đời thành công. Toàn bộ tính năng mở rộng đã được cấp quyền không giới hạn.
                </p>
              </div>
              <div className="text-[9px] text-stone-600 font-mono uppercase font-bold pt-2">
                KiotX Professional Edition Lifetime Key Registered
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-stone-950/70 border-t border-stone-800 text-[10px] text-stone-500 text-center flex items-center justify-center gap-1">
          <span>Hệ thống phân phối bản quyền KiotX SaaS. Hỗ trợ 24/7: congbaotruong8@gmail.com</span>
        </div>
      </div>
    </div>
  );
}
