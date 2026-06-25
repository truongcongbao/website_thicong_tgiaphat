import { useState, useEffect } from "react";
import { Sliders, Layers, CalendarRange, HelpCircle, Send, CheckCircle2, ChevronDown, Check } from "lucide-react";

interface PriceCalculatorProps {
  onOpenChatWithPrompt: (prompt: string) => void;
}

interface CeilingPackage {
  id: string;
  name: string;
  desc: string;
  unitPrice: number; // VNĐ per m2
}

interface CladdingPackage {
  id: string;
  name: string;
  desc: string;
  unitPrice: number; // VNĐ per m2
}

export default function PriceCalculator({ onOpenChatWithPrompt }: PriceCalculatorProps) {
  // Inputs
  const [gypsumArea, setGypsumArea] = useState<number>(60);
  const [claddingArea, setCladdingArea] = useState<number>(30);
  const [selectedCeilingPkg, setSelectedCeilingPkg] = useState<string>("giat-cap-led");
  const [selectedCladdingPkg, setSelectedCladdingPkg] = useState<string>("lam-song");
  
  // Custom states
  const [hasLedSystem, setHasLedSystem] = useState<boolean>(true);
  const [isVinhTuongPremium, setIsVinhTuongPremium] = useState<boolean>(true);

  // Solutions
  const ceilingPackages: CeilingPackage[] = [
    {
      id: "tran-phang",
      name: "Trần Phẳng Chống Ẩm",
      desc: "Trần phẳng tối giản, tấm thạch cao chống ẩm Vĩnh Tường Gyproc cao cấp.",
      unitPrice: 240000
    },
    {
      id: "giat-cap-led",
      name: "Trần Giật Cấp Hiện Đại",
      desc: "Tạo khối giật cấp giấu đèn LED hắt sáng sang trọng cho phòng khách, phòng ngủ.",
      unitPrice: 320000
    },
    {
      id: "tan-co-dien",
      name: "Tân Cổ Điển Phào Chỉ",
      desc: "Đắp phào chỉ thạch cao đối xứng, mâm trần trang nhã, nhũ sơn mạ vàng cao cấp.",
      unitPrice: 620000
    }
  ];

  const claddingPackages: CladdingPackage[] = [
    {
      id: "nano-phang",
      name: "Tấm Nhựa Nano Phẳng",
      desc: "Ốp vách trần phẳng bóng đẹp, chống xước, chống ẩm mốc tuyệt đối.",
      unitPrice: 380000
    },
    {
      id: "lam-song",
      name: "Nhựa Lam Sóng Composite",
      desc: "Các thanh lam sọc nổi 3D sang trọng mộc mạc y như gỗ tự nhiên quý hiếm.",
      unitPrice: 480000
    },
    {
      id: "pvc-van-da",
      name: "Vách PVC Vân Đá Luxury",
      desc: "Diện vách tivi vân đá Marble lộng lẫy điểm xuyết nẹp titan vàng gương thượng lưu.",
      unitPrice: 720000
    }
  ];

  // Outputs
  const [ceilingCost, setCeilingCost] = useState<number>(0);
  const [claddingCost, setCladdingCost] = useState<number>(0);
  const [extraLedCost, setExtraLedCost] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);

  useEffect(() => {
    // 1. Calculate Ceiling Cost
    const ceilingPkg = ceilingPackages.find(p => p.id === selectedCeilingPkg) || ceilingPackages[0];
    let ceilingBase = gypsumArea * ceilingPkg.unitPrice;
    
    // Framework adjustment
    if (isVinhTuongPremium) {
      ceilingBase += gypsumArea * 25000; // Extra for Vĩnh Tường Premium BASI framework
    }
    
    // 2. Calculate Cladding Cost
    const claddingPkg = claddingPackages.find(p => p.id === selectedCladdingPkg) || claddingPackages[0];
    const claddingBase = claddingArea * claddingPkg.unitPrice;

    // 3. LED lighting system cost
    let ledBase = 0;
    if (hasLedSystem && gypsumArea > 0) {
      ledBase = (gypsumArea / 10) * 450000; // rough estimation for LED strip meters & installation
    }

    setCeilingCost(ceilingBase);
    setCladdingCost(claddingBase);
    setExtraLedCost(ledBase);
    setTotalCost(ceilingBase + claddingBase + ledBase);

  }, [gypsumArea, claddingArea, selectedCeilingPkg, selectedCladdingPkg, hasLedSystem, isVinhTuongPremium]);

  const handleSendToAI = () => {
    const ceilingPkg = ceilingPackages.find(p => p.id === selectedCeilingPkg)?.name;
    const claddingPkg = claddingPackages.find(p => p.id === selectedCladdingPkg)?.name;
    
    const prompt = `Chào KTS Minh Khôi! Tôi vừa tính toán bảng dự toán chi phí trần thạch cao và vách ốp nhựa giả gỗ trên website của bạn:
- Diện tích Trần Thạch Cao: ${gypsumArea} m² (Kiểu: ${ceilingPkg}${isVinhTuongPremium ? " - Khung xương Vĩnh Tường siêu bền" : ""})
- Diện tích Vách Ốp Nhựa Composite: ${claddingArea} m² (Kiểu: ${claddingPkg})
- Tích hợp hệ thống Đèn LED hắt sáng: ${hasLedSystem ? "Có lắp đặt" : "Không"}
- Tổng dự toán trọn gói ước tính: ~${formatPrice(totalCost)} VNĐ

Bạn có thể tư vấn khảo sát tận nơi cho tôi, và cho tôi biết thời gian thi công dự kiến cho diện tích này mất khoảng bao nhiêu ngày không?`;

    onOpenChatWithPrompt(prompt);
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return (price / 1000000).toFixed(1) + " Triệu";
    }
    return price.toLocaleString() + "đ";
  };

  return (
    <section id="calculator" className="py-20 bg-stone-900 border-t border-stone-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full">
            Dự Toán Minh Bạch 2026
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif text-stone-100">
            Dự Toán Chi Phí Thi Công Trần Vách
          </h2>
          <p className="text-stone-400 max-w-xl mx-auto text-sm sm:text-base">
            Nhập kích thước diện tích ngôi nhà của bạn để tính toán ngay bảng giá bóc tách vật tư trần thạch cao & vách nhựa Composite chuẩn xác nhất.
          </p>
        </div>

        {/* Calculator Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Controls - Left side (7 cols) */}
          <div className="lg:col-span-7 bg-stone-950 border border-stone-800/80 rounded-2xl p-6 sm:p-8 space-y-8">
            <h3 className="text-lg font-semibold text-stone-200 border-b border-stone-800 pb-3 flex items-center gap-2">
              <CalendarRange className="h-5 w-5 text-amber-500" />
              Thông số thiết kế của ngôi nhà
            </h3>

            {/* A. SECTION FOR GYPSUM CEILINGS */}
            <div className="space-y-4 border-b border-stone-900 pb-6">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase tracking-wider text-amber-500 font-bold">
                  Hạng Mục A: Trần Thạch Cao
                </span>
                <span className="text-xs text-stone-400 font-mono">
                  Đơn giá thợ dày nghề
                </span>
              </div>

              {/* 1. Gypsum Area Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-medium text-stone-300">
                    Diện tích trần thạch cao cần làm:
                  </label>
                  <span className="text-amber-500 font-bold font-mono">
                    {gypsumArea} <span className="text-xs text-stone-400">m²</span>
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={gypsumArea}
                    onChange={(e) => setGypsumArea(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-stone-900 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
                  />
                  <div className="flex justify-between text-[9px] text-stone-600">
                    <span>0 m² (Không làm)</span>
                    <span>50 m²</span>
                    <span>100 m²</span>
                    <span>200 m²</span>
                  </div>
                </div>
              </div>

              {/* 2. Gypsum Package Select */}
              {gypsumArea > 0 && (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-medium text-stone-400">
                    Chọn loại trần thạch cao thiết kế:
                  </label>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {ceilingPackages.map((pkg) => (
                      <button
                        key={pkg.id}
                        onClick={() => setSelectedCeilingPkg(pkg.id)}
                        className={`p-3.5 rounded-xl text-left border transition-all flex flex-col justify-between cursor-pointer ${
                          selectedCeilingPkg === pkg.id
                            ? "bg-amber-500/10 border-amber-500 text-amber-500"
                            : "bg-stone-900/60 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200"
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs text-stone-200 flex items-center justify-between">
                            <span>{pkg.name}</span>
                            {selectedCeilingPkg === pkg.id && <Check className="h-3 w-3 text-amber-500" />}
                          </div>
                          <p className="text-[10px] text-stone-400 mt-1 leading-relaxed">{pkg.desc}</p>
                        </div>
                        <div className="text-[10px] font-mono font-bold mt-2.5 text-amber-500">
                          ~{(pkg.unitPrice / 1000).toFixed(0)}k đ/m²
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* B. SECTION FOR WOOD-PLASTIC CLADDING */}
            <div className="space-y-4 border-b border-stone-900 pb-6">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase tracking-wider text-amber-500 font-bold">
                  Hạng Mục B: Vách Trần Nhựa Giả Gỗ Composite / PVC
                </span>
                <span className="text-xs text-stone-400 font-mono">
                  Chất liệu chống thấm 100%
                </span>
              </div>

              {/* 1. Cladding Area Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-medium text-stone-300">
                    Diện tích ốp vách / trần nhựa giả gỗ:
                  </label>
                  <span className="text-amber-500 font-bold font-mono">
                    {claddingArea} <span className="text-xs text-stone-400">m²</span>
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="150"
                    value={claddingArea}
                    onChange={(e) => setCladdingArea(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-stone-900 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
                  />
                  <div className="flex justify-between text-[9px] text-stone-600">
                    <span>0 m² (Không làm)</span>
                    <span>30 m²</span>
                    <span>75 m²</span>
                    <span>150 m²</span>
                  </div>
                </div>
              </div>

              {/* 2. Cladding Package Select */}
              {claddingArea > 0 && (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-medium text-stone-400">
                    Chọn loại gỗ nhựa / tấm PVC trang trí:
                  </label>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {claddingPackages.map((pkg) => (
                      <button
                        key={pkg.id}
                        onClick={() => setSelectedCladdingPkg(pkg.id)}
                        className={`p-3.5 rounded-xl text-left border transition-all flex flex-col justify-between cursor-pointer ${
                          selectedCladdingPkg === pkg.id
                            ? "bg-amber-500/10 border-amber-500 text-amber-500"
                            : "bg-stone-900/60 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200"
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs text-stone-200 flex items-center justify-between">
                            <span>{pkg.name}</span>
                            {selectedCladdingPkg === pkg.id && <Check className="h-3 w-3 text-amber-500" />}
                          </div>
                          <p className="text-[10px] text-stone-400 mt-1 leading-relaxed">{pkg.desc}</p>
                        </div>
                        <div className="text-[10px] font-mono font-bold mt-2.5 text-amber-500">
                          ~{(pkg.unitPrice / 1000).toFixed(0)}k đ/m²
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* C. MATERIAL OPTIONS SWITCHES */}
            <div className="space-y-4">
              <span className="block text-xs uppercase tracking-wider text-stone-400 font-bold">
                Cấu Hình Phụ Kiện Cao Cấp
              </span>
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Vinh Tuong Premium Framework upgrade */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-stone-900/40 border border-stone-850">
                  <div>
                    <span className="block text-xs text-stone-200 font-bold">Khung Xương Vĩnh Tường Premium</span>
                    <span className="block text-[10px] text-stone-500 mt-0.5">Dòng BASI siêu chắc chắn (+25k/m²)</span>
                  </div>
                  <button
                    onClick={() => setIsVinhTuongPremium(!isVinhTuongPremium)}
                    className={`px-3.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase transition-colors cursor-pointer ${
                      isVinhTuongPremium ? "bg-amber-500 text-stone-950 animate-pulse" : "bg-stone-800 text-stone-500"
                    }`}
                  >
                    {isVinhTuongPremium ? "Đang Chọn" : "Nâng Cấp"}
                  </button>
                </div>

                {/* LED strip lighting */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-stone-900/40 border border-stone-850">
                  <div>
                    <span className="block text-xs text-stone-200 font-bold">Hệ Thống Đèn LED Hắt Sáng</span>
                    <span className="block text-[10px] text-stone-500 mt-0.5">Dải LED dây COB siêu mịn tỏa đều</span>
                  </div>
                  <button
                    onClick={() => setHasLedSystem(!hasLedSystem)}
                    className={`px-3.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase transition-colors cursor-pointer ${
                      hasLedSystem ? "bg-amber-500 text-stone-950" : "bg-stone-800 text-stone-500"
                    }`}
                  >
                    {hasLedSystem ? "Đang Chọn" : "Không Lắp"}
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Result Summary Card - Right side (5 cols) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            <div className="bg-gradient-to-br from-stone-950 to-stone-900 border border-amber-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
              
              {/* Result header */}
              <div className="text-center pb-4 border-b border-stone-800">
                <span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">
                  TỔNG BÁO GIÁ THI CÔNG TRỌN GÓI
                </span>
                <div className="text-3xl sm:text-4xl font-mono font-bold text-amber-500 mt-1">
                  {formatPrice(totalCost)}
                </div>
                <p className="text-[10px] text-stone-400 mt-2 leading-relaxed">
                  *Chi phí trọn gói bao gồm vật tư, thợ bắn khung xương, bắn móng và bả sơn nước hoàn thiện kịch trần.
                </p>
              </div>

              {/* Cost Breakdown Accordion style list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  CHI TIẾT VẬT LIỆU BÓC TÁCH:
                </h4>

                {/* Item A breakdown */}
                {gypsumArea > 0 && (
                  <div className="space-y-1 p-3.5 rounded-xl bg-stone-950 border border-stone-850">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-stone-200">A. Trần Thạch Cao ({gypsumArea} m²)</span>
                      <span className="text-xs font-bold font-mono text-amber-500">
                        {formatPrice(ceilingCost)}
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-400 leading-relaxed mt-1">
                      Kiểu: {ceilingPackages.find(p => p.id === selectedCeilingPkg)?.name}. Khung xương: {isVinhTuongPremium ? "Khung xương chìm Vĩnh Tường Premium BASI bền bỉ 10 năm." : "Khung xương Vĩnh Tường tiêu chuẩn."}
                    </p>
                  </div>
                )}

                {/* Item B breakdown */}
                {claddingArea > 0 && (
                  <div className="space-y-1 p-3.5 rounded-xl bg-stone-950 border border-stone-850">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-stone-200">B. Ốp Trần Vách Composite ({claddingArea} m²)</span>
                      <span className="text-xs font-bold font-mono text-amber-500">
                        {formatPrice(claddingCost)}
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-400 leading-relaxed mt-1">
                      Dòng tấm: {claddingPackages.find(p => p.id === selectedCladdingPkg)?.name}. Nhựa nguyên sinh cao cấp chịu nước chịu lực tốt.
                    </p>
                  </div>
                )}

                {/* Item C breakdown */}
                {hasLedSystem && gypsumArea > 0 && (
                  <div className="space-y-1 p-3.5 rounded-xl bg-stone-950 border border-stone-850">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-stone-200">C. Hệ Thống Đèn LED Hắt Sáng</span>
                      <span className="text-xs font-bold font-mono text-amber-500">
                        {formatPrice(extraLedCost)}
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-400 leading-relaxed mt-1">
                      Thi công dải LED chạy viền giấu kín tại rãnh giật cấp thạch cao. Ánh sáng vàng dịu mắt ấm áp.
                    </p>
                  </div>
                )}
              </div>

              {/* Special design discount info */}
              <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-[11px] text-stone-300 leading-relaxed">
                  <strong className="text-amber-500">Miễn Phí Thiết Kế 100%:</strong> Trương Gia Phát tặng bản vẽ phối cảnh phối màu 3D miễn phí hoàn toàn khi ký kết thi công thực tế tại công trình!
                </div>
              </div>

              {/* Trigger AI conversation */}
              <button
                onClick={handleSendToAI}
                className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/15 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="h-4 w-4" />
                <span>Gửi Cấu Hình Dự Toán Để Nhận Tư Vấn</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
