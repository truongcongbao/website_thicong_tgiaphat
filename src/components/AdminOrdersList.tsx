import { useState } from "react";
import { ShoppingCart, Search, Trash2, CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function AdminOrdersList() {
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState([
    { id: "TGP-2026-001", client: "Anh Hoàng (Bình Thạnh)", service: "Trần thạch cao giật cấp", area: "85m²", budget: "20,825,000đ", date: "2026-06-24", status: "Đang thi công" },
    { id: "TGP-2026-002", client: "Chị Lan (Quận 7)", service: "Ốp tường nhựa composite lam sóng", area: "120m²", budget: "45,600,000đ", date: "2026-06-25", status: "Đang khảo sát" },
    { id: "TGP-2026-003", client: "Anh Nam (Thủ Đức)", service: "Vách thạch cao ngăn phòng cách âm", area: "45m²", budget: "10,575,000đ", date: "2026-06-22", status: "Đã hoàn thành" },
    { id: "TGP-2026-004", client: "Chị Vy (Phú Nhuận)", service: "Tấm nhựa PVC vân đá cẩm thạch", area: "30m²", budget: "9,600,000đ", date: "2026-06-20", status: "Chờ duyệt" },
  ]);

  const changeStatus = (id: string, newStatus: string) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
  };

  const filteredOrders = orders.filter(o => 
    o.client.toLowerCase().includes(search.toLowerCase()) || 
    o.service.toLowerCase().includes(search.toLowerCase()) || 
    o.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-5 sm:p-6 bg-stone-900 border border-stone-850 rounded-2xl shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-stone-100 uppercase tracking-wider flex items-center gap-2">
            <ShoppingCart className="h-4.5 w-4.5 text-amber-500" />
            <span>Danh sách đơn hàng & hợp đồng ({orders.length})</span>
          </h3>
          <p className="text-xs text-stone-400">Danh sách các gói thi công thạch cao, tấm ốp tường nhựa cao cấp đang chạy thực tế.</p>
        </div>
      </div>

      {/* Control filters */}
      <div className="flex items-center bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 max-w-md">
        <Search className="h-4 w-4 text-stone-500 mr-2 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm tên chủ nhà, dịch vụ, mã đơn..."
          className="bg-transparent text-stone-100 text-xs sm:text-sm focus:outline-none w-full"
        />
      </div>

      {/* Orders list table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-stone-800 text-stone-400 font-bold text-[10px] uppercase tracking-wider">
              <th className="pb-3 pr-4">Mã ĐH / Chủ đầu tư</th>
              <th className="pb-3 px-4">Dịch vụ thi công</th>
              <th className="pb-3 px-4">Quy mô / Dự toán</th>
              <th className="pb-3 px-4">Trạng thái</th>
              <th className="pb-3 pl-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-850">
            {filteredOrders.map((ord) => (
              <tr key={ord.id} className="hover:bg-stone-850/30 transition-colors">
                <td className="py-3.5 pr-4">
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-stone-200">{ord.client}</h4>
                    <p className="text-[10px] text-stone-500 font-mono">{ord.id} • {ord.date}</p>
                  </div>
                </td>
                <td className="py-3.5 px-4 font-semibold text-stone-300">
                  {ord.service}
                </td>
                <td className="py-3.5 px-4">
                  <div className="space-y-0.5">
                    <span className="text-xs text-stone-200 font-bold">{ord.budget}</span>
                    <span className="text-[10px] text-stone-500 block font-mono">Diện tích: {ord.area}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                    ord.status === "Đã hoàn thành"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : ord.status === "Đang thi công"
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      : ord.status === "Đang khảo sát"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : "bg-stone-500/10 text-stone-400 border-stone-500/20"
                  }`}>
                    {ord.status}
                  </span>
                </td>
                <td className="py-3.5 pl-4 text-right">
                  <select
                    value={ord.status}
                    onChange={(e) => changeStatus(ord.id, e.target.value)}
                    className="px-2 py-1 rounded bg-stone-800 border border-stone-700 text-stone-300 text-[11px] focus:outline-none focus:border-amber-500"
                  >
                    <option value="Chờ duyệt">Chờ duyệt</option>
                    <option value="Đang khảo sát">Khảo sát</option>
                    <option value="Đang thi công">Thi công</option>
                    <option value="Đã hoàn thành">Hoàn thành</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
