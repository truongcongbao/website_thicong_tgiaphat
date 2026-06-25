import { 
  FileText, Package, ShoppingCart, PhoneCall, ArrowUpRight, 
  TrendingUp, CheckCircle, Clock, AlertCircle, Sparkles, User, ShieldCheck
} from "lucide-react";

interface AdminDashboardHomeProps {
  postsCount: number;
  productsCount: number;
  ordersCount: number;
  consultationsCount: number;
  setActiveTab: (tab: string) => void;
}

export default function AdminDashboardHome({
  postsCount,
  productsCount,
  ordersCount,
  consultationsCount,
  setActiveTab
}: AdminDashboardHomeProps) {
  
  const stats = [
    {
      id: "posts",
      label: "Bài viết cẩm nang",
      value: postsCount,
      sub: "Đang lưu trên Cloud SQL",
      icon: FileText,
      color: "from-amber-500/10 to-amber-500/5 border-amber-500/20 text-amber-400",
      iconBg: "bg-amber-500/20 text-amber-400"
    },
    {
      id: "products",
      label: "Danh mục sản phẩm",
      value: productsCount,
      sub: "Vật tư & dịch vụ hoàn thiện",
      icon: Package,
      color: "from-blue-500/10 to-blue-500/5 border-blue-500/20 text-blue-400",
      iconBg: "bg-blue-500/20 text-blue-400"
    },
    {
      id: "orders",
      label: "Đơn hàng thi công",
      value: ordersCount,
      sub: "Dự toán & quyết toán hợp đồng",
      icon: ShoppingCart,
      color: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-400",
      iconBg: "bg-emerald-500/20 text-emerald-400"
    },
    {
      id: "consultations",
      label: "Yêu cầu khảo sát",
      value: consultationsCount,
      sub: "Đăng ký tư vấn báo giá trực tuyến",
      icon: PhoneCall,
      color: "from-purple-500/10 to-purple-500/5 border-purple-500/20 text-purple-400",
      iconBg: "bg-purple-500/20 text-purple-400"
    }
  ];

  const recentActivities = [
    { text: "Đã cập nhật biểu giá thạch cao giật cấp khung chìm", time: "10 phút trước", type: "success" },
    { text: "Đã tiếp nhận yêu cầu khảo sát biệt thự chị Hằng (Quận 2)", time: "1 giờ trước", type: "info" },
    { text: "Lượt truy cập cẩm nang plugin WordPress tăng 15% hôm nay", time: "3 giờ trước", type: "warning" },
    { text: "Bài viết 'Mẹo thi công trần chống ẩm' đã xuất bản công khai", time: "5 giờ trước", type: "success" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-stone-900 to-stone-950 border border-stone-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-serif text-stone-100 font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Chào mừng trở lại, Quản Trị Viên!
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
              Hệ thống ERP của <b>Trương Gia Phát</b> đã kết nối ổn định đến Cơ sở dữ liệu Cloud SQL. Hãy cập nhật sản phẩm, bài viết cẩm nang và quản lý các yêu cầu đo đạc khảo sát thực địa từ khách hàng.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab("posts")}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Quản lý Bài viết</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.id}
            onClick={() => setActiveTab(stat.id)}
            className={`p-5 rounded-2xl bg-gradient-to-br ${stat.color} border flex items-center gap-4 transition-all hover:scale-[1.02] cursor-pointer shadow-md`}
          >
            <div className={`p-3 rounded-xl shrink-0 ${stat.iconBg}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <span className="text-2xl sm:text-3xl font-black font-mono block">
                {stat.value}
              </span>
              <span className="text-xs font-bold text-stone-100 block truncate">
                {stat.label}
              </span>
              <span className="text-[10px] text-stone-400 block truncate">
                {stat.sub}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Bento content row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Simulated traffic chart */}
        <div className="p-5 sm:p-6 bg-stone-900 border border-stone-850 rounded-2xl lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">Hiệu suất hệ thống</h3>
              <p className="text-sm font-bold text-stone-200">Biểu đồ lượt xem cẩm nang (7 ngày qua)</p>
            </div>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +14.2%
            </span>
          </div>

          {/* Simple custom SVG chart for lightning-fast presentation and zero lag */}
          <div className="h-44 flex items-end justify-between pt-4 gap-3">
            {[180, 290, 220, 380, 410, 310, 480].map((val, idx) => {
              const days = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
              const heightPercent = (val / 500) * 100;
              return (
                <div key={idx} className="flex flex-col items-center flex-grow space-y-2 group">
                  <div className="w-full bg-stone-950 rounded-lg h-32 flex items-end relative overflow-hidden">
                    <div 
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-gradient-to-t from-amber-500/60 to-amber-400 rounded-b-lg group-hover:from-amber-400 group-hover:to-amber-300 transition-all cursor-pointer relative"
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold bg-stone-800 text-stone-200 px-1 py-0.2 rounded border border-stone-700 opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                        {val} views
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-stone-500">{days[idx]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real-time system activity logs */}
        <div className="p-5 sm:p-6 bg-stone-900 border border-stone-850 rounded-2xl space-y-4">
          <div className="border-b border-stone-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">Hoạt động mới nhất</h3>
            <p className="text-sm font-bold text-stone-200">Ghi nhận từ máy chủ & API</p>
          </div>

          <div className="space-y-3.5">
            {recentActivities.map((act, idx) => (
              <div key={idx} className="flex gap-3 items-start text-xs leading-relaxed">
                <div className="h-5 w-5 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-bold text-stone-400">
                  {idx + 1}
                </div>
                <div className="space-y-0.5">
                  <p className="text-stone-300 font-medium">{act.text}</p>
                  <p className="text-[9px] text-stone-500 font-mono flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {act.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info Warning banner regarding Cloud SQL durability */}
      <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide">Lưu trữ Cơ sở dữ liệu Cloud SQL</h4>
          <p className="text-[11px] text-stone-400 leading-relaxed">
            Hệ thống đang lưu trữ vĩnh viễn các Bài viết và Hồ sơ người dùng trên cụm cơ sở dữ liệu Postgres chất lượng cao, giúp bảo mật thông tin và đảm bảo dữ liệu không bị xóa mất kể cả khi bạn xóa cache trình duyệt.
          </p>
        </div>
      </div>
    </div>
  );
}
