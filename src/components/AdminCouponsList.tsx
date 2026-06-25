import { useState, FormEvent } from "react";
import { Ticket, Plus, Trash2, CheckCircle, Percent, Calendar } from "lucide-react";

export default function AdminCouponsList() {
  const [coupons, setCoupons] = useState([
    { code: "TGP2026", desc: "Giảm giá 10% gói thi công trần thạch cao giật cấp", value: "10%", type: "Phần trăm", expiry: "31/12/2026", active: true },
    { code: "NHUACOMPOSITE", desc: "Giảm giá 15% vật tư nhựa lam sóng cao cấp", value: "15%", type: "Phần trăm", expiry: "30/09/2026", active: true },
    { code: "GIADA26", desc: "Giảm ngay 200k/m² cho vách PVC cẩm thạch (>50m²)", value: "200,000đ/m²", type: "Khấu trừ", expiry: "31/08/2026", active: false },
  ]);

  const [code, setCode] = useState("");
  const [desc, setDesc] = useState("");
  const [value, setValue] = useState("");
  const [expiry, setExpiry] = useState("");

  const handleCreateCoupon = (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !value.trim()) return;

    const newCoupon = {
      code: code.toUpperCase().replace(/\s+/g, ""),
      desc: desc || "Ưu đãi thi công hoàn thiện nội thất",
      value,
      type: "Phần trăm",
      expiry: expiry || "31/12/2026",
      active: true
    };

    setCoupons([newCoupon, ...coupons]);
    setCode("");
    setDesc("");
    setValue("");
    setExpiry("");
  };

  const deleteCoupon = (codeToDelete: string) => {
    if (confirm(`Bạn muốn gỡ mã giảm giá ${codeToDelete}?`)) {
      setCoupons(coupons.filter(c => c.code !== codeToDelete));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Create Coupon form */}
      <div className="p-5 sm:p-6 bg-stone-900 border border-stone-850 rounded-2xl shadow-xl space-y-4 h-fit">
        <h3 className="text-sm font-bold text-stone-100 uppercase tracking-wider flex items-center gap-2 border-b border-stone-800 pb-3">
          <Plus className="h-4.5 w-4.5 text-amber-500" />
          <span>Tạo Mã Ưu Đãi Mới</span>
        </h3>

        <form onSubmit={handleCreateCoupon} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">Mã giảm giá *</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ví dụ: TGPTHACHCAO"
              required
              className="w-full px-4 py-2 bg-stone-950 border border-stone-800 text-stone-100 text-xs sm:text-sm rounded-xl focus:border-amber-500 focus:outline-none uppercase"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">Mức ưu đãi *</label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Ví dụ: 10% hoặc 500,000đ"
              required
              className="w-full px-4 py-2 bg-stone-950 border border-stone-800 text-stone-100 text-xs sm:text-sm rounded-xl focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">Mô tả chi tiết</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Ví dụ: Giảm giá thạch cao giật cấp phòng khách..."
              rows={2}
              className="w-full px-4 py-2 bg-stone-950 border border-stone-800 text-stone-100 text-xs sm:text-sm rounded-xl focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">Ngày hết hạn</label>
            <input
              type="text"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              placeholder="31/12/2026"
              className="w-full px-4 py-2 bg-stone-950 border border-stone-800 text-stone-100 text-xs sm:text-sm rounded-xl focus:border-amber-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <Ticket className="h-4 w-4" />
            <span>Kích hoạt mã giảm giá</span>
          </button>
        </form>
      </div>

      {/* Coupons List */}
      <div className="p-5 sm:p-6 bg-stone-900 border border-stone-850 rounded-2xl shadow-xl lg:col-span-2 space-y-4">
        <h3 className="text-sm font-bold text-stone-100 uppercase tracking-wider flex items-center gap-2 border-b border-stone-800 pb-3">
          <Ticket className="h-4.5 w-4.5 text-amber-500" />
          <span>Danh Sách Mã Giảm Giá Đang Chạy ({coupons.length})</span>
        </h3>

        <div className="space-y-3">
          {coupons.map((c) => (
            <div
              key={c.code}
              className="p-4 rounded-xl bg-stone-950 border border-stone-800 flex items-start justify-between gap-4 hover:border-amber-500/20 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-black text-xs sm:text-sm text-amber-500 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 uppercase tracking-wider">
                    {c.code}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-stone-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Hạn dùng: {c.expiry}
                  </span>
                  {c.active ? (
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded font-bold border border-emerald-500/10 uppercase">
                      Đang chạy
                    </span>
                  ) : (
                    <span className="text-[9px] bg-stone-800 text-stone-500 px-1.5 py-0.2 rounded font-bold border border-stone-750 uppercase">
                      Đóng
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-300 font-medium">{c.desc}</p>
                <p className="text-[10px] text-stone-500">Mức chiết khấu: <b className="text-stone-300">{c.value}</b> ({c.type})</p>
              </div>

              <button
                onClick={() => deleteCoupon(c.code)}
                className="p-1.5 rounded-lg bg-stone-900 hover:bg-red-500/10 text-stone-400 hover:text-red-400 border border-stone-800 hover:border-red-500/20 transition-all cursor-pointer mt-0.5 shrink-0"
                title="Gỡ mã"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
