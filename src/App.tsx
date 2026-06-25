import { useState, useEffect, FormEvent } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import StyleQuiz from "./components/StyleQuiz";
import UserPreferences from "./components/UserPreferences";
import PriceCalculator from "./components/PriceCalculator";
import ProjectShowcase from "./components/ProjectShowcase";
import Chatbox from "./components/Chatbox";
import FloatingContact from "./components/FloatingContact";
import BlogSection from "./components/BlogSection.tsx";
import AdminDashboard from "./components/AdminDashboard.tsx";
import { WORK_PROCESS } from "./data";
import { Phone, MessageSquare, MapPin, Mail, Clock, ShieldCheck, Award, Heart, CheckCircle } from "lucide-react";

export default function App() {
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatPrompt, setChatPrompt] = useState<string>("");
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [blogRefreshKey, setBlogRefreshKey] = useState<number>(0);

  // Scroll spy to highlight active nav link
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["hero", "styles", "calculator", "projects", "blog"];
      const scrollPos = window.scrollY + 120;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavigate = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setActiveSection(sectionId);
    }
  };

  const handleOpenChatWithPrompt = (prompt: string) => {
    setChatPrompt(prompt);
    setIsChatOpen(true);
  };

  const handleClearExternalPrompt = () => {
    setChatPrompt("");
  };

  // Contact form state
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactProperty, setContactProperty] = useState("chung-cu");
  const [contactMsg, setContactMsg] = useState("");
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactPhone) return;
    setIsFormSubmitted(true);
  };

  const resetForm = () => {
    setContactName("");
    setContactPhone("");
    setContactProperty("chung-cu");
    setContactMsg("");
    setIsFormSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 selection:bg-amber-500 selection:text-stone-950 font-sans antialiased overflow-x-hidden">
      
      {/* 1. Header Navigation */}
      <Header
        onNavigate={handleNavigate}
        activeSection={activeSection}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* 2. Hero Section */}
      <Hero
        onNavigate={handleNavigate}
        onOpenChat={() => handleOpenChatWithPrompt("Xin chào KTS Minh Khôi! Tôi muốn tìm hiểu dịch vụ tư vấn đo đạc khảo sát thực tế tại nhà, Trương Gia Phát có thu phí khảo sát không?")}
      />

      {/* 3. Style Quiz (Trắc Nghiệm Gu Thẩm Mỹ) */}
      <StyleQuiz onOpenChatWithPrompt={handleOpenChatWithPrompt} />

      {/* 3.5. User Preferences (Gợi ý sở thích người dùng & Giải pháp vật liệu) */}
      <UserPreferences onOpenChatWithPrompt={handleOpenChatWithPrompt} />

      {/* 4. Price Calculator (Dự Toán Chi Phí) */}
      <PriceCalculator onOpenChatWithPrompt={handleOpenChatWithPrompt} />

      {/* 5. Project Showcase (Dự Án Thực Tế) */}
      <ProjectShowcase />

      {/* 6. Work Process (Quy Trình Thi Công) */}
      <section id="process" className="py-20 bg-stone-950 border-t border-stone-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center space-y-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full">
              Cam Kết Tiến Độ
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-stone-100">
              Quy Trình Làm Việc Chuyên Nghiệp
            </h2>
            <p className="text-stone-400 max-w-xl mx-auto text-sm sm:text-base">
              Chúng tôi tối ưu hóa từng bước từ khâu lên ý tưởng 3D đến sản xuất hoàn thiện, đảm bảo bàn giao đúng hạn và tính thẩm mỹ cao nhất.
            </p>
          </div>

          {/* Process Timeline Grid */}
          <div className="grid md:grid-cols-5 gap-8 relative">
            {WORK_PROCESS.map((p, idx) => (
              <div key={idx} className="relative group p-6 rounded-2xl bg-stone-900/40 border border-stone-800/60 hover:border-amber-500/30 transition-all flex flex-col justify-between h-full">
                {/* Horizontal flow line for desktops */}
                {idx < 4 && (
                  <div className="hidden md:block absolute top-12 left-[100%] w-[calc(100%-48px)] h-[1px] bg-gradient-to-r from-stone-800 to-transparent z-0" />
                )}
                
                <div className="space-y-4 relative z-10">
                  <div className="text-4xl font-mono font-black text-stone-800 group-hover:text-amber-500/20 transition-colors">
                    {p.step}
                  </div>
                  <h3 className="text-stone-100 font-serif font-bold text-base">
                    {p.title}
                  </h3>
                  <p className="text-stone-400 text-xs leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6.5. Blog & Tips Section (Database backed) */}
      <BlogSection key={blogRefreshKey} />

      {/* 7. Customer Testimonials */}
      <section className="py-20 bg-stone-900 border-t border-stone-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center space-y-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full">
              Khách Hàng Nói Về Trương Gia Phát
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-stone-100">
              Sự Hài Lòng Làm Nên Uy Tín
            </h2>
            <p className="text-stone-400 max-w-xl mx-auto text-sm sm:text-base">
              Hơn 500+ ngôi nhà đã được hoàn thiện là bấy nhiêu niềm hạnh phúc được lan tỏa. 
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Anh Hoàng Tuấn",
                role: "Chủ căn hộ Penthouse 145m² - Vista An Phú",
                quote: "Tôi thực sự ấn tượng với tinh thần trách nhiệm của Trương Gia Phát. Bản vẽ 3D như thế nào thì thực tế thi công hoàn thiện giống đến 95%. Xưởng trần vách thạch cao của họ đóng đồ rất sắc nét, phẳng đẹp tuyệt đối.",
                rating: 5,
                image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80"
              },
              {
                name: "Chị Khánh Linh",
                role: "Chủ biệt thự Vinhomes Riverside",
                quote: "Phong cách trần thạch cao giật cấp LED thi công rất khó vì đòi hỏi cân thăng bằng và ghép góc mỏ neo chính xác tuyệt đối. Trương Gia Phát đã làm xuất sắc từng góc cạnh. Chế độ bảo hành 3 năm của họ làm tôi hoàn toàn an tâm.",
                rating: 5,
                image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80"
              },
              {
                name: "Bác Sĩ Minh Khang",
                role: "Chủ căn hộ Japandi 85m² - Sky Garden",
                quote: "Là một người bận rộn, tôi ký hợp đồng chìa khóa trao tay. Toàn bộ khâu khảo sát, lên bản thiết kế, sản xuất và thi công lắp ráp diễn ra trơn tru đúng tiến độ. Gia đình tôi vô cùng ưng ý căn nhà mới sạch sẽ, ấm cúng.",
                rating: 5,
                image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80"
              }
            ].map((t, idx) => (
              <div key={idx} className="p-6 sm:p-8 rounded-2xl bg-stone-950 border border-stone-800/80 space-y-4">
                <div className="flex gap-1">
                  {[...Array(t.rating)].map((_, i) => (
                    <span key={i} className="text-amber-500 text-sm">★</span>
                  ))}
                </div>
                <p className="text-stone-300 text-xs sm:text-sm italic leading-relaxed">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3 pt-3 border-t border-stone-900">
                  <div className="h-10 w-10 rounded-full overflow-hidden shrink-0 border border-stone-800">
                    <img src={t.image} alt={t.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h4 className="text-stone-200 font-bold text-xs sm:text-sm">{t.name}</h4>
                    <p className="text-stone-500 text-[10px] sm:text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Call to Action Callback Registration Form */}
      <section className="py-20 bg-stone-950 border-t border-stone-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-stone-900 to-stone-950 border border-stone-800 rounded-3xl p-6 sm:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-amber-500/5 blur-3xl" />
            
            {!isFormSubmitted ? (
              <div className="space-y-8">
                <div className="text-center space-y-3">
                  <h3 className="text-2xl sm:text-3xl font-serif text-stone-100 font-bold">
                    Đăng Ký Tư Vấn Bản Vẽ 3D Miễn Phí
                  </h3>
                  <p className="text-stone-400 text-xs sm:text-sm max-w-lg mx-auto">
                    Để lại thông tin, kiến trúc sư Trương Gia Phát sẽ gọi điện tư vấn trực tiếp, lên phương án mặt bằng 2D và khảo sát thực tế đo đạc tận nơi hoàn toàn miễn phí.
                  </p>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold text-stone-400">Họ & Tên *</label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        className="w-full px-4 py-3 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-sm focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    
                    {/* Phone */}
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold text-stone-400">Số Điện Thoại *</label>
                      <input
                        type="tel"
                        required
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="0901234567"
                        className="w-full px-4 py-3 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-sm focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Property type selection */}
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold text-stone-400">Hạng Mục Cần Tư Vấn</label>
                      <select
                        value={contactProperty}
                        onChange={(e) => setContactProperty(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-stone-950 border border-stone-800 text-stone-300 text-sm focus:outline-none focus:border-amber-500"
                      >
                        <option value="tran-thach-cao">Thi Công Trần Thạch Cao</option>
                        <option value="go-nhua-composite">Ốp Trần Vách Gỗ Nhựa Composite</option>
                        <option value="pvc-van-da">Ốp Vách PVC Vân Đá Luxury</option>
                        <option value="tron-goi">Thi Công Trọn Gói Trần & Vách</option>
                      </select>
                    </div>

                    {/* Note message */}
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold text-stone-400">Yêu cầu thêm (nếu có)</label>
                      <input
                        type="text"
                        value={contactMsg}
                        onChange={(e) => setContactMsg(e.target.value)}
                        placeholder="Ví dụ: Căn 3 phòng ngủ, phong cách Japandi..."
                        className="w-full px-4 py-3 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-sm focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm uppercase tracking-wider transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
                    >
                      Đăng Ký Khảo Sát & Nhận Báo Giá 3D
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="text-center py-8 space-y-6 animate-fade-in">
                <div className="mx-auto h-16 w-16 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-serif text-stone-100 font-bold">
                    Đăng Ký Thành Công!
                  </h3>
                  <p className="text-stone-400 text-xs sm:text-sm max-w-md mx-auto">
                    Cảm ơn anh/chị <strong>{contactName}</strong>. Kiến trúc sư Minh Khôi sẽ chủ động liên hệ qua số điện thoại <strong>{contactPhone}</strong> trong vòng 15 phút tới để tư vấn chi tiết nhất.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                  <a
                    href="https://zalo.me/0901234567"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-stone-100 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <span>Nhắn Zalo Nhận Mẫu 3D Gần Nhất</span>
                  </a>
                  <button
                    onClick={resetForm}
                    className="px-6 py-3 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-300 text-xs font-semibold"
                  >
                    Gửi yêu cầu khác
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="bg-stone-950 border-t border-stone-900 py-16 text-stone-400 text-xs sm:text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-b border-stone-900 pb-12">
            {/* Col 1: Logo & Vision */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center gap-2">
                <img
                  src="/src/assets/images/tgp_logo_1782393737704.jpg"
                  alt="TRƯƠNG GIA PHÁT Logo"
                  referrerPolicy="no-referrer"
                  className="h-10 w-10 rounded-lg object-cover shadow-sm border border-amber-500/20"
                />
                <span className="text-base sm:text-lg font-bold tracking-wider text-amber-500 font-sans uppercase">
                  TRƯƠNG GIA PHÁT
                </span>
              </div>
              <p className="text-stone-400 text-xs max-w-sm leading-relaxed">
                Đơn vị tư vấn, thiết kế và thi công hoàn thiện trần thạch cao Vĩnh Tường chính hãng, ốp vách gỗ nhựa Composite sọc lam sóng, nhựa PVC vân đá cao cấp. Uy tín làm nên chất lượng công trình.
              </p>
              <div className="flex flex-col gap-2 pt-2 text-stone-300 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>Khung xương Vĩnh Tường chuẩn hãng</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>Bảo hành chống ẩm nứt vỡ đến 3 năm</span>
                </div>
              </div>
            </div>

            {/* Col 2: Legal Info */}
            <div className="lg:col-span-4 space-y-4">
              <h4 className="text-stone-200 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span>Thông Tin Doanh Nghiệp</span>
              </h4>
              <ul className="space-y-3 text-xs leading-relaxed">
                <li>
                  <strong className="text-stone-300 block">Tên Công Ty:</strong>
                  <span className="text-stone-400">CÔNG TY TNHH THIẾT KẾ & THI CÔNG NỘI THẤT TRƯƠNG GIA PHÁT</span>
                </li>
                <li>
                  <strong className="text-stone-300 block">Chủ Sở Hữu / Người Đại Diện:</strong>
                  <span className="text-stone-400">CÔNG TY TNHH THIẾT KẾ & THI CÔNG NỘI THẤT TRƯƠNG GIA PHÁT</span>
                </li>
                <li>
                  <strong className="text-stone-300 block">Mã Số Thuế:</strong>
                  <span className="text-stone-400 font-mono tracking-wider font-semibold">3703472033</span>
                </li>
                <li className="flex items-start gap-2 pt-1">
                  <MapPin className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-stone-300 block">Địa Chỉ Trụ Sở Chính:</strong>
                    <span className="text-stone-400">số 11/DC1 Đường Bình Chuẩn 69, Tổ 35, Khu phố Bình Phước B, Phường An Phú, Thành phố Hồ Chí Minh, Việt Nam</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Col 3: Banking & Contact details */}
            <div className="lg:col-span-4 space-y-4">
              <h4 className="text-stone-200 font-semibold text-xs uppercase tracking-wider">Giao Dịch & Liên Hệ</h4>
              <ul className="space-y-3 text-xs leading-relaxed">
                <li className="p-3.5 rounded-xl bg-stone-900/50 border border-stone-800/80 space-y-2">
                  <span className="text-amber-500 font-bold text-[11px] block uppercase tracking-wider">Tài Khoản Ngân Hàng Doanh Nghiệp</span>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-stone-400">Số tài khoản:</span>
                      <strong className="text-stone-200 font-mono tracking-wide">7919399999</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Ngân hàng:</span>
                      <strong className="text-stone-200">MB BANK (Ngân hàng Quân Đội)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Chủ tài khoản:</span>
                      <span className="text-stone-300 font-medium text-[10px] text-right uppercase">CT TNHH TK & TC NT TRUONG GIA PHAT</span>
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-2.5 pt-1">
                  <Mail className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-stone-300 block">Email Liên Hệ</strong>
                    <a href="mailto:noithattruonggiaphat@gmail.com" className="text-stone-400 hover:text-amber-500 font-mono">noithattruonggiaphat@gmail.com</a>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <Phone className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-stone-300 block">Hotline Tư Vấn / Zalo 24/7</strong>
                    <a href="tel:0901234567" className="text-amber-500 font-bold hover:underline">090.123.4567</a>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom copyright */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 text-[11px] text-stone-600 gap-4">
            <div>
              © 2026 CÔNG TY TNHH THIẾT KẾ & THI CÔNG NỘI THẤT TRƯƠNG GIA PHÁT. Tất cả các quyền được bảo lưu.
            </div>
            <div className="flex items-center gap-1.5 text-stone-600">
              <span>Được xây dựng với tình yêu</span>
              <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />
              <span>tối ưu hoàn hảo trên thiết bị di động.</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 10. AI Architect Chatbot Drawer */}
      <Chatbox
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        externalPrompt={chatPrompt}
        onClearExternalPrompt={handleClearExternalPrompt}
      />

      {/* Admin Dashboard overlay panel */}
      {isAdminOpen && (
        <AdminDashboard 
          onClose={() => setIsAdminOpen(false)} 
          onPostCreatedOrModified={() => setBlogRefreshKey(prev => prev + 1)}
          onOpenChatWithPrompt={handleOpenChatWithPrompt}
        />
      )}

      {/* 11. Floating Zalo & Phone buttons */}
      <FloatingContact onOpenChat={() => setIsChatOpen(true)} />

    </div>
  );
}
