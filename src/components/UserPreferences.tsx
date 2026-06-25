import { useState } from "react";
import { Sliders, Check, MessageSquare, Shield, HelpCircle, Thermometer, Volume2, Sparkles, AlertTriangle } from "lucide-react";

interface PreferenceOption {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: any;
  gypsumSolution: {
    name: string;
    materials: string;
    specs: string;
  };
  woodSolution: {
    name: string;
    materials: string;
    specs: string;
  };
  advantages: string[];
  estCost: string;
  recommendedFor: string;
}

interface UserPreferencesProps {
  onOpenChatWithPrompt: (prompt: string) => void;
}

export default function UserPreferences({ onOpenChatWithPrompt }: UserPreferencesProps) {
  const [selectedPref, setSelectedPref] = useState<string>("luxury");

  const preferences: PreferenceOption[] = [
    {
      id: "luxury",
      title: "Sang Trọng & Đẳng Cấp",
      subtitle: "Yêu cầu cao nhất về tính thẩm mỹ cho phòng khách biệt thự, penthouse.",
      badge: "Xu Hướng 2026",
      icon: Sparkles,
      gypsumSolution: {
        name: "Trần Thạch Cao Giật Cấp Hắt Sáng 2 Tầng",
        materials: "Khung xương chìm Vĩnh Tường BASI + Tấm thạch cao Gyproc tiêu chuẩn 9mm dán chỉ vàng titan nghệ thuật.",
        specs: "Thiết kế hốc giật cấp sâu 15-20cm giấu đèn LED hắt sáng, bố trí mâm trần treo đèn chùm pha lê lớn."
      },
      woodSolution: {
        name: "Vách Nhựa PVC Vân Đá Ghép Lam Sóng Composite",
        materials: "Tấm PVC vân đá đối xứng phủ UV bóng gương kết hợp thanh lam sóng gỗ nhựa 2 bên.",
        specs: "Sử dụng keo sika dán trực tiếp lên khung xương sắt hộp chắc chắn, tạo mảng tường tivi hoặc đầu giường cực kỳ lộng lẫy."
      },
      advantages: [
        "Thẩm mỹ vượt trội nâng tầm giá trị ngôi nhà",
        "Hiệu ứng ánh sáng LED hắt thông minh tạo chiều sâu",
        "Bề mặt bóng bẩy phản chiếu ánh sáng và cực kỳ bền bỉ",
        "Vật liệu giả đá và vân gỗ giống tự nhiên đến 99%"
      ],
      estCost: "750.000 - 1.200.000đ / m²",
      recommendedFor: "Phòng khách căn hộ lớn, Biệt thự cao cấp, Sảnh đón khách doanh nghiệp."
    },
    {
      id: "anti-moisture",
      title: "Chống Ẩm & Chống Thấm",
      subtitle: "Bảo vệ ngôi nhà khỏi nấm mốc, thấm dột ở khu vực bếp, vệ sinh, trần áp mái.",
      badge: "Đặc Trị Khí Hậu Việt Nam",
      icon: Thermometer,
      gypsumSolution: {
        name: "Trần Thạch Cao Siêu Chống Ẩm Vĩnh Tường",
        materials: "Khung xương Vĩnh Tường ALPHA + Tấm thạch cao Gyproc Siêu Chống Ẩm (Moisture Resistant) 9mm.",
        specs: "Lõi thạch cao chứa phụ gia ngăn ngừa ẩm mốc, lớp giấy bọc ngoài đặc biệt chống hút nước cực kỳ hiệu quả."
      },
      woodSolution: {
        name: "Ốp Trần Vách Tấm Nhựa Nano Phẳng Chịu Nước",
        materials: "Tấm nhựa PVC Nano rỗng phẳng phủ màng vân gỗ mộc mạc.",
        specs: "Kết cấu hèm khóa âm dương khép kín ngăn chặn hơi nước xâm nhập, chống thấm dột mốc bẩn 100%."
      },
      advantages: [
        "Hoàn toàn không rêu mốc hay ố vàng khi gặp độ ẩm cao",
        "Dễ dàng lau chùi bề mặt tấm nhựa Nano bằng nước tẩy rửa nhẹ",
        "Ngăn ngừa mối mọt tàn phá kết cấu trần tường",
        "Phù hợp tuyệt vời với khí hậu nồm ẩm miền Bắc"
      ],
      estCost: "450.000 - 650.000đ / m²",
      recommendedFor: "Nhà bếp liền phòng ăn, Nhà vệ sinh, Căn hộ áp mái, Khu vực giặt đồ."
    },
    {
      id: "soundproof",
      title: "Cách Âm & Tiêu Âm",
      subtitle: "Yêu cầu sự yên tĩnh tối đa cho phòng ngủ, phòng đọc sách hoặc karaoke gia đình.",
      badge: "Cách Âm Tuyệt Đối",
      icon: Volume2,
      gypsumSolution: {
        name: "Trần Cách Âm Tiêu Âm Gyptone Chuyên Sâu",
        materials: "Khung xương Vĩnh Tường + Tấm thạch cao tiêu âm Gyptone đục lỗ tiêu chuẩn kết hợp bông thủy tinh cách âm.",
        specs: "Hấp thụ âm thanh hiệu quả, triệt tiêu tiếng vang Echo phản xạ trong không gian hẹp."
      },
      woodSolution: {
        name: "Vách Ốp Nhựa Lam Sóng Gỗ Cách Âm",
        materials: "Tấm nhựa lam sóng rỗng nhiều khoang kết hợp lớp đệm mút xốp eva.",
        specs: "Độ gồ ghề của thanh lam sóng giúp khuếch tán luồng sóng âm thanh, cản tiếng ồn truyền qua tường."
      },
      advantages: [
        "Giảm tiếng ồn xung quanh lên đến 75-80% so với tường trơn",
        "Triệt tiêu âm vang mang lại âm thanh trung thực tinh khiết",
        "Cách nhiệt tốt giúp điều hòa mát nhanh hơn, tiết kiệm điện",
        "An toàn chống cháy nổ tiêu chuẩn"
      ],
      estCost: "680.000 - 950.000đ / m²",
      recommendedFor: "Phòng ngủ trẻ em, Phòng karaoke gia đình, Phòng làm việc online tại nhà."
    },
    {
      id: "budget-saving",
      title: "Tiết Kiệm Tối Ưu",
      subtitle: "Thi công nhanh gọn, tối ưu hóa ngân sách cho nhà thuê, văn phòng tạm thời hoặc cửa hàng.",
      badge: "Kinh Tế Nhất",
      icon: Shield,
      gypsumSolution: {
        name: "Trần Thạch Cao Thả (Trần Ánh Kim) Hoặc Trần Phẳng",
        materials: "Khung xương nổi Vĩnh Tường FineLINE + Tấm thạch cao phủ PVC ánh kim trang nhã.",
        specs: "Thi công siêu tốc, dễ dàng tháo rời từng tấm để bảo trì đường ống kỹ thuật, dây điện phía trên trần."
      },
      woodSolution: {
        name: "Ốp Chân Tường & Tường Nano Giá Rẻ",
        materials: "Tấm ốp nhựa phẳng vân gỗ sồi mỏng tiêu chuẩn.",
        specs: "Thi công trực tiếp lên tường thô đã có sơn lót, giải quyết triệt để vấn đề bong tróc chân tường mà không cần trát vữa lại."
      },
      advantages: [
        "Chi phí vật tư và nhân công rẻ nhất thị trường",
        "Thời gian thi công cực nhanh (hoàn thành 50m² trong vòng 1 ngày)",
        "Dễ dàng tháo dỡ, cải tạo khi cần trả mặt bằng",
        "Đảm bảo thẩm mỹ sạch sẽ gọn gàng tức thì"
      ],
      estCost: "250.000 - 380.000đ / m²",
      recommendedFor: "Cửa hàng kinh doanh, Shop quần áo, Quán cafe khởi nghiệp, Văn phòng thuê ngắn hạn."
    }
  ];

  const handleApplyPreference = (pref: PreferenceOption) => {
    const prompt = `Chào KTS Minh Khôi! Tôi đang tham khảo giải pháp cho nhu cầu "${pref.title}" (${pref.subtitle}) trên website của bạn.
Tôi rất ấn tượng với giải pháp:
- Trần Thạch Cao đề xuất: ${pref.gypsumSolution.name}
- Ốp Vách Trần Nhựa Giả Gỗ: ${pref.woodSolution.name}
Với khoảng chi phí ước tính là ${pref.estCost}, bạn có thể tư vấn khảo sát mặt bằng thực tế tại nhà tôi để thiết kế phương án phối cảnh 3D chi tiết được không?`;
    onOpenChatWithPrompt(prompt);
  };

  const activePref = preferences.find(p => p.id === selectedPref) || preferences[0];
  const IconComponent = activePref.icon;

  return (
    <section id="preferences" className="py-20 bg-stone-950 border-t border-stone-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full">
            Tư Vấn Chuyên Sâu
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif text-stone-100">
            Gợi Ý Sở Thích & Giải Pháp Vật Liệu
          </h2>
          <p className="text-stone-400 max-w-xl mx-auto text-sm sm:text-base">
            Mỗi không gian sống đều mang một nhu cầu riêng biệt. Hãy chọn sở thích hoặc vấn đề bạn quan tâm dưới đây, Trương Gia Phát sẽ gợi ý combo trần thạch cao và vách nhựa giả gỗ tối ưu nhất.
          </p>
        </div>

        {/* Preference Layout: Left Side tabs, Right Side details */}
        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left: Interactive Tabs (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <span className="block text-[10px] uppercase font-bold text-stone-500 tracking-wider">
              BƯỚC 1: CHỌN NHU CẦU & SỞ THÍCH CỦA BẠN:
            </span>
            <div className="space-y-3.5">
              {preferences.map((pref) => {
                const PrefIcon = pref.icon;
                const isSelected = selectedPref === pref.id;
                return (
                  <button
                    key={pref.id}
                    onClick={() => setSelectedPref(pref.id)}
                    className={`w-full p-4 rounded-2xl text-left border transition-all duration-300 flex items-center justify-between group cursor-pointer ${
                      isSelected
                        ? "bg-amber-500/10 border-amber-500/80 shadow-lg shadow-amber-500/5 text-amber-500"
                        : "bg-stone-900/50 border-stone-800 text-stone-400 hover:border-stone-700 hover:bg-stone-900"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                        isSelected ? "bg-amber-500 text-stone-950 font-bold" : "bg-stone-950 text-stone-400 group-hover:text-stone-200"
                      }`}>
                        <PrefIcon className="h-5.5 w-5.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm sm:text-base ${isSelected ? "text-stone-100" : "text-stone-300 group-hover:text-stone-100"}`}>
                            {pref.title}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            isSelected ? "bg-amber-500/25 text-amber-400" : "bg-stone-950 text-stone-500"
                          }`}>
                            {pref.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400 mt-1 line-clamp-1 group-hover:text-stone-300 transition-colors">
                          {pref.subtitle}
                        </p>
                      </div>
                    </div>
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center transition-all shrink-0 ${
                      isSelected ? "bg-amber-500 text-stone-950 scale-100" : "bg-transparent scale-50 opacity-0"
                    }`}>
                      <Check className="h-3.5 w-3.5 stroke-[3px]" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick alert banner about high-quality materials */}
            <div className="p-4 rounded-xl bg-stone-900/40 border border-stone-800 text-[11px] text-stone-400 leading-relaxed flex gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong>Khuyến nghị của thợ:</strong> Cam kết sử dụng khung xương thạch cao chính hãng Vĩnh Tường siêu dày dặn, không dùng sắt mạ kẽm mỏng trôi nổi ngoài chợ để tránh cong võng trần sau 1-2 năm sử dụng.
              </span>
            </div>
          </div>

          {/* Right: Detailed Solution Presentation (7 cols) */}
          <div className="lg:col-span-7 bg-gradient-to-br from-stone-900 to-stone-950 border border-stone-800/80 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-amber-500/5 blur-3xl" />
            
            <div className="space-y-6 relative z-10">
              {/* Solution header */}
              <div className="border-b border-stone-800 pb-4 flex items-start gap-4 justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-md">
                    Combo Đề Xuất Toàn Diện
                  </span>
                  <h3 className="text-xl sm:text-2xl font-serif text-stone-100 font-bold mt-2">
                    Giải Pháp: {activePref.title}
                  </h3>
                  <p className="text-stone-400 text-xs mt-1">
                    {activePref.subtitle}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                  <IconComponent className="h-6 w-6" />
                </div>
              </div>

              {/* Grid: Plaster solution & Wood plastic solution */}
              <div className="grid sm:grid-cols-2 gap-6">
                {/* 1. Plaster solution */}
                <div className="space-y-3 p-4 rounded-xl bg-stone-950/60 border border-stone-800/50">
                  <span className="block text-[10px] uppercase font-extrabold text-stone-400 tracking-wider">
                    A. Trần Thạch Cao Phù Hợp:
                  </span>
                  <h4 className="text-stone-100 font-serif font-bold text-sm">
                    {activePref.gypsumSolution.name}
                  </h4>
                  <div className="space-y-2 text-xs">
                    <p className="text-stone-300 leading-relaxed">
                      <strong className="text-stone-400 block">Vật liệu chính:</strong> {activePref.gypsumSolution.materials}
                    </p>
                    <p className="text-stone-400 leading-relaxed">
                      <strong className="text-stone-500 block">Thiết kế tiêu chuẩn:</strong> {activePref.gypsumSolution.specs}
                    </p>
                  </div>
                </div>

                {/* 2. Wood plastic composite solution */}
                <div className="space-y-3 p-4 rounded-xl bg-stone-950/60 border border-stone-800/50">
                  <span className="block text-[10px] uppercase font-extrabold text-stone-400 tracking-wider">
                    B. Ốp Trần Vách Nhựa Composite:
                  </span>
                  <h4 className="text-stone-100 font-serif font-bold text-sm">
                    {activePref.woodSolution.name}
                  </h4>
                  <div className="space-y-2 text-xs">
                    <p className="text-stone-300 leading-relaxed">
                      <strong className="text-stone-400 block">Vật liệu chính:</strong> {activePref.woodSolution.materials}
                    </p>
                    <p className="text-stone-400 leading-relaxed">
                      <strong className="text-stone-500 block">Thiết kế tiêu chuẩn:</strong> {activePref.woodSolution.specs}
                    </p>
                  </div>
                </div>
              </div>

              {/* Key Advantages Checklist */}
              <div className="space-y-3">
                <span className="block text-[10px] uppercase font-bold text-stone-400">
                  Lợi Ích Vượt Trội Của Phương Án:
                </span>
                <ul className="grid sm:grid-cols-2 gap-2">
                  {activePref.advantages.map((adv, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-stone-300 leading-relaxed">
                      <Check className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>{adv}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Cost range and Apply button */}
            <div className="mt-8 pt-5 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="block text-[10px] uppercase font-bold text-stone-500">Đơn giá thi công trọn gói tạm tính</span>
                <span className="text-lg font-mono font-bold text-amber-500">{activePref.estCost}</span>
                <p className="text-[9px] text-stone-500 mt-0.5">*Chi phí đã bao gồm nhân công bả sơn và phụ kiện nẹp kim loại.</p>
              </div>

              <button
                onClick={() => handleApplyPreference(activePref)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Tư Vấn Phương Án Này Ngay</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
