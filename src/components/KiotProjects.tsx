import React, { useState } from "react";
import { Project, ProjectMaterial, ProjectStaff, Product, Customer } from "../types";
import { 
  Plus, HardHat, FileText, Calendar, DollarSign, Hammer, Briefcase, 
  Settings, CheckCircle2, AlertTriangle, Play, HelpCircle, X, Users, Box, PlusCircle
} from "lucide-react";
import { safeDispatchEvent } from "../lib/events";

interface KiotProjectsProps {
  projects: Project[];
  products: Product[];
  customers: Customer[];
  onAddProject: (p: Project) => void;
  onUpdateProject: (p: Project) => void;
  onUpdateProductStock: (id: string, newStock: number) => void;
}

export default function KiotProjects({ 
  projects, products, customers, onAddProject, onUpdateProject, onUpdateProductStock 
}: KiotProjectsProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects[0]?.id || null);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  
  // New Project Form
  const [projName, setProjName] = useState("");
  const [projAddress, setProjAddress] = useState("");
  const [projCustomerId, setProjCustomerId] = useState("");
  const [projBudget, setProjBudget] = useState<number>(10000000);
  const [projNotes, setProjNotes] = useState("");

  // Add material / crew states
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [materialQty, setMaterialQty] = useState<number>(1);

  const [showAddCrewModal, setShowAddCrewModal] = useState(false);
  const [crewName, setCrewName] = useState("");
  const [crewRole, setCrewRole] = useState("Thợ cả");
  const [crewWage, setCrewWage] = useState<number>(350000);

  const activeProject = projects.find(p => p.id === selectedProjectId);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) {
      alert("Vui lòng nhập tên công trình");
      return;
    }

    const customer = customers.find(c => c.id === projCustomerId);
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: projName,
      address: projAddress,
      customerId: projCustomerId,
      customerName: customer ? customer.name : "Khách vãng lai",
      status: "IN_PROGRESS",
      startDate: new Date().toISOString().split("T")[0],
      materials: [],
      staff: [],
      budget: projBudget,
      expenses: 0,
      notes: projNotes
    };

    onAddProject(newProject);
    setSelectedProjectId(newProject.id);
    setShowAddProjectModal(false);

    // Reset Form
    setProjName("");
    setProjAddress("");
    setProjCustomerId("");
    setProjBudget(10000000);
    setProjNotes("");

    safeDispatchEvent("kiot-toast", {
      type: "success",
      title: "Khởi tạo công trình mới thành công! 🏗️",
      message: `Đã đưa dự án "${newProject.name}" vào tiến trình theo dõi thi công.`
    });
  };

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !selectedProductId) return;

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    if (product.stock < materialQty) {
      alert(`Số lượng tồn kho không đủ để xuất sang công trình! Tồn kho hiện tại: ${product.stock} ${product.unit || "Tấm"}`);
      return;
    }

    // Deduct stock
    onUpdateProductStock(product.id, product.stock - materialQty);

    const newMat: ProjectMaterial = {
      productId: product.id,
      productName: product.name,
      quantity: materialQty,
      unit: product.unit || "Tấm",
      costPrice: product.costPrice
    };

    const updatedMaterials = [...activeProject.materials, newMat];
    // Re-calculate actual material cost
    const materialCostTotal = updatedMaterials.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0);
    const staffCostTotal = activeProject.staff.reduce((sum, item) => sum + item.wage, 0); // initial day rate
    
    const updatedProject: Project = {
      ...activeProject,
      materials: updatedMaterials,
      expenses: materialCostTotal + staffCostTotal
    };

    onUpdateProject(updatedProject);
    setShowAddMaterialModal(false);
    setMaterialQty(1);

    safeDispatchEvent("kiot-toast", {
      type: "success",
      title: "Xuất kho sang công trình thành công! 📦",
      message: `Đã xuất ${materialQty} ${newMat.unit} ${newMat.productName} bàn giao thợ thi công.`
    });
  };

  const handleAddCrew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !crewName.trim()) return;

    const newMember: ProjectStaff = {
      staffId: `stf-crew-${Date.now()}`,
      staffName: crewName,
      role: crewRole,
      wage: crewWage
    };

    const updatedStaff = [...activeProject.staff, newMember];
    const materialCostTotal = activeProject.materials.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0);
    const staffCostTotal = updatedStaff.reduce((sum, item) => sum + item.wage, 0);

    const updatedProject: Project = {
      ...activeProject,
      staff: updatedStaff,
      expenses: materialCostTotal + staffCostTotal
    };

    onUpdateProject(updatedProject);
    setShowAddCrewModal(false);
    setCrewName("");

    safeDispatchEvent("kiot-toast", {
      type: "success",
      title: "Bổ sung thợ thi công thành công! 👷",
      message: `Đã thêm ${newMember.staffName} (${newMember.role}) vào đội ngũ thi công.`
    });
  };

  const handleUpdateStatus = (newStatus: "IN_PROGRESS" | "COMPLETED" | "PAUSED") => {
    if (!activeProject) return;

    const updatedProject: Project = {
      ...activeProject,
      status: newStatus
    };

    onUpdateProject(updatedProject);

    let statusLabel = "Đang thi công";
    if (newStatus === "COMPLETED") statusLabel = "Đã hoàn thành";
    if (newStatus === "PAUSED") statusLabel = "Tạm dừng";

    safeDispatchEvent("kiot-toast", {
      type: "success",
      title: `Cập nhật trạng thái công trình! 🛠️`,
      message: `Đã chuyển trạng thái dự án sang: ${statusLabel}.`
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20"><Play className="h-3 w-3 animate-pulse" />Đang thi công</span>;
      case "COMPLETED":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20"><CheckCircle2 className="h-3 w-3" />Đã hoàn tất</span>;
      case "PAUSED":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20"><AlertTriangle className="h-3 w-3" />Tạm ngưng</span>;
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="kiot-projects-tab">
      
      {/* Left Column: Projects List Selector */}
      <div className="lg:col-span-4 bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div>
            <h3 className="text-sm font-black text-stone-100 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-emerald-500" />
              <span>Công Trình & Dự Án</span>
            </h3>
            <p className="text-[10px] text-stone-500 mt-0.5">Theo dõi chi phí vật tư, nhân lực</p>
          </div>
          <button
            onClick={() => setShowAddProjectModal(true)}
            className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 transition-all cursor-pointer"
            title="Khởi tạo công trình"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* List of Projects */}
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {projects.length === 0 ? (
            <p className="text-xs text-stone-500 text-center py-6">Chưa có công trình thi công nào.</p>
          ) : (
            projects.map(proj => (
              <button
                key={proj.id}
                onClick={() => setSelectedProjectId(proj.id)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex flex-col gap-2 relative group overflow-hidden ${
                  selectedProjectId === proj.id 
                    ? "bg-stone-800/80 border-emerald-500/40 text-stone-100 shadow-lg" 
                    : "bg-stone-950 border-stone-850 hover:border-stone-800 text-stone-400"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-extrabold truncate max-w-[180px] text-stone-200 group-hover:text-stone-100">
                    {proj.name}
                  </span>
                  {proj.status === "IN_PROGRESS" && (
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping absolute top-4 right-4" />
                  )}
                </div>
                
                <span className="text-[10px] text-stone-500 line-clamp-1">{proj.address}</span>
                
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-stone-800/40 mt-1">
                  <span className="text-stone-500">Chi phí thực tế:</span>
                  <span className="font-mono font-bold text-stone-300">
                    {proj.expenses.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Column: Project Work Area Detail */}
      <div className="lg:col-span-8 bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-xl min-h-[65vh] flex flex-col justify-between">
        {activeProject ? (
          <div className="space-y-6">
            
            {/* Top Info Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-800">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-base font-black text-stone-100">{activeProject.name}</h2>
                  {getStatusBadge(activeProject.status)}
                </div>
                <p className="text-xs text-stone-500 mt-1">Khách hàng thầu: <strong className="text-stone-300">{activeProject.customerName}</strong> • Địa chỉ: <span className="text-stone-400">{activeProject.address}</span></p>
              </div>

              {/* Status Actions */}
              <div className="flex items-center gap-1.5 bg-stone-950/60 p-1 rounded-xl border border-stone-850 self-start sm:self-auto">
                <button
                  onClick={() => handleUpdateStatus("IN_PROGRESS")}
                  disabled={activeProject.status === "IN_PROGRESS"}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    activeProject.status === "IN_PROGRESS" 
                      ? "bg-blue-500/10 text-blue-400" 
                      : "text-stone-500 hover:text-stone-300"
                  }`}
                >
                  Thi công
                </button>
                <button
                  onClick={() => handleUpdateStatus("PAUSED")}
                  disabled={activeProject.status === "PAUSED"}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    activeProject.status === "PAUSED" 
                      ? "bg-amber-500/10 text-amber-400" 
                      : "text-stone-500 hover:text-stone-300"
                  }`}
                >
                  Tạm dừng
                </button>
                <button
                  onClick={() => handleUpdateStatus("COMPLETED")}
                  disabled={activeProject.status === "COMPLETED"}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    activeProject.status === "COMPLETED" 
                      ? "bg-emerald-500/10 text-emerald-400" 
                      : "text-stone-500 hover:text-stone-300"
                  }`}
                >
                  Hoàn thành
                </button>
              </div>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-stone-950/40 border border-stone-850 p-4 rounded-2xl">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block">Ngân Sách Hợp Đồng</span>
                <span className="text-lg font-mono font-black text-stone-200 block mt-1">{activeProject.budget.toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="bg-stone-950/40 border border-stone-850 p-4 rounded-2xl">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block">Chi Phí Đã Xuất</span>
                <span className="text-lg font-mono font-black text-amber-400 block mt-1">{activeProject.expenses.toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="bg-stone-950/40 border border-stone-850 p-4 rounded-2xl">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block">Lợi Nhuận Dự Kiến</span>
                <span className={`text-lg font-mono font-black block mt-1 ${activeProject.budget - activeProject.expenses >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {(activeProject.budget - activeProject.expenses).toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>

            {/* Material & Crew Sections (Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* Materials List */}
              <div className="space-y-3 bg-stone-950/30 border border-stone-850 p-4 rounded-2xl">
                <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                  <h4 className="text-xs font-extrabold text-stone-300 flex items-center gap-1.5">
                    <Box className="h-4 w-4 text-emerald-500" />
                    <span>Danh Sách Vật Tư Đã Xuất</span>
                  </h4>
                  <button
                    onClick={() => {
                      if (products.length === 0) {
                        alert("Không có sản phẩm nào trong kho để chọn!");
                        return;
                      }
                      setSelectedProductId(products[0].id);
                      setShowAddMaterialModal(true);
                    }}
                    className="p-1 rounded bg-stone-800 hover:bg-stone-750 text-emerald-400 text-xs flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold pr-1">Xuất kho</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-[25vh] overflow-y-auto pr-1">
                  {activeProject.materials.length === 0 ? (
                    <p className="text-[11px] text-stone-500 text-center py-6">Chưa xuất vật tư nào từ kho cho công trình này.</p>
                  ) : (
                    activeProject.materials.map((mat, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-stone-900 border border-stone-850 text-xs">
                        <div>
                          <p className="font-bold text-stone-300">{mat.productName}</p>
                          <span className="text-[10px] text-stone-500">Số lượng: {mat.quantity} {mat.unit} • Đơn giá vốn: {mat.costPrice.toLocaleString("vi-VN")}đ</span>
                        </div>
                        <span className="font-mono font-bold text-stone-400">{(mat.quantity * mat.costPrice).toLocaleString("vi-VN")}đ</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Crew / Labor List */}
              <div className="space-y-3 bg-stone-950/30 border border-stone-850 p-4 rounded-2xl">
                <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                  <h4 className="text-xs font-extrabold text-stone-300 flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>Đội Thợ Thi Công</span>
                  </h4>
                  <button
                    onClick={() => setShowAddCrewModal(true)}
                    className="p-1 rounded bg-stone-800 hover:bg-stone-750 text-blue-400 text-xs flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold pr-1">Thêm thợ</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-[25vh] overflow-y-auto pr-1">
                  {activeProject.staff.length === 0 ? (
                    <p className="text-[11px] text-stone-500 text-center py-6">Chưa phân công nhân sự thi công công trình này.</p>
                  ) : (
                    activeProject.staff.map((stf) => (
                      <div key={stf.staffId} className="flex items-center justify-between p-2 rounded-xl bg-stone-900 border border-stone-850 text-xs">
                        <div>
                          <p className="font-bold text-stone-300">{stf.staffName}</p>
                          <span className="text-[10px] text-stone-500">Vai trò: {stf.role}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-stone-400">{stf.wage.toLocaleString("vi-VN")}đ</span>
                          <span className="text-[9px] text-stone-500 block">/Ngày công</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Notes / Instructions */}
            <div className="p-4 rounded-2xl bg-stone-950/40 border border-stone-850 text-xs text-stone-400">
              <span className="font-bold text-stone-300 block mb-1">Ghi chú & Nhật ký tiến độ:</span>
              <p className="leading-relaxed font-serif italic">{activeProject.notes || "Chưa có ghi chú cụ thể."}</p>
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center text-stone-500">
            <HardHat className="h-12 w-12 text-stone-600 mb-2" />
            <p className="text-xs">Vui lòng chọn hoặc khởi tạo một công trình thạch cao / gỗ nhựa để xem chi tiết thi công.</p>
          </div>
        )}

        <div className="text-[10px] text-stone-500 text-right pt-4 border-t border-stone-800 mt-6">
          * Khi xuất vật tư sang công trình, hệ thống tự trừ tồn kho tương ứng và tính vào giá trị dự án.
        </div>
      </div>

      {/* Modal: Add Project */}
      {showAddProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="text-sm font-black text-stone-100 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-emerald-400" />
                <span>Khởi Tạo Dự Án Thi Công Mới</span>
              </h3>
              <button onClick={() => setShowAddProjectModal(false)} className="text-stone-500 hover:text-stone-300">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Tên dự án / Công trình thi công</label>
                <input
                  type="text"
                  required
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-100 focus:outline-none focus:border-emerald-500"
                  placeholder="Ví dụ: Thi công Biệt thự Anh Hùng..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Địa chỉ thi công</label>
                <input
                  type="text"
                  required
                  value={projAddress}
                  onChange={(e) => setProjAddress(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-100 focus:outline-none focus:border-emerald-500"
                  placeholder="Nhập địa điểm công trình..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Chủ đầu tư / Đối tác thầu</label>
                <select
                  value={projCustomerId}
                  onChange={(e) => setProjCustomerId(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Không liên kết / Khách vãng lai --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Ngân sách hợp đồng nhận thầu (VND)</label>
                <input
                  type="number"
                  required
                  value={projBudget}
                  onChange={(e) => setProjBudget(Number(e.target.value))}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Yêu cầu & Ghi chú bổ sung</label>
                <textarea
                  rows={2}
                  value={projNotes}
                  onChange={(e) => setProjNotes(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-emerald-500"
                  placeholder="Ghi chú về thạch cao Gyproc tiêu chuẩn, khoảng cách đi xương..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  className="flex-1 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200 font-bold transition-all"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black uppercase tracking-wider transition-all"
                >
                  Khởi Tạo Dự Án
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Export Material to Project */}
      {showAddMaterialModal && activeProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="text-sm font-black text-stone-100 flex items-center gap-2">
                <Box className="h-5 w-5 text-emerald-400" />
                <span>Xuất Kho Vật Tư Công Trình</span>
              </h3>
              <button onClick={() => setShowAddMaterialModal(false)} className="text-stone-500 hover:text-stone-300">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddMaterial} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Vật tư trong kho</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-emerald-500"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Tồn: {p.stock} {p.unit || "Tấm"})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Số lượng xuất sang công trình</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={materialQty}
                  onChange={(e) => setMaterialQty(Number(e.target.value))}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-850 space-y-1 text-[11px] text-stone-400">
                <span className="font-bold text-stone-300 block">Lưu ý nghiệp vụ:</span>
                <p>Hệ thống sẽ lập tức trừ tồn kho của sản phẩm đã chọn khi bạn nhấn Xác nhận xuất kho.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMaterialModal(false)}
                  className="flex-1 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200 font-bold transition-all"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black uppercase tracking-wider transition-all"
                >
                  Xác Nhận Xuất Kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Crew to Project */}
      {showAddCrewModal && activeProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="text-sm font-black text-stone-100 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                <span>Bổ Sung Thợ Thi Công</span>
              </h3>
              <button onClick={() => setShowAddCrewModal(false)} className="text-stone-500 hover:text-stone-300">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddCrew} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Họ tên thợ</label>
                <input
                  type="text"
                  required
                  value={crewName}
                  onChange={(e) => setCrewName(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-100 focus:outline-none focus:border-blue-500"
                  placeholder="Ví dụ: Thợ phụ Nguyễn Văn Bình..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Vai trò thi công</label>
                <select
                  value={crewRole}
                  onChange={(e) => setCrewRole(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="Thợ cả">Thợ cả (Quản lý kỹ thuật)</option>
                  <option value="Thợ chính">Thợ chính (Đứng máy/Đóng tấm)</option>
                  <option value="Thợ phụ">Thợ phụ (Vận chuyển/Bả bột)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Đơn giá ngày công / Ngày (VND)</label>
                <input
                  type="number"
                  required
                  value={crewWage}
                  onChange={(e) => setCrewWage(Number(e.target.value))}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-100 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCrewModal(false)}
                  className="flex-1 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200 font-bold transition-all"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-stone-950 font-black uppercase tracking-wider transition-all"
                >
                  Xác Nhận Thêm Thợ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
