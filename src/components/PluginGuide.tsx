import { useState, useMemo } from "react";
import { 
  Layers, Shield, Zap, ShoppingCart, Image as ImageIcon, FileText, Phone, MessageSquare, 
  Search, Sparkles, Sliders, Check, ChevronRight, HelpCircle, RefreshCw, Globe, Calendar, 
  Copy, CheckCircle2, Lock, Eye, BookOpen
} from "lucide-react";

interface PluginInfo {
  id: string;
  category: string;
  groupName: string;
  freePlugin: string;
  paidPlugin: string;
  desc: string;
  whyCrucial: string;
  difficulty: "Dễ" | "Trung bình" | "Khó";
  benefit: string;
}

export default function PluginGuide({ onOpenChatWithPrompt }: { onOpenChatWithPrompt: (prompt: string) => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Stack Builder states
  const [siteGoal, setSiteGoal] = useState<string>("portfolio");
  const [hasBudget, setHasBudget] = useState<boolean>(false);
  const [showStackResult, setShowStackResult] = useState<boolean>(true);

  const categories = ["Tất cả", "Thiết kế & Dự án", "Bán hàng & Chăm sóc", "Tối ưu & Tốc độ", "Bảo mật & Quản lý"];

  const plugins: PluginInfo[] = [
    // 13 standard groups from user
    {
      id: "1",
      category: "Thiết kế & Dự án",
      groupName: "1. Thiết kế & Giao diện",
      freePlugin: "Elementor (Bản free)",
      paidPlugin: "Elementor Pro hoặc Bricks Builder",
      desc: "Kéo thả để tự thiết kế trang chủ, trang dịch vụ, landing page thi công mà không cần biết code.",
      whyCrucial: "Giúp doanh nghiệp tự chủ cập nhật banner dự án, thay đổi bố cục chương trình khuyến mãi mà không cần chờ đợi lập trình viên.",
      difficulty: "Dễ",
      benefit: "Tăng 200% tốc độ thiết kế trang đích giới thiệu vật liệu mới."
    },
    {
      id: "2",
      category: "Bán hàng & Chăm sóc",
      groupName: "2. Bán hàng & Báo giá",
      freePlugin: "WooCommerce",
      paidPlugin: "Tích hợp sẵn trong WooCommerce",
      desc: "Quản lý sản phẩm, vật liệu, thiết bị nội thất; giỏ hàng, đặt hàng.",
      whyCrucial: "Cực kỳ thích hợp nếu doanh nghiệp muốn trưng bày bảng giá tấm ốp nano, lam sóng, phào chỉ và cho phép đặt mua mẫu thử.",
      difficulty: "Trung bình",
      benefit: "Tạo trải nghiệm thương mại điện tử chuyên nghiệp cho vật tư hoàn thiện."
    },
    {
      id: "3",
      category: "Thiết kế & Dự án",
      groupName: "3. Trưng bày dự án (Portfolio)",
      freePlugin: "Essential Addons for Elementor",
      paidPlugin: "WP Portfolio hoặc Grid FX",
      desc: "Tạo lưới hình ảnh, bộ sưu tập các công trình đã thi công (có bộ lọc theo diện tích, phong cách).",
      whyCrucial: "Khách hàng mua dịch vụ thi công bằng mắt. Một album công trình thực tế sắc nét, sắp xếp khoa học sẽ quyết định 80% tỷ lệ gọi điện.",
      difficulty: "Dễ",
      benefit: "Hiển thị bộ lọc thông minh: Thạch cao phòng khách, nhựa giả gỗ phòng ngủ, biệt thự..."
    },
    {
      id: "4",
      category: "Bảo mật & Quản lý",
      groupName: "4. Quản lý dữ liệu dự án",
      freePlugin: "Advanced Custom Fields (ACF)",
      paidPlugin: "JetEngine (CrocoBlock)",
      desc: "Tạo các ô thông tin riêng cho công trình (Ví dụ: Chủ đầu tư, Vị trí, Diện tích, Chi phí) để hiển thị chuyên nghiệp.",
      whyCrucial: "Đồng bộ hóa cách trình bày dự án. Chỉ cần điền form, hệ thống sẽ tự sinh ra khối thông tin kỹ thuật đẹp mắt.",
      difficulty: "Khó",
      benefit: "Tạo dữ liệu cấu trúc sạch, chuyên nghiệp như các trang bất động sản lớn."
    },
    {
      id: "5",
      category: "Bán hàng & Chăm sóc",
      groupName: "5. Form Liên hệ & Nhận báo giá",
      freePlugin: "Fluent Forms hoặc Contact Form 7",
      paidPlugin: "Fluent Forms Pro hoặc Gravity Forms",
      desc: "Khách điền thông tin để nhận báo giá thi công, đặt lịch khảo sát công trình.",
      whyCrucial: "Cầu nối chuyển đổi người xem thành khách hàng thực tế. Hỗ trợ gửi thông báo tức thì qua Email/Telegram cho thợ khi có khách đăng ký.",
      difficulty: "Dễ",
      benefit: "Thiết kế form khảo sát chuyên sâu: Chọn diện tích, loại trần vách mong muốn."
    },
    {
      id: "6",
      category: "Bán hàng & Chăm sóc",
      groupName: "6. Nút gọi & Nhắn tin nhanh",
      freePlugin: "Joinchat hoặc Button Contact VR",
      paidPlugin: "Bản free đã rất đầy đủ",
      desc: "Tạo nút gọi điện thoại, Zalo, Messenger bong bóng chạy dọc màn hình.",
      whyCrucial: "Hơn 85% người dùng tại Việt Nam lướt web bằng điện thoại di động và muốn liên hệ trực tiếp qua Zalo/Hotline thay vì email.",
      difficulty: "Dễ",
      benefit: "Tăng 45% tỷ lệ liên hệ trực tiếp từ khách hàng có nhu cầu khẩn cấp."
    },
    {
      id: "7",
      category: "Bán hàng & Chăm sóc",
      groupName: "7. Chat trực tuyến (Livechat)",
      freePlugin: "Tidio hoặc Crisp",
      paidPlugin: "Cài bản free kết nối app điện thoại",
      desc: "Chat trực tiếp với khách truy cập, tự động xin số điện thoại khách khi bạn vắng mặt.",
      whyCrucial: "Kịp thời tư vấn khi khách hàng đang đắn đo so sánh báo giá thạch cao giữa các đơn vị thi công.",
      difficulty: "Dễ",
      benefit: "Thu thập thông tin khách hàng tiềm năng tự động 24/7."
    },
    {
      id: "8",
      category: "Tối ưu & Tốc độ",
      groupName: "8. Tối ưu SEO (Lên Google)",
      freePlugin: "Rank Math SEO",
      paidPlugin: "Rank Math Pro",
      desc: "Tối ưu từ khóa bài viết, tạo sơ đồ trang web (Sitemap), khai báo cấu trúc doanh nghiệp thi công với Google.",
      whyCrucial: "Giúp website lọt top tìm kiếm khi khách hàng gõ 'thi công trần thạch cao giá rẻ' hoặc 'vách nhựa giả gỗ tại HCM'.",
      difficulty: "Trung bình",
      benefit: "Hiển thị sơ đồ bài viết chuẩn SEO, tối ưu schema doanh nghiệp địa phương."
    },
    {
      id: "9",
      category: "Tối ưu & Tốc độ",
      groupName: "9. Tăng tốc độ tải trang",
      freePlugin: "LiteSpeed Cache (nếu dùng host LiteSpeed)",
      paidPlugin: "WP Rocket",
      desc: "Giúp website tải cực nhanh (dưới 2 giây), tăng trải nghiệm khách hàng và được Google đánh giá cao.",
      whyCrucial: "Khách hàng sẽ thoát trang ngay lập tức nếu website tải quá 3 giây. Tải nhanh cũng giúp cải thiện điểm chất lượng quảng cáo Google Ads.",
      difficulty: "Trung bình",
      benefit: "Giảm thời gian phản hồi máy chủ, tối ưu điểm Google PageSpeed Insights."
    },
    {
      id: "10",
      category: "Tối ưu & Tốc độ",
      groupName: "10. Nén ảnh công trình",
      freePlugin: "Smush hoặc Robin Image Optimizer",
      paidPlugin: "ShortPixel hoặc Imagify",
      desc: "Tự động giảm dung lượng ảnh chụp công trình xuống 50-70% mà không làm mờ ảnh, giúp web không bị lag.",
      whyCrucial: "Ảnh công trình thực tế thường chụp bằng máy cơ hoặc iPhone dung lượng rất lớn (3-5MB). Nén ảnh giúp tiết kiệm 80% dung lượng lưu trữ.",
      difficulty: "Dễ",
      benefit: "Giữ ảnh thi công siêu nét nhưng dung lượng cực nhẹ dưới 150KB."
    },
    {
      id: "11",
      category: "Bảo mật & Quản lý",
      groupName: "11. Thống kê truy cập",
      freePlugin: "Site Kit by Google",
      paidPlugin: "Hoàn toàn miễn phí",
      desc: "Xem trực tiếp số người vào web, họ tìm từ khóa gì để vào web ngay trên bảng điều khiển WordPress.",
      whyCrucial: "Biết rõ hiệu quả của các chiến dịch quảng cáo, nắm được xu hướng khách hàng quan tâm đến loại vật liệu nào nhất.",
      difficulty: "Dễ",
      benefit: "Kết nối Google Analytics & Search Console chỉ trong 3 bước."
    },
    {
      id: "12",
      category: "Bảo mật & Quản lý",
      groupName: "12. Bảo mật chống Hack",
      freePlugin: "Wordfence Security hoặc iThemes Security",
      paidPlugin: "Wordfence Premium",
      desc: "Quét mã độc, chặn IP xấu cố tình dò mật khẩu, bảo vệ dữ liệu website.",
      whyCrucial: "Tránh việc website bị chèn mã độc quảng cáo bẩn hoặc bị đối thủ cạnh tranh tấn công DDoS phá hoại.",
      difficulty: "Trung bình",
      benefit: "Bảo mật tài khoản Admin, gửi cảnh báo đăng nhập bất thường tức thì."
    },
    {
      id: "13",
      category: "Bảo mật & Quản lý",
      groupName: "13. Tự động Sao lưu (Backup)",
      freePlugin: "UpdraftPlus",
      paidPlugin: "UpdraftPlus Premium",
      desc: "Tự động copy toàn bộ dữ liệu web gửi lên Google Drive hàng tuần. Web lỗi chỉ cần bấm 1 nút là khôi phục lại.",
      whyCrucial: "Phòng ngừa rủi ro máy chủ nhà cung cấp bị lỗi vật lý hoặc lỗi trong quá trình tự cập nhật phiên bản plugin.",
      difficulty: "Dễ",
      benefit: "An tâm tuyệt đối khi thử nghiệm các tính năng mới trên website."
    },
    
    // 7 Additional Premium Plugins to make the catalog "COMPLETELY PROFESSIONAL"
    {
      id: "14",
      category: "Bán hàng & Chăm sóc",
      groupName: "14. Đặt lịch hẹn & Khảo sát công trình",
      freePlugin: "Bookly (Bản Free) hoặc Amelia",
      paidPlugin: "LatePoint hoặc Bookly Pro",
      desc: "Cho phép khách hàng lựa chọn ngày giờ, đăng ký lịch KTS đến khảo sát mặt bằng đo đạc trực tiếp.",
      whyCrucial: "Khách hàng bận rộn muốn chủ động chốt thời gian KTS Minh Khôi đến tận nhà đo đạc mà không cần gọi điện thoại dông dài.",
      difficulty: "Trung bình",
      benefit: "Đồng bộ hóa lịch khảo sát trực tiếp lên Google Calendar của kiến trúc sư."
    },
    {
      id: "15",
      category: "Thiết kế & Dự án",
      groupName: "15. Đa ngôn ngữ (Multilingual)",
      freePlugin: "Polylang",
      paidPlugin: "WPML hoặc Weglot",
      desc: "Dịch toàn bộ bài viết, dự án và bảng báo giá sang Tiếng Anh, Tiếng Trung hoặc Tiếng Hàn.",
      whyCrucial: "Vô cùng quan trọng nếu Trương Gia Phát muốn tiếp cận nhóm chủ đầu tư nước ngoài thi công văn phòng, căn hộ dịch vụ cao cấp.",
      difficulty: "Khó",
      benefit: "Nâng tầm thương hiệu quốc tế, thu hút khách hàng nước ngoài định cư Việt Nam."
    },
    {
      id: "16",
      category: "Thiết kế & Dự án",
      groupName: "16. Tự động chuyển đổi ảnh WebP",
      freePlugin: "WebP Express",
      paidPlugin: "Converter for Media (Pro)",
      desc: "Tự động chuyển đổi toàn bộ định dạng ảnh JPG/PNG sang WebP - định dạng ảnh thế hệ mới tối ưu cho trình duyệt.",
      whyCrucial: "Google cực kỳ ưu tiên các website sử dụng ảnh WebP, giúp tốc độ tải trang trên di động nhanh gấp đôi.",
      difficulty: "Dễ",
      benefit: "Tiết kiệm thêm 40% băng thông tải trang mà chất lượng ảnh giữ nguyên."
    },
    {
      id: "17",
      category: "Bảo mật & Quản lý",
      groupName: "17. Chống sao chép nội dung & ảnh",
      freePlugin: "WP Content Copy Protection & No Right Click",
      paidPlugin: "Bản Free đã tối ưu",
      desc: "Ngăn chặn đối thủ quét/quẹt chọn văn bản, click chuột phải tải ảnh thi công độc quyền của Trương Gia Phát.",
      whyCrucial: "Bảo vệ các tác phẩm thiết kế 3D độc quyền và các bài viết phân tích vật liệu mất nhiều công sức biên soạn.",
      difficulty: "Dễ",
      benefit: "Ngăn chặn hoàn toàn việc sao chép nội dung trái phép từ đối thủ cùng ngành."
    },
    {
      id: "18",
      category: "Thiết kế & Dự án",
      groupName: "18. Đồng bộ ảnh Instagram/Facebook",
      freePlugin: "Smash Balloon Social Photo Feed",
      paidPlugin: "Instagram Feed Pro",
      desc: "Tự động lấy ảnh từ trang mạng xã hội chính thức của công ty để hiển thị thành thư viện chân thực trên website.",
      whyCrucial: "Giúp người dùng thấy được hoạt động thi công thực tế diễn ra hàng ngày của thợ tại công trình một cách sống động.",
      difficulty: "Dễ",
      benefit: "Tự động cập nhật nội dung mới lên website mà không cần đăng thủ công."
    },
    {
      id: "19",
      category: "Bán hàng & Chăm sóc",
      groupName: "19. Tính toán báo giá tự động (Calculator)",
      freePlugin: "Cost Calculator Builder",
      paidPlugin: "Stylish Cost Calculator hoặc Cost Calculator Pro",
      desc: "Xây dựng bảng tính trực quan cho khách tự nhập diện tích, chọn vật liệu để ra ngay dự toán ngân sách sơ bộ.",
      whyCrucial: "Giảm bớt thời gian giải thích báo giá, giúp lọc trước những khách hàng có ngân sách phù hợp.",
      difficulty: "Trung bình",
      benefit: "Tương tác cao, tăng 80% thời gian khách hàng ở lại trải nghiệm trên website."
    },
    {
      id: "20",
      category: "Bảo mật & Quản lý",
      groupName: "20. SMTP gửi Email liên hệ tin cậy",
      freePlugin: "WP Mail SMTP",
      paidPlugin: "WP Mail SMTP Pro",
      desc: "Cấu hình gửi email từ form liên hệ thông qua giao thức bảo mật Gmail/Outlook thay vì hàm mail mặc định.",
      whyCrucial: "Đảm bảo 100% email thông báo đăng ký khảo sát của khách hàng sẽ gửi thẳng vào hộp thư chính của bạn, không bị rơi vào hòm thư rác (Spam).",
      difficulty: "Trung bình",
      benefit: "Khắc phục triệt để lỗi không nhận được email từ form đặt lịch."
    }
  ];

  const filteredPlugins = useMemo(() => {
    return plugins.filter(p => {
      const matchesSearch = p.groupName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.freePlugin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.paidPlugin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.desc.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "Tất cả" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const handleCopy = (pluginName: string, id: string) => {
    navigator.clipboard.writeText(pluginName);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Stack recommendations based on goals
  const recommendedStack = useMemo(() => {
    if (siteGoal === "portfolio") {
      return {
        title: "Bộ Plugin Tối Giản Trưng Bày Dự Án & Nhận Lịch",
        desc: "Thích hợp cho cá nhân, đội thợ hoặc công ty nhỏ tập trung phô diễn hình ảnh công trình và cần nút Zalo/Form đăng ký nhanh chóng.",
        pluginsList: ["1. Thiết kế & Giao diện (Elementor Free)", "3. Trưng bày dự án (Essential Addons)", "5. Form liên hệ (Fluent Forms)", "6. Gọi nhanh (Joinchat)", "10. Nén ảnh (Smush)", "13. Backup (UpdraftPlus)", "17. Chống copy ảnh (WP Content Copy)"],
        estimatedSetup: "1 - 2 ngày",
        hardwareReq: "Hosting tiêu chuẩn (2GB RAM, 1 Core CPU)"
      };
    } else if (siteGoal === "sales") {
      return {
        title: "Bộ Plugin Thương Mại Điện Tử & Bán Vật Tư",
        desc: "Phù hợp cho các showroom, nhà phân phối tấm ốp, phào chỉ muốn trưng bày hàng hóa rõ ràng, có giỏ hàng đặt mua và hỗ trợ trực tuyến.",
        pluginsList: ["1. Thiết kế & Giao diện (Elementor Pro)", "2. Bán hàng (WooCommerce)", "5. Form liên hệ (Fluent Forms)", "6. Gọi nhanh (Joinchat)", "7. Livechat (Crisp/Tidio)", "9. Tăng tốc độ (WP Rocket)", "10. Nén ảnh (ShortPixel)", "19. Tính giá tự động (Cost Calculator)"],
        estimatedSetup: "5 - 7 ngày",
        hardwareReq: "Cloud VPS hoặc Hosting Premium (4GB RAM, 2 Core CPU)"
      };
    } else {
      return {
        title: "Hệ Thống Doanh Nghiệp Lớn Báo Giá & Booking Chuyên Nghiệp",
        desc: "Dành cho công ty thi công chuyên nghiệp (như Trương Gia Phát). Tự động hóa lịch hẹn khảo sát, tính giá online, đồng bộ Google Calendar, tối ưu SEO vượt trội.",
        pluginsList: ["1. Thiết kế & Giao diện (Bricks hoặc Elementor Pro)", "3. Dự án (WP Portfolio)", "4. Dữ liệu (ACF + JetEngine)", "5. Nhận báo giá (Fluent Forms Pro)", "6. Gọi nhanh (Joinchat)", "8. SEO (Rank Math Pro)", "9. Tăng tốc (LiteSpeed Cache / WP Rocket)", "14. Đặt lịch khảo sát (LatePoint)", "20. Gửi Email (WP Mail SMTP)"],
        estimatedSetup: "10 - 15 ngày",
        hardwareReq: "Cloud Server chuyên dụng (4GB - 8GB RAM, LiteSpeed Web Server)"
      };
    }
  }, [siteGoal]);

  const handleConsultStack = () => {
    const prompt = `Chào KTS Minh Khôi! Tôi đã trải nghiệm công cụ Chọn Stack Công Nghệ trên website của bạn.
Tôi đang có mục tiêu xây dựng website theo mô hình: "${siteGoal === "portfolio" ? "Giới thiệu dự án & liên hệ" : siteGoal === "sales" ? "Bán hàng vật tư trang trí" : "Doanh nghiệp lớn đầy đủ tính năng"}".
Ngân sách dự kiến: ${hasBudget ? "Có thể đầu tư bản Trả phí (Pro/Premium) để tối ưu nhất" : "Ưu tiên tối đa các bản Miễn phí (Free)"}.
Vui lòng tư vấn cho tôi lộ trình thiết lập bộ plugin này để tối ưu hóa SEO và tốc độ tải ảnh công trình nhé!`;
    onOpenChatWithPrompt(prompt);
  };

  return (
    <div id="plugins" className="relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,rgba(245,158,11,0.03),transparent)] pointer-events-none" />
      
      <div className="relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-4 mb-10 mt-2">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full">
            Cẩm Nang Số Hóa Ngành Nội Thất
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif text-stone-100 font-bold">
            Bản Đồ 20+ Plugin WordPress Tốt Nhất Cho Web Nội Thất
          </h2>
          <p className="text-stone-400 max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed">
            Biên soạn độc quyền bởi Trương Gia Phát. Giúp bạn định hình bộ plugin tối ưu SEO, tăng tốc độ load ảnh công trình và tạo tính năng tính giá, nhận lịch khảo sát chuyên nghiệp.
          </p>
        </div>

        {/* Section 1: INTERACTIVE STACK BUILDER (Bộ Chọn Stack Công Nghệ Tự Động) */}
        <div className="mb-16 bg-gradient-to-br from-stone-950 to-stone-900 border border-amber-500/10 rounded-3xl p-6 sm:p-10 shadow-2xl">
          <div className="flex flex-col lg:flex-row gap-8 items-stretch">
            
            {/* Left selector */}
            <div className="lg:w-1/2 space-y-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-500 mb-3">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-widest font-mono">Trợ lý ảo xây dựng web</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-serif text-stone-100 font-bold">
                  Bấm Chọn Nhu Cầu - Nhận Ngay Stack Đề Xuất
                </h3>
                <p className="text-stone-400 text-xs sm:text-sm mt-2 leading-relaxed">
                  Bạn đang chuẩn bị tự xây dựng website cho xưởng gỗ, đội thợ thạch cao hay công ty nội thất? Hãy lựa chọn mô hình mong muốn, chúng tôi sẽ sàng lọc ra tổ hợp plugin tối ưu nhất dành riêng cho bạn.
                </p>
              </div>

              <div className="space-y-4">
                {/* Selector 1: Site Goal */}
                <div className="space-y-2">
                  <label className="block text-xs uppercase font-extrabold text-stone-400 tracking-wider">Mô hình website hướng tới:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => setSiteGoal("portfolio")}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        siteGoal === "portfolio"
                          ? "bg-amber-500/10 border-amber-500 text-amber-500"
                          : "bg-stone-900/50 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-300"
                      }`}
                    >
                      <span className="block font-bold text-xs sm:text-sm">Trưng bày dự án</span>
                      <span className="text-[10px] text-stone-500 mt-1 block">Tập trung giới thiệu ảnh thi công</span>
                    </button>
                    
                    <button
                      onClick={() => setSiteGoal("sales")}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        siteGoal === "sales"
                          ? "bg-amber-500/10 border-amber-500 text-amber-500"
                          : "bg-stone-900/50 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-300"
                      }`}
                    >
                      <span className="block font-bold text-xs sm:text-sm">Bán lẻ vật tư nội thất</span>
                      <span className="text-[10px] text-stone-500 mt-1 block">Có giỏ hàng, bảng giá phào chỉ</span>
                    </button>

                    <button
                      onClick={() => setSiteGoal("enterprise")}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        siteGoal === "enterprise"
                          ? "bg-amber-500/10 border-amber-500 text-amber-500"
                          : "bg-stone-900/50 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-300"
                      }`}
                    >
                      <span className="block font-bold text-xs sm:text-sm">Doanh nghiệp quy mô</span>
                      <span className="text-[10px] text-stone-500 mt-1 block">Đặt lịch, tính giá tự động, SEO pro</span>
                    </button>
                  </div>
                </div>

                {/* Selector 2: Budget */}
                <div className="space-y-2">
                  <label className="block text-xs uppercase font-extrabold text-stone-400 tracking-wider">Ngân sách cho các Plugin trả phí:</label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setHasBudget(false)}
                      className={`flex-1 py-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        !hasBudget
                          ? "bg-stone-800 border-amber-500/50 text-amber-500"
                          : "bg-stone-900/30 border-stone-800 text-stone-500 hover:text-stone-400"
                      }`}
                    >
                      Ưu tiên Free tốt nhất
                    </button>
                    <button
                      onClick={() => setHasBudget(true)}
                      className={`flex-1 py-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        hasBudget
                          ? "bg-stone-800 border-amber-500/50 text-amber-500"
                          : "bg-stone-900/30 border-stone-800 text-stone-500 hover:text-stone-400"
                      }`}
                    >
                      Có thể mua Premium (Bản Pro)
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleConsultStack}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10"
                >
                  <MessageSquare className="h-4.5 w-4.5" />
                  <span>Nhận File Hướng Dẫn & Nhờ KTS Setup Hộ</span>
                </button>
              </div>
            </div>

            {/* Right stack presentation card */}
            <div className="lg:w-1/2 bg-stone-950/70 border border-stone-800/80 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-stone-900 pb-3">
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded">
                    Kết Quả Sàng Lọc
                  </span>
                  <div className="text-[10px] text-stone-500 flex gap-2">
                    <span>Cấu hình: <strong className="text-stone-300">{recommendedStack.hardwareReq}</strong></span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-base sm:text-lg font-serif font-bold text-stone-100 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    {recommendedStack.title}
                  </h4>
                  <p className="text-stone-400 text-xs leading-relaxed">
                    {recommendedStack.desc}
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  <span className="block text-[10px] uppercase font-bold text-stone-500">Các plugin cốt lõi bắt buộc phải cài:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {recommendedStack.pluginsList.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-stone-300 bg-stone-900/50 px-3 py-2 rounded-lg border border-stone-850">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        <span className="font-medium line-clamp-1">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-900 flex justify-between items-center text-[10px] text-stone-500">
                <span>Thời gian tự cài đặt dự kiến: <strong className="text-stone-300 font-mono">{recommendedStack.estimatedSetup}</strong></span>
                <span className="text-amber-500/80 font-semibold italic">Đã nén tối ưu dung lượng ảnh *</span>
              </div>
            </div>

          </div>
        </div>

        {/* Section 2: COMPREHENSIVE INTERACTIVE TABLE */}
        <div className="space-y-6">
          
          {/* Filters & Search Control panel */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-stone-950 p-4 rounded-2xl border border-stone-800">
            {/* Tabs selection */}
            <div className="flex flex-wrap items-center gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-amber-500 text-stone-950 font-bold shadow-sm shadow-amber-500/10"
                      : "bg-stone-900/60 text-stone-400 hover:text-stone-200 hover:bg-stone-900"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative md:w-80">
              <input
                type="text"
                placeholder="Tìm plugin theo tên, công dụng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-stone-900/60 text-stone-200 border border-stone-800 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-amber-500 placeholder-stone-500 transition-all"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-500" />
            </div>
          </div>

          {/* Plugin Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlugins.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-stone-950/40 rounded-2xl border border-stone-800/80">
                <p className="text-stone-500 text-sm">Không tìm thấy plugin nào khớp với từ khóa tìm kiếm của bạn.</p>
                <button 
                  onClick={() => { setSearchTerm(""); setSelectedCategory("Tất cả"); }} 
                  className="mt-3 text-xs text-amber-500 font-bold hover:underline cursor-pointer"
                >
                  Xóa bộ lọc để thử lại
                </button>
              </div>
            ) : (
              filteredPlugins.map((p) => (
                <div 
                  key={p.id}
                  className="bg-stone-950/50 hover:bg-stone-950/90 border border-stone-850 hover:border-amber-500/20 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    {/* Badge Category & Difficulty */}
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-bold text-amber-500 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/25">
                        {p.category}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        p.difficulty === "Dễ" ? "bg-emerald-500/10 text-emerald-400" :
                        p.difficulty === "Trung bình" ? "bg-amber-500/10 text-amber-400" :
                        "bg-rose-500/10 text-rose-400"
                      }`}>
                        Độ khó setup: {p.difficulty}
                      </span>
                    </div>

                    {/* Group Title */}
                    <h4 className="text-sm font-bold text-stone-100 group-hover:text-amber-500 transition-colors">
                      {p.groupName}
                    </h4>

                    {/* Description */}
                    <p className="text-stone-400 text-xs leading-relaxed line-clamp-3">
                      {p.desc}
                    </p>

                    {/* Why Crucial */}
                    <div className="p-2.5 rounded bg-stone-900/50 border border-stone-900 text-[11px] text-stone-300 italic leading-relaxed">
                      <strong className="text-amber-500/80 font-semibold not-italic">Tại sao cực kỳ quan trọng:</strong> {p.whyCrucial}
                    </div>
                  </div>

                  {/* Plugin comparison boxes */}
                  <div className="space-y-2 pt-2 border-t border-stone-900">
                    <div className="flex items-center justify-between gap-1 text-xs">
                      <span className="text-stone-500 font-medium">Bản Miễn Phí (Free):</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-stone-200 font-semibold bg-stone-900 px-2 py-1 rounded text-[11px] max-w-[130px] truncate">{p.freePlugin}</span>
                        <button 
                          onClick={() => handleCopy(p.freePlugin, `free-${p.id}`)}
                          className="p-1 rounded hover:bg-stone-850 text-stone-500 hover:text-stone-300 transition-all cursor-pointer"
                          title="Sao chép tên plugin"
                        >
                          {copiedId === `free-${p.id}` ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-1 text-xs">
                      <span className="text-stone-500 font-medium">Trả Phí (Pro/Premium):</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-amber-500/90 font-semibold bg-amber-500/5 border border-amber-500/10 px-2 py-1 rounded text-[11px] max-w-[130px] truncate">{p.paidPlugin}</span>
                        <button 
                          onClick={() => handleCopy(p.paidPlugin, `paid-${p.id}`)}
                          className="p-1 rounded hover:bg-stone-850 text-stone-500 hover:text-stone-300 transition-all cursor-pointer"
                          title="Sao chép tên plugin"
                        >
                          {copiedId === `paid-${p.id}` ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 text-[10px] text-stone-500 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-emerald-500/90">
                        <CheckCircle2 className="h-3 w-3" />
                        {p.benefit}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        {/* Section 3: FAQS ON PLUGIN MANAGEMENT */}
        <div className="mt-16 bg-stone-950/40 rounded-2xl border border-stone-800/80 p-6 sm:p-10 space-y-6">
          <h3 className="text-lg sm:text-xl font-serif text-stone-100 font-bold border-b border-stone-800 pb-3">
            Những câu hỏi thường gặp khi cài đặt Plugin cho Website nội thất
          </h3>
          
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h5 className="text-xs sm:text-sm font-bold text-amber-500 flex items-center gap-2">
                <HelpCircle className="h-4 w-4 shrink-0" />
                Nên cài bao nhiêu plugin là tối đa?
              </h5>
              <p className="text-stone-400 text-xs leading-relaxed">
                Không có con số giới hạn cố định, nhưng tốt nhất nên giữ số lượng plugin hoạt động dưới <strong>20 - 25 cái</strong>. Việc cài quá nhiều plugin xung đột nhau hoặc plugin kém chất lượng sẽ làm chậm web nghiêm trọng và tăng nguy cơ bị lộ lỗ hổng bảo mật.
              </p>
            </div>

            <div className="space-y-2">
              <h5 className="text-xs sm:text-sm font-bold text-amber-500 flex items-center gap-2">
                <HelpCircle className="h-4 w-4 shrink-0" />
                Tại sao hình ảnh tải chậm dù đã cài plugin nén ảnh?
              </h5>
              <p className="text-stone-400 text-xs leading-relaxed">
                Đôi khi bạn quên chuyển đổi ảnh sang định dạng thế hệ mới như <strong>WebP hoặc AVIF</strong>. Đảm bảo bạn đã cài <strong>WebP Express</strong> và thiết lập cơ chế tự chuyển đổi khi tải lên. Đồng thời, không tải ảnh có kích thước chiều ngang lớn hơn 2048px lên web.
              </p>
            </div>

            <div className="space-y-2">
              <h5 className="text-xs sm:text-sm font-bold text-amber-500 flex items-center gap-2">
                <HelpCircle className="h-4 w-4 shrink-0" />
                Có nên sử dụng các bản plugin 'nulled' (bẻ khóa miễn phí)?
              </h5>
              <p className="text-stone-400 text-xs leading-relaxed text-red-400/90 font-medium">
                Tuyệt đối KHÔNG! 99% các bản plugin nulled (bẻ khóa trả phí miễn phí) chia sẻ trên mạng đều chứa backdoor ẩn dật. Khi cài vào, tin tặc sẽ âm thầm chiếm quyền kiểm soát website, thu thập số điện thoại khách hàng, chèn link SEO bẩn hoặc phá hỏng hoàn toàn dữ liệu của bạn.
              </p>
            </div>

            <div className="space-y-2">
              <h5 className="text-xs sm:text-sm font-bold text-amber-500 flex items-center gap-2">
                <HelpCircle className="h-4 w-4 shrink-0" />
                Thực hiện sao lưu (Backup) lưu ở đâu là an toàn nhất?
              </h5>
              <p className="text-stone-400 text-xs leading-relaxed">
                Luôn thiết lập plugin <strong>UpdraftPlus</strong> lưu bản backup ra các đám mây lưu trữ bên ngoài như <strong>Google Drive, Dropbox</strong> hoặc <strong>OneDrive</strong> cá nhân thay vì lưu trực tiếp trên cùng một ổ đĩa máy chủ chứa mã nguồn web.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
