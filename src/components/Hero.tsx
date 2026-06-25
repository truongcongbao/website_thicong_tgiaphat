import { ChevronRight, Wrench, Shield, Trees, Building } from "lucide-react";

interface HeroProps {
  onNavigate: (sectionId: string) => void;
  onOpenChat: () => void;
}

export default function Hero({ onNavigate, onOpenChat }: HeroProps) {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center bg-stone-950 pt-16 overflow-hidden"
    >
      {/* Background Image with Dark Vignette */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80"
          alt="Kiến trúc nội thất Trương Gia Phát"
          className="w-full h-full object-cover opacity-35 scale-105 animate-subtle-zoom"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-stone-950/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-transparent to-stone-950/20" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 text-center md:text-left">
        <div className="grid md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-8 lg:col-span-7 space-y-6">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-semibold uppercase tracking-wider animate-pulse mx-auto md:mx-0">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Kiến Tạo Không Gian Sống Đẳng Cấp 2026
            </div>

            {/* Display Typography Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif tracking-tight text-stone-100 leading-tight">
              Thi công <span className="text-amber-500 italic">Trần Thạch Cao</span> <br />
              & Vách Nhựa Giả Gỗ
            </h1>

            <p className="text-stone-300 text-base sm:text-lg max-w-xl leading-relaxed">
              Trương Gia Phát chuyên thiết kế & thi công trần thạch cao chìm giật cấp và vách gỗ nhựa Composite, nhựa PVC vân đá cao cấp. Cam kết sử dụng khung xương Vĩnh Tường chính hãng và bảo hành 3 năm trọn gói.
            </p>

            {/* Call To Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 pt-3">
              <button
                onClick={() => onNavigate("calculator")}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold tracking-wide transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer group"
              >
                <span>Dự Toán Chi Phí</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onNavigate("styles")}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-100 border border-stone-800 hover:border-stone-700 font-semibold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Xem Gu Thẩm Mỹ</span>
              </button>
            </div>

            {/* Custom Interactive Hint */}
            <div className="pt-6">
              <button
                onClick={onOpenChat}
                className="text-stone-400 hover:text-amber-400 text-xs transition-colors underline decoration-amber-500/50 underline-offset-4 cursor-pointer"
              >
                💡 Đang phân vân? Trò chuyện nhanh cùng Trợ lý Kiến Trúc Sư AI để nhận gợi ý phong cách
              </button>
            </div>
          </div>

          {/* Quick Stats Block / Visual Frame */}
          <div className="md:col-span-4 lg:col-span-5 relative hidden md:block">
            <div className="relative rounded-2xl border border-stone-800 bg-stone-900/60 backdrop-blur-md p-6 shadow-2xl space-y-6">
              <h3 className="text-stone-100 font-serif text-xl border-b border-stone-800 pb-3">
                Thế Mạnh Vượt Trội
              </h3>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <Building className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-stone-200 font-semibold text-sm">Kho Vật Liệu Composite Lớn</h4>
                    <p className="text-stone-400 text-xs">Kho sỉ dồi dào tấm lam sóng, tấm Nano phẳng, tấm PVC vân đá cao cấp.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-stone-200 font-semibold text-sm">Miễn Phí Thiết Kế 3D</h4>
                    <p className="text-stone-400 text-xs">Hoàn 100% phí thiết kế bản vẽ phối cảnh khi ký thi công trọn gói.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-stone-200 font-semibold text-sm">Bảo Hành 3 Năm Trần Vách</h4>
                    <p className="text-stone-400 text-xs">Cam kết khung xương thăng bằng, mối ghép phẳng lỳ, không cong võng.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <Trees className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-stone-200 font-semibold text-sm">Khung Xương Vĩnh Tường</h4>
                    <p className="text-stone-400 text-xs">Sử dụng hệ khung xương chính hãng dập nổi logo, chịu lực an toàn tuyệt đối.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid for Mobile Screens */}
        <div className="grid grid-cols-2 md:hidden gap-4 mt-12 border-t border-stone-800/80 pt-8 text-left">
          <div className="p-4 rounded-xl bg-stone-900/50 border border-stone-800">
            <h4 className="text-amber-500 font-bold text-lg">100%</h4>
            <p className="text-stone-300 text-xs font-medium">Chính Hãng Vĩnh Tường</p>
          </div>
          <div className="p-4 rounded-xl bg-stone-900/50 border border-stone-800">
            <h4 className="text-amber-500 font-bold text-lg">0 VNĐ</h4>
            <p className="text-stone-300 text-xs font-medium">Phí Phối Cảnh 3D</p>
          </div>
          <div className="p-4 rounded-xl bg-stone-900/50 border border-stone-800">
            <h4 className="text-amber-500 font-bold text-lg">3 Năm</h4>
            <p className="text-stone-300 text-xs font-medium">Bảo Hành Trần Vách</p>
          </div>
          <div className="p-4 rounded-xl bg-stone-900/50 border border-stone-800">
            <h4 className="text-amber-500 font-bold text-lg">100%</h4>
            <p className="text-stone-300 text-xs font-medium">Chống Thấm / Mối Mọt</p>
          </div>
        </div>
      </div>
    </section>
  );
}
