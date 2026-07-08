import { useState, FormEvent, ChangeEvent, useEffect } from "react";
import { Settings, Save, CheckCircle, Phone, Globe, Image as ImageIcon, Upload, RefreshCw } from "lucide-react";
import { safeDispatchSimpleEvent } from "../lib/events";

export default function AdminSettingsPanel() {
  const [success, setSuccess] = useState(false);
  
  // Settings Form state with localStorage persistence
  const [companyName, setCompanyName] = useState("");
  const [hotline, setHotline] = useState("");
  const [address, setAddress] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [zaloNumber, setZaloNumber] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    // Load initial settings
    try {
      setCompanyName(localStorage.getItem("tgp_company_name") || "CÔNG TY TNHH THIẾT KẾ & THI CÔNG NỘI THẤT TRƯƠNG GIA PHÁT");
      setHotline(localStorage.getItem("tgp_hotline") || "090.123.4567");
      setAddress(localStorage.getItem("tgp_address") || "số 11/DC1 Đường Bình Chuẩn 69, Tổ 35, Khu phố Bình Phước B, Phường An Phú, Thành phố Hồ Chí Minh, Việt Nam");
      setSeoTitle(localStorage.getItem("tgp_seo_title") || "Trương Gia Phát | Chuyên Trần Thạch Cao & Nhựa Composite Cao Cấp");
      setSeoKeywords(localStorage.getItem("tgp_seo_keywords") || "tran thach cao, nhua composite, tam op tuong pvc, thach cao, truong gia phat");
      setZaloNumber(localStorage.getItem("tgp_zalo_number") || "090.123.4567");
      setLogoUrl(localStorage.getItem("tgp_custom_logo") || "/src/assets/images/tgp_logo_1782393737704.jpg");
    } catch (e) {
      // Fallbacks
      setCompanyName("CÔNG TY TNHH THIẾT KẾ & THI CÔNG NỘI THẤT TRƯƠNG GIA PHÁT");
      setHotline("090.123.4567");
      setAddress("số 11/DC1 Đường Bình Chuẩn 69, Tổ 35, Khu phố Bình Phước B, Phường An Phú, Thành phố Hồ Chí Minh, Việt Nam");
      setSeoTitle("Trương Gia Phát | Chuyên Trần Thạch Cao & Nhựa Composite Cao Cấp");
      setSeoKeywords("tran thach cao, nhua composite, tam op tuong pvc, thach cao, truong gia phat");
      setZaloNumber("090.123.4567");
      setLogoUrl("/src/assets/images/tgp_logo_1782393737704.jpg");
    }
  }, []);

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setLogoUrl(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    setLogoUrl("/src/assets/images/tgp_logo_1782393737704.jpg");
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem("tgp_company_name", companyName);
      localStorage.setItem("tgp_hotline", hotline);
      localStorage.setItem("tgp_address", address);
      localStorage.setItem("tgp_seo_title", seoTitle);
      localStorage.setItem("tgp_seo_keywords", seoKeywords);
      localStorage.setItem("tgp_zalo_number", zaloNumber);
      localStorage.setItem("tgp_custom_logo", logoUrl);

      // Trigger custom window event to notify other components instantly
      safeDispatchSimpleEvent("tgp_settings_updated");
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert("Đã xảy ra lỗi khi lưu hoặc kích thước ảnh quá lớn! Hãy thử dùng ảnh nhỏ hơn.");
    }
  };

  return (
    <div className="p-5 sm:p-6 bg-stone-900 border border-stone-850 rounded-2xl shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-stone-800 pb-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-stone-100 uppercase tracking-wider flex items-center gap-2">
            <Settings className="h-4.5 w-4.5 text-amber-500" />
            <span>Cài Đặt Cấu Hình Hệ Thống & Thương Hiệu</span>
          </h3>
          <p className="text-xs text-stone-400">Thiết lập logo, tên công ty, hotline liên hệ, địa chỉ, và cấu hình tối ưu SEO.</p>
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>Lưu thay đổi cấu hình thương hiệu & hệ thống thành công! Toàn bộ website đã áp dụng mới.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Section 1: Logo & Branding */}
          <div className="space-y-4 bg-stone-950 p-4 rounded-xl border border-stone-850/60 md:col-span-2">
            <h4 className="text-[11px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-800/60 pb-1.5">
              <ImageIcon className="h-3.5 w-3.5" />
              <span>Thay đổi Logo Thương Hiệu (Hiển thị Header, Footer & Admin Panel)</span>
            </h4>

            <div className="flex flex-col sm:flex-row items-center gap-5 pt-1">
              <div className="relative group shrink-0">
                <img
                  src={logoUrl || "/src/assets/images/tgp_logo_1782393737704.jpg"}
                  alt="Current Logo"
                  className="h-20 w-20 rounded-xl object-cover border-2 border-stone-800 bg-stone-900 shadow-md group-hover:border-amber-500/50 transition-all"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex-1 space-y-3 w-full">
                <div className="flex flex-wrap gap-2">
                  <label className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase cursor-pointer transition-all select-none">
                    <Upload className="h-3 w-3" />
                    <span>Tải ảnh logo từ máy</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleResetLogo}
                    className="flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Đặt lại logo gốc</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">Hoặc nhập liên kết ảnh trực tiếp (Image URL)</label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-100 text-xs focus:border-amber-500 focus:outline-none transition-all font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Company details */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-800/60 pb-1.5">
              <Phone className="h-3.5 w-3.5" />
              <span>Thông tin Doanh nghiệp & Liên hệ</span>
            </h4>

            <div className="space-y-1.5">
              <label className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">Tên pháp nhân công ty</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs sm:text-sm focus:border-amber-500 focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">Hotline tổng đài</label>
                <input
                  type="text"
                  value={hotline}
                  onChange={(e) => setHotline(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs sm:text-sm focus:border-amber-500 focus:outline-none transition-all font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">Hotline tư vấn Zalo</label>
                <input
                  type="text"
                  value={zaloNumber}
                  onChange={(e) => setZaloNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs sm:text-sm focus:border-amber-500 focus:outline-none transition-all font-mono font-bold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">Địa chỉ trụ sở chính & showroom</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs sm:text-sm focus:border-amber-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Section 3: SEO config */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-800/60 pb-1.5">
              <Globe className="h-3.5 w-3.5" />
              <span>Cấu hình tối ưu SEO Meta</span>
            </h4>

            <div className="space-y-1.5">
              <label className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">Tiêu đề trang chính (Meta Title)</label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs sm:text-sm focus:border-amber-500 focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">Từ khóa tìm kiếm (Meta Keywords)</label>
              <textarea
                value={seoKeywords}
                onChange={(e) => setSeoKeywords(e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs sm:text-sm focus:border-amber-500 focus:outline-none transition-all font-mono"
              />
            </div>
          </div>
          
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end pt-4 border-t border-stone-800">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
          >
            <Save className="h-4 w-4" />
            <span>Lưu lại cấu hình hệ thống</span>
          </button>
        </div>
      </form>
    </div>
  );
}
