import { useState } from "react";
import { PhoneCall, Search, Trash2, CheckCircle, Clock, FileSpreadsheet, Download } from "lucide-react";

export default function AdminConsultationsList() {
  const [search, setSearch] = useState("");
  const [consults, setConsults] = useState([
    { id: 1, name: "Trần Quốc Dũng", phone: "0908123456", service: "Trần thạch cao phòng khách", area: "35m²", status: "Chưa liên hệ", date: "2026-06-25" },
    { id: 2, name: "Nguyễn Thị Mai", phone: "0934789012", service: "Ốp vách PVC giả đá cẩm thạch", area: "18m²", status: "Đã tư vấn", date: "2026-06-24" },
    { id: 3, name: "Phạm Văn Nam", phone: "0912345678", service: "Tấm ốp nhựa lam sóng hành lang", area: "50m²", status: "Chưa liên hệ", date: "2026-06-24" },
    { id: 4, name: "Lê Hoàng Vy", phone: "0955556677", service: "Thi công thạch cao giật cấp", area: "120m²", status: "Đang lên lịch", date: "2026-06-23" },
  ]);

  const toggleStatus = (id: number) => {
    setConsults(consults.map(c => {
      if (c.id === id) {
        const nextStatus = c.status === "Chưa liên hệ" ? "Đang lên lịch" : c.status === "Đang lên lịch" ? "Đã tư vấn" : "Chưa liên hệ";
        return { ...c, status: nextStatus };
      }
      return c;
    }));
  };

  const handleDelete = (id: number) => {
    if (confirm("Xóa yêu cầu tư vấn này?")) {
      setConsults(consults.filter(c => c.id !== id));
    }
  };

  const handleExportCSV = () => {
    const headers = "\ufeffHọ Tên,SĐT,Dịch Vụ,Diện Tích,Ngày Đăng Ký,Trạng Thái\n";
    const rows = consults.map(c => `"${c.name}","${c.phone}","${c.service}","${c.area}","${c.date}","${c.status}"`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `TGP_Data_KhachHang_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredConsults = consults.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search) || 
    c.service.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-5 sm:p-6 bg-stone-900 border border-stone-850 rounded-2xl shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-stone-100 uppercase tracking-wider flex items-center gap-2">
            <PhoneCall className="h-4.5 w-4.5 text-amber-500" />
            <span>Yêu cầu tư vấn & khảo sát đo đạc ({consults.length})</span>
          </h3>
          <p className="text-xs text-stone-400">Danh sách khách hàng để lại số điện thoại và thông tin dự toán đo đạc công trình trực tiếp.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 cursor-pointer transition-all self-start sm:self-auto"
          title="Xuất file danh sách chăm sóc khách hàng"
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Xuất Excel CRM (CSV)</span>
        </button>
      </div>

      {/* Control panel */}
      <div className="flex items-center bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 max-w-md">
        <Search className="h-4 w-4 text-stone-500 mr-2 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm tên khách, SĐT, loại dịch vụ..."
          className="bg-transparent text-stone-100 text-xs sm:text-sm focus:outline-none w-full"
        />
      </div>

      {/* Consultations Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-stone-800 text-stone-400 font-bold text-[10px] uppercase tracking-wider">
              <th className="pb-3 pr-4">Khách hàng / SĐT</th>
              <th className="pb-3 px-4">Dịch vụ yêu cầu</th>
              <th className="pb-3 px-4">Quy mô đo đạc</th>
              <th className="pb-3 px-4">Ngày đăng ký</th>
              <th className="pb-3 px-4">Trạng thái xử lý</th>
              <th className="pb-3 pl-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-850">
            {filteredConsults.map((c) => (
              <tr key={c.id} className="hover:bg-stone-850/30 transition-colors">
                <td className="py-3.5 pr-4">
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-stone-200">{c.name}</h4>
                    <p className="text-[10px] text-amber-500 font-mono font-bold">{c.phone}</p>
                  </div>
                </td>
                <td className="py-3.5 px-4 font-semibold text-stone-300">
                  {c.service}
                </td>
                <td className="py-3.5 px-4 font-mono font-bold text-stone-400">
                  {c.area}
                </td>
                <td className="py-3.5 px-4 text-stone-400">
                  {c.date}
                </td>
                <td className="py-3.5 px-4">
                  <button
                    onClick={() => toggleStatus(c.id)}
                    className="cursor-pointer focus:outline-none"
                    title="Bấm để thay đổi trạng thái"
                  >
                    <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                      c.status === "Đã tư vấn"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : c.status === "Đang lên lịch"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}>
                      {c.status}
                    </span>
                  </button>
                </td>
                <td className="py-3.5 pl-4 text-right">
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-red-500/10 text-stone-400 hover:text-red-400 border border-stone-750 cursor-pointer transition-all"
                    title="Xóa yêu cầu"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
