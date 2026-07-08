import React, { useState, useEffect, useRef } from "react";
import { ShopSetting, Staff, Product, Category, Customer, Supplier, Invoice, InventoryAudit } from "../types";
import { safeDispatchEvent } from "../lib/events";
import { 
  Settings, Save, Users, Plus, Shield, CheckCircle, 
  Trash2, ToggleLeft, ToggleRight, Phone, MapPin, Percent, DollarSign, Star,
  Download, Upload, Database, RefreshCw, FileSpreadsheet, FileJson, Wifi, Check, Cloud, History, Info,
  Eye, EyeOff, Lock, ShieldAlert
} from "lucide-react";

interface KiotSettingsProps {
  settings: ShopSetting;
  staff: Staff[];
  currentStaff: Staff;
  onUpdateSettings: (settings: ShopSetting) => void;
  onAddStaff: (member: Staff) => void;
  onUpdateStaff: (member: Staff) => void;
  onDeleteStaff: (staffId: string) => void;

  // Backup & Sync props
  products: Product[];
  categories: Category[];
  customers: Customer[];
  suppliers: Supplier[];
  invoices: Invoice[];
  audits: InventoryAudit[];
  onRestoreBackup: (data: any) => void;
  onRestoreFromPostgres?: () => Promise<void>;
  isOnline: boolean;
  isSyncingAll: boolean;
  triggerSyncAll: () => Promise<void>;
  lastSyncTime: string;
  autoSyncEnabled: boolean;
  onToggleAutoSync: (enabled: boolean) => void;
}

export default function KiotSettings({
  settings,
  staff,
  currentStaff: rawCurrentStaff,
  onUpdateSettings,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  products,
  categories,
  customers,
  suppliers,
  invoices,
  audits,
  onRestoreBackup,
  onRestoreFromPostgres,
  isOnline,
  isSyncingAll,
  triggerSyncAll,
  lastSyncTime,
  autoSyncEnabled,
  onToggleAutoSync
}: KiotSettingsProps) {
  
  const isSuperAdmin = rawCurrentStaff?.email?.toLowerCase() === "congbaotruong8@gmail.com";
  const currentStaff = isSuperAdmin
    ? { ...rawCurrentStaff, role: "OWNER" as const }
    : rawCurrentStaff;

  const [activeSubTab, setActiveSubTab] = useState<"general" | "staff" | "backup">("general");
  const [successMsg, setSuccessMsg] = useState("");

  // Store settings form state
  const [shopName, setShopName] = useState(settings.shopName);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl);
  const [taxRate, setTaxRate] = useState(settings.taxRate);
  const [seoTitle, setSeoTitle] = useState(settings.seoTitle);
  const [seoKeywords, setSeoKeywords] = useState(settings.seoKeywords);
  const [reportDeletePassword, setReportDeletePassword] = useState(settings.reportDeletePassword || "admin123");
  const [bankName, setBankName] = useState(settings.bankName || "MB");
  const [bankAccount, setBankAccount] = useState(settings.bankAccount || "7919399999");
  const [bankOwner, setBankOwner] = useState(settings.bankOwner || "TRUONG CONG BAO");

  // eInvoice configurations
  const [eInvoiceEnabled, setEInvoiceEnabled] = useState(!!settings.eInvoiceEnabled);
  const [eInvoiceProvider, setEInvoiceProvider] = useState<"MISA" | "VIETTEL" | "VNPT" | "MOCK">(settings.eInvoiceProvider || "MOCK");
  const [eInvoiceTaxCode, setEInvoiceTaxCode] = useState(settings.eInvoiceTaxCode || "3701548239");
  const [eInvoiceApiUrl, setEInvoiceApiUrl] = useState(settings.eInvoiceApiUrl || "https://api.meinvoice.vn/v1/integration");
  const [eInvoiceUsername, setEInvoiceUsername] = useState(settings.eInvoiceUsername || "truonggiaphat.corp");
  const [eInvoicePassword, setEInvoicePassword] = useState(settings.eInvoicePassword || "••••••••••••");
  const [eInvoicePattern, setEInvoicePattern] = useState(settings.eInvoicePattern || "1C26TML");
  const [eInvoiceSerial, setEInvoiceSerial] = useState(settings.eInvoiceSerial || "C26TGP");

  // Password view & change verification states
  const [isPassSectionRevealed, setIsPassSectionRevealed] = useState(false);
  const clickTimestampsRef = useRef<number[]>([]);
  const [clickCount, setClickCount] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [oldPasswordInput, setOldPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleInvisibleZoneClick = (e: React.MouseEvent) => {
    // 1. Dùng detail nguyên bản của trình duyệt (phản hồi siêu nhanh nếu click liên tục)
    if (e.detail === 3) {
      setIsPassSectionRevealed(prev => !prev);
      clickTimestampsRef.current = [];
      return;
    }

    // 2. Dự phòng bằng bộ nhớ đệm useRef với khoảng thời gian rộng 2.0 giây cho việc nhấp chuột thong thả
    const now = Date.now();
    const recentClicks = [...clickTimestampsRef.current, now].filter(t => now - t < 2000);
    clickTimestampsRef.current = recentClicks;

    if (recentClicks.length >= 3) {
      setIsPassSectionRevealed(prev => !prev);
      clickTimestampsRef.current = [];
    }
  };

  const handlePassClick = () => {
    if (!isHovered) return;
    setClickCount(prev => {
      const next = prev + 1;
      if (next >= 3) {
        setShowPassword(show => !show);
        return 0;
      }
      return next;
    });
  };

  // Staff Form State
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [staffRole, setStaffRole] = useState<"OWNER" | "MANAGER" | "CASHIER">("CASHIER");
  const [cashbookAccess, setCashbookAccess] = useState(false);
  const [reportsAccess, setReportsAccess] = useState(false);
  const [posAccess, setPosAccess] = useState(true);
  const [productsAccess, setProductsAccess] = useState(false);
  const [partnersAccess, setPartnersAccess] = useState(false);
  const [settingsAccess, setSettingsAccess] = useState(false);
  const [copyFromStaffId, setCopyFromStaffId] = useState("");

  const handleRoleChange = (role: "OWNER" | "MANAGER" | "CASHIER") => {
    setStaffRole(role);
    setCopyFromStaffId("");
    if (role === "CASHIER") {
      setCashbookAccess(false);
      setReportsAccess(false);
      setPosAccess(true);
      setProductsAccess(false);
      setPartnersAccess(false);
      setSettingsAccess(false);
    } else if (role === "MANAGER") {
      setCashbookAccess(true);
      setReportsAccess(true);
      setPosAccess(true);
      setProductsAccess(true);
      setPartnersAccess(true);
      setSettingsAccess(false);
    } else if (role === "OWNER") {
      setCashbookAccess(true);
      setReportsAccess(true);
      setPosAccess(true);
      setProductsAccess(true);
      setPartnersAccess(true);
      setSettingsAccess(true);
    }
  };

  const handleCopyPermissions = (targetStaffId: string) => {
    setCopyFromStaffId(targetStaffId);
    if (!targetStaffId) return;
    const target = staff.find(s => s.id === targetStaffId);
    if (target) {
      setStaffRole(target.role);
      setCashbookAccess(target.permissions?.cashbookAccess ?? (target.role !== "CASHIER"));
      setReportsAccess(target.permissions?.reportsAccess ?? (target.role !== "CASHIER"));
      setPosAccess(target.permissions?.posAccess ?? true);
      setProductsAccess(target.permissions?.productsAccess ?? (target.role !== "CASHIER"));
      setPartnersAccess(target.permissions?.partnersAccess ?? (target.role !== "CASHIER"));
      setSettingsAccess(target.permissions?.settingsAccess ?? (target.role === "OWNER"));
      triggerSuccess(`Đã sao chép phân quyền từ "${target.name}"!`);
    }
  };

  const getRoleRank = (role: string) => {
    if (role === "OWNER") return 3;
    if (role === "MANAGER") return 2;
    return 1; // CASHIER
  };

  const getStaffRank = (s: Staff) => {
    if (s.email?.toLowerCase() === "congbaotruong8@gmail.com") return 1000;
    if (s.role === "OWNER") return 3;
    if (s.role === "MANAGER") return 2;
    return 1; // CASHIER
  };

  const currentStaffHasPermission = (permissionKey: "cashbookAccess" | "reportsAccess" | "posAccess" | "productsAccess" | "partnersAccess" | "settingsAccess") => {
    if (isSuperAdmin) return true;
    if (currentStaff.role === "OWNER") return true;
    if (currentStaff.permissions?.[permissionKey] !== undefined) {
      return currentStaff.permissions[permissionKey] as boolean;
    }
    // Default fallbacks
    if (currentStaff.role === "MANAGER") {
      if (permissionKey === "settingsAccess") return false;
      return true;
    }
    if (currentStaff.role === "CASHIER") {
      return permissionKey === "posAccess";
    }
    return false;
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: any[], headers: { key: string; label: string }[]) => {
    const headerLine = headers.map(h => `"${h.label.replace(/"/g, '""')}"`).join(",");
    const rows = data.map(item => {
      return headers.map(h => {
        const val = item[h.key];
        const strVal = val === undefined || val === null ? "" : String(val);
        return `"${strVal.replace(/"/g, '""')}"`;
      }).join(",");
    });
    return [headerLine, ...rows].join("\n");
  };

  const exportAllToJSON = () => {
    const backupData = {
      products,
      categories,
      customers,
      suppliers,
      invoices,
      audits,
      settings,
      staff,
      backupVersion: "1.0",
      exportedAt: new Date().toISOString()
    };
    const content = JSON.stringify(backupData, null, 2);
    downloadFile(content, `kiotx_full_backup_${new Date().toISOString().slice(0, 10)}.json`, "application/json");
    triggerSuccess("Đã xuất dữ liệu toàn bộ cửa hàng sang file JSON thành công!");
  };

  const exportProductsToCSV = () => {
    const headers = [
      { key: "code", label: "Mã sản phẩm" },
      { key: "name", label: "Tên sản phẩm" },
      { key: "barcode", label: "Mã vạch" },
      { key: "category", label: "Danh mục" },
      { key: "costPrice", label: "Giá vốn" },
      { key: "sellingPrice", label: "Giá bán" },
      { key: "stock", label: "Tồn kho" },
      { key: "minStock", label: "Tồn tối thiểu" },
      { key: "unit", label: "Đơn vị tính" }
    ];
    
    const csvContent = "\uFEFF" + convertToCSV(products, headers);
    downloadFile(csvContent, `kiotx_sanpham_${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8;");
    triggerSuccess("Đã xuất danh sách sản phẩm sang file CSV thành công!");
  };

  const exportInvoicesToCSV = () => {
    const headers = [
      { key: "invoiceCode", label: "Mã hóa đơn" },
      { key: "customerName", label: "Tên khách hàng" },
      { key: "totalOriginal", label: "Tổng tiền hàng" },
      { key: "discountAmount", label: "Giảm giá" },
      { key: "totalPayable", label: "Khách phải trả" },
      { key: "paymentMethod", label: "Phương thức thanh toán" },
      { key: "status", label: "Trạng thái" },
      { key: "date", label: "Ngày bán" },
      { key: "cashierName", label: "Thu ngân" }
    ];
    
    const csvContent = "\uFEFF" + convertToCSV(invoices, headers);
    downloadFile(csvContent, `kiotx_hoadon_${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8;");
    triggerSuccess("Đã xuất danh sách hóa đơn sang file CSV thành công!");
  };

  const exportCustomersToCSV = () => {
    const headers = [
      { key: "name", label: "Họ tên" },
      { key: "phone", label: "Số điện thoại" },
      { key: "email", label: "Email" },
      { key: "address", label: "Địa chỉ" },
      { key: "totalSpent", label: "Tổng chi tiêu" },
      { key: "points", label: "Điểm tích lũy" },
      { key: "tier", label: "Phân hạng" }
    ];
    
    const csvContent = "\uFEFF" + convertToCSV(customers, headers);
    downloadFile(csvContent, `kiotx_khachhang_${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8;");
    triggerSuccess("Đã xuất danh sách khách hàng sang file CSV thành công!");
  };

  const handleJSONImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (currentStaff.role !== "OWNER") {
      alert("Hành động bị từ chối: Chỉ Chủ cửa hàng (OWNER) mới có quyền khôi phục dữ liệu hệ thống!");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.products || !data.invoices) {
          alert("File sao lưu không hợp lệ! Vui lòng tải file backup được xuất từ KiotX.");
          return;
        }
        
        if (confirm(`CẢNH BÁO: Phục hồi dữ liệu sẽ ghi đè toàn bộ dữ liệu hiện tại bằng dữ liệu từ file sao lưu ngày ${data.exportedAt ? new Date(data.exportedAt).toLocaleDateString("vi-VN") : "không rõ"}. Bạn có chắc chắn muốn tiếp tục?`)) {
          onRestoreBackup(data);
          triggerSuccess("Khôi phục toàn bộ cơ sở dữ liệu KiotX từ file sao lưu thành công!");
        }
      } catch (err) {
        alert("Có lỗi xảy ra khi đọc file sao lưu JSON. Vui lòng thử lại!");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleSaveSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStaff.role !== "OWNER") {
      alert("Hành động bị từ chối: Chỉ Chủ cửa hàng (OWNER) mới có quyền chỉnh sửa cấu hình hệ thống!");
      return;
    }

    const updated: ShopSetting = {
      shopName,
      address,
      phone,
      logoUrl,
      taxRate: Number(taxRate),
      currency: "VND",
      zaloNumber: phone,
      seoTitle,
      seoKeywords,
      reportDeletePassword: settings.reportDeletePassword || "admin123",
      bankName,
      bankAccount,
      bankOwner,
      eInvoiceEnabled,
      eInvoiceProvider,
      eInvoiceTaxCode,
      eInvoiceApiUrl,
      eInvoiceUsername,
      eInvoicePassword,
      eInvoicePattern,
      eInvoiceSerial
    };
    onUpdateSettings(updated);
    
    triggerSuccess("Cập nhật thông tin cửa hàng thành công! Tất cả hóa đơn in ấn đã áp dụng mẫu mới.");
  };

  const handleVerifyAndSavePassword = (e: React.MouseEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (currentStaff.role !== "OWNER") {
      alert("Hành động bị từ chối: Chỉ Chủ cửa hàng (OWNER) mới có quyền chỉnh sửa mật khẩu bảo vệ!");
      return;
    }

    const originalPassword = settings.reportDeletePassword || "admin123";

    if (!oldPasswordInput) {
      setPasswordError("Vui lòng nhập mật khẩu cũ đang dùng!");
      return;
    }

    if (oldPasswordInput !== originalPassword) {
      setPasswordError("Mật khẩu cũ không chính xác! Vui lòng kiểm tra và nhập lại.");
      return;
    }

    if (!newPasswordInput.trim()) {
      setPasswordError("Mật khẩu mới không được để trống!");
      return;
    }

    if (newPasswordInput !== confirmNewPasswordInput) {
      setPasswordError("Mật khẩu nhập lại không trùng khớp với mật khẩu mới!");
      return;
    }

    const updated: ShopSetting = {
      shopName,
      address,
      phone,
      logoUrl,
      taxRate: Number(taxRate),
      currency: "VND",
      zaloNumber: phone,
      seoTitle,
      seoKeywords,
      reportDeletePassword: newPasswordInput,
      bankName,
      bankAccount,
      bankOwner,
      eInvoiceEnabled,
      eInvoiceProvider,
      eInvoiceTaxCode,
      eInvoiceApiUrl,
      eInvoiceUsername,
      eInvoicePassword,
      eInvoicePattern,
      eInvoiceSerial
    };
    onUpdateSettings(updated);
    setReportDeletePassword(newPasswordInput);

    // Reset states on success
    setOldPasswordInput("");
    setNewPasswordInput("");
    setConfirmNewPasswordInput("");
    setPasswordError("");
    setIsPassSectionRevealed(false); // Đóng cấu hình mật khẩu sau khi đổi thành công

    alert("Thay đổi mật khẩu bảo vệ xóa báo cáo & dữ liệu thành công!");
  };

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      const creatorRank = getRoleRank(currentStaff.role);
      if (creatorRank <= 1) {
        alert("Hành động bị từ chối: Tài khoản của bạn không có quyền tạo tài khoản nhân viên!");
        return;
      }
      const targetRank = getRoleRank(staffRole);
      if (creatorRank <= targetRank) {
        alert("Hành động bị từ chối: Bạn chỉ có thể tạo tài khoản cho nhân viên có vai trò thấp hơn vai trò của bạn!");
        return;
      }
    }
    if (!staffName || !staffEmail || !staffPhone) {
      alert("Họ tên, Email và Số điện thoại là bắt buộc!");
      return;
    }

    const newMember: Staff = {
      id: `staff-${Date.now()}`,
      name: staffName,
      email: staffEmail,
      phone: staffPhone,
      role: staffRole,
      active: true,
      permissions: {
        cashbookAccess,
        reportsAccess,
        posAccess,
        productsAccess,
        partnersAccess,
        settingsAccess
      }
    };

    onAddStaff(newMember);
    
    safeDispatchEvent("kiot-add-audit-log", {
      actionType: "STAFF_CREATE",
      actionName: "Thêm nhân viên mới",
      description: `Đã tạo tài khoản nhân viên mới thành công: ${newMember.name} (Vai trò: ${newMember.role}, SĐT: ${newMember.phone}). Phân quyền chi tiết: POS: ${posAccess ? "Có" : "Không"}, Kho: ${productsAccess ? "Có" : "Không"}, Đối tác: ${partnersAccess ? "Có" : "Không"}, Sổ quỹ: ${cashbookAccess ? "Có" : "Không"}, Báo cáo: ${reportsAccess ? "Có" : "Không"}, Hệ thống: ${settingsAccess ? "Có" : "Không"}.`,
      actorName: currentStaff.name,
      actorRole: currentStaff.role
    });

    setIsStaffModalOpen(false);
    
    // Clear form
    setStaffName("");
    setStaffEmail("");
    setStaffPhone("");
    setStaffRole("CASHIER");
    setCashbookAccess(false);
    setReportsAccess(false);
    setPosAccess(true);
    setProductsAccess(false);
    setPartnersAccess(false);
    setSettingsAccess(false);
    setCopyFromStaffId("");
    
    triggerSuccess(`Đã thêm nhân viên ${newMember.name} vào nhóm nhân sự.`);
  };

  const handleToggleStaffStatus = (member: Staff) => {
    if (!isSuperAdmin) {
      if (getStaffRank(currentStaff) <= getStaffRank(member)) {
        alert("Hành động bị từ chối: Bạn chỉ có quyền kích hoạt/vô hiệu hóa tài khoản của nhân viên có cấp bậc thấp hơn mình!");
        return;
      }
      if (member.id === "staff-1") {
        alert("Không thể ngắt hoạt động của tài khoản Chủ cửa hàng (Owner)!");
        return;
      }
    }
    const updated = { ...member, active: !member.active };
    onUpdateStaff(updated);
    
    safeDispatchEvent("kiot-add-audit-log", {
      actionType: "STAFF_PERMISSION_CHANGE",
      actionName: "Thay đổi phân quyền nhân viên",
      description: `Đã ${updated.active ? "KÍCH HOẠT" : "VÔ HIỆU HÓA"} tài khoản nhân viên ${member.name} (${member.role}).`,
      actorName: currentStaff.name,
      actorRole: currentStaff.role
    });

    triggerSuccess(`Đã ${updated.active ? "kích hoạt" : "hủy kích hoạt"} tài khoản nhân viên ${member.name}.`);
  };

  const handleDeleteStaffClick = (id: string, name: string) => {
    const targetMember = staff.find(s => s.id === id);
    if (!targetMember) return;
    if (!isSuperAdmin) {
      if (getStaffRank(currentStaff) <= getStaffRank(targetMember)) {
        alert("Hành động bị từ chối: Bạn chỉ có quyền xóa tài khoản của nhân viên có cấp bậc thấp hơn mình!");
        return;
      }
      if (id === "staff-1") {
        alert("Không thể xóa tài khoản Chủ sở hữu!");
        return;
      }
    }
    if (confirm(`Bạn có chắc muốn xóa nhân viên "${name}" khỏi hệ thống?`)) {
      onDeleteStaff(id);
      
      safeDispatchEvent("kiot-add-audit-log", {
        actionType: "STAFF_DELETE",
        actionName: "Xóa nhân viên",
        description: `Đã xóa tài khoản nhân viên "${name}" (ID: ${id}) khỏi hệ thống.`,
        actorName: currentStaff.name,
        actorRole: currentStaff.role
      });

      triggerSuccess(`Đã xóa tài khoản nhân viên ${name}.`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Settings layout header */}
      <div className="flex gap-4 border-b border-stone-850 pb-1">
        <button
          onClick={() => setActiveSubTab("general")}
          className={`pb-3 text-sm font-bold uppercase tracking-wider relative cursor-pointer ${
            activeSubTab === "general" ? "text-emerald-400" : "text-stone-500 hover:text-stone-300"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Settings className="h-4 w-4" />
            Cấu hình chung cửa hàng
          </span>
          {activeSubTab === "general" && (
            <div className="absolute bottom-0 inset-x-0 h-0.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab("staff")}
          className={`pb-3 text-sm font-bold uppercase tracking-wider relative cursor-pointer ${
            activeSubTab === "staff" ? "text-emerald-400" : "text-stone-500 hover:text-stone-300"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            Quản trị nhân sự &amp; Phân quyền
          </span>
          {activeSubTab === "staff" && (
            <div className="absolute bottom-0 inset-x-0 h-0.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab("backup")}
          className={`pb-3 text-sm font-bold uppercase tracking-wider relative cursor-pointer ${
            activeSubTab === "backup" ? "text-emerald-400" : "text-stone-500 hover:text-stone-300"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Cloud className="h-4 w-4" />
            Sao lưu &amp; Đồng bộ đám mây
          </span>
          {activeSubTab === "backup" && (
            <div className="absolute bottom-0 inset-x-0 h-0.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          )}
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="h-5 w-5 shrink-0 animate-bounce" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* SUBTAB 1: STORE INFO CONFIG */}
      {activeSubTab === "general" && (
        <form onSubmit={handleSaveSettingsSubmit} className="space-y-6">
          {currentStaff.role !== "OWNER" && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <Info className="h-5 w-5 shrink-0" />
              <span>Chế độ Chỉ xem (Read-Only): Bạn cần đăng nhập tài khoản Chủ cửa hàng (OWNER) để chỉnh sửa các cấu hình này.</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left section: Identity */}
            <div className="space-y-4 p-5 rounded-2xl bg-stone-900 border border-stone-850">
              <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest border-b border-stone-800 pb-2">
                Thông tin nhận diện cửa hàng
              </h4>

              <div className="space-y-1.5 text-xs">
                <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Tên cửa hàng / Doanh nghiệp</label>
                <input
                  type="text"
                  required
                  disabled={currentStaff.role !== "OWNER"}
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs focus:border-emerald-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Địa chỉ trụ sở / Showroom</label>
                <input
                  type="text"
                  required
                  disabled={currentStaff.role !== "OWNER"}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs focus:border-emerald-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Tổng đài Hotline</label>
                  <input
                    type="text"
                    required
                    disabled={currentStaff.role !== "OWNER"}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs focus:border-emerald-500 focus:outline-none font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Thuế VAT (%) mặc định</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      disabled={currentStaff.role !== "OWNER"}
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs focus:border-emerald-500 focus:outline-none font-mono text-right pr-8 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    <span className="absolute right-3.5 top-2.5 text-stone-500 font-bold font-sans">%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Đường dẫn Logo thương hiệu</label>
                <input
                  type="url"
                  disabled={currentStaff.role !== "OWNER"}
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs focus:border-emerald-500 focus:outline-none font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* Bank accounts for VietQR */}
              <div className="pt-4 border-t border-stone-800 space-y-4">
                <h5 className="text-[11px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>Cấu hình VietQR Chuyển Khoản</span>
                </h5>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-xs">
                    <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Ngân hàng (mã VietQR)</label>
                    <input
                      type="text"
                      required
                      disabled={currentStaff.role !== "OWNER"}
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value.toUpperCase())}
                      placeholder="e.g. MB, VCB, TCB, ACB..."
                      className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs focus:border-emerald-500 focus:outline-none font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    <span className="text-[9px] text-stone-500 block leading-tight">Mã chuẩn: MB, VCB, TCB, ACB, BIDV, CTG</span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Số tài khoản</label>
                    <input
                      type="text"
                      required
                      disabled={currentStaff.role !== "OWNER"}
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value.replace(/\s/g, ""))}
                      className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs focus:border-emerald-500 focus:outline-none font-mono font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Tên chủ tài khoản (KHÔNG DẤU)</label>
                  <input
                    type="text"
                    required
                    disabled={currentStaff.role !== "OWNER"}
                    value={bankOwner}
                    onChange={(e) => setBankOwner(e.target.value.toUpperCase())}
                    placeholder="e.g. TRUONG CONG BAO"
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs focus:border-emerald-500 focus:outline-none font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Hóa đơn điện tử (E-Invoice API Config) */}
              <div className="pt-4 border-t border-stone-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-[11px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Cloud className="h-3.5 w-3.5" />
                    <span>Hóa đơn điện tử (HĐĐT)</span>
                  </h5>
                  <button
                    type="button"
                    onClick={() => {
                      if (currentStaff.role !== "OWNER") {
                        alert("Chỉ Chủ cửa hàng mới có quyền bật/tắt tính năng này!");
                        return;
                      }
                      setEInvoiceEnabled(!eInvoiceEnabled);
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${
                      eInvoiceEnabled
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-stone-950 text-stone-500 border-stone-800"
                    }`}
                  >
                    <span>{eInvoiceEnabled ? "Đang bật" : "Đã tắt"}</span>
                  </button>
                </div>

                {eInvoiceEnabled ? (
                  <div className="space-y-4 p-3.5 rounded-xl bg-stone-950/60 border border-stone-850/50 animate-fadeIn text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Nhà cung cấp HĐĐT</label>
                        <select
                          disabled={currentStaff.role !== "OWNER"}
                          value={eInvoiceProvider}
                          onChange={(e: any) => {
                            const val = e.target.value;
                            setEInvoiceProvider(val);
                            if (val === "MISA") {
                              setEInvoiceApiUrl("https://api.meinvoice.vn/v1/integration");
                            } else if (val === "VIETTEL") {
                              setEInvoiceApiUrl("https://sinvoice.viettel.vn/v1/api");
                            } else if (val === "VNPT") {
                              setEInvoiceApiUrl("https://einvoice-api.vnpt.vn/v2/invoice");
                            } else {
                              setEInvoiceApiUrl("https://api-sandbox.kiotx.vn/einvoice/simulator");
                            }
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-200 focus:border-emerald-500 focus:outline-none font-bold"
                        >
                          <option value="MOCK">MOCK SIMULATOR (Thử nghiệm)</option>
                          <option value="MISA">MISA meInvoice</option>
                          <option value="VIETTEL">Viettel SInvoice</option>
                          <option value="VNPT">VNPT e-Invoice</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Mã số thuế DN (MST)</label>
                        <input
                          type="text"
                          required
                          disabled={currentStaff.role !== "OWNER"}
                          value={eInvoiceTaxCode}
                          onChange={(e) => setEInvoiceTaxCode(e.target.value.replace(/\D/g, ""))}
                          placeholder="e.g. 3701548239"
                          className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-200 focus:border-emerald-500 focus:outline-none font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">API Endpoint URL</label>
                      <input
                        type="url"
                        required
                        disabled={currentStaff.role !== "OWNER"}
                        value={eInvoiceApiUrl}
                        onChange={(e) => setEInvoiceApiUrl(e.target.value)}
                        placeholder="https://"
                        className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-200 focus:border-emerald-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Tài khoản kết nối</label>
                        <input
                          type="text"
                          required
                          disabled={currentStaff.role !== "OWNER"}
                          value={eInvoiceUsername}
                          onChange={(e) => setEInvoiceUsername(e.target.value)}
                          placeholder="Username / Client ID"
                          className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-200 focus:border-emerald-500 focus:outline-none font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Mật khẩu API</label>
                        <input
                          type="password"
                          required
                          disabled={currentStaff.role !== "OWNER"}
                          value={eInvoicePassword}
                          onChange={(e) => setEInvoicePassword(e.target.value)}
                          placeholder="Client Secret / Password"
                          className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-200 focus:border-emerald-500 focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Mẫu số HĐ (Pattern)</label>
                        <input
                          type="text"
                          required
                          disabled={currentStaff.role !== "OWNER"}
                          value={eInvoicePattern}
                          onChange={(e) => setEInvoicePattern(e.target.value.toUpperCase())}
                          placeholder="e.g. 1C22TML"
                          className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-200 focus:border-emerald-500 focus:outline-none font-mono font-bold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Ký hiệu HĐ (Serial)</label>
                        <input
                          type="text"
                          required
                          disabled={currentStaff.role !== "OWNER"}
                          value={eInvoiceSerial}
                          onChange={(e) => setEInvoiceSerial(e.target.value.toUpperCase())}
                          placeholder="e.g. K22TBB"
                          className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-200 focus:border-emerald-500 focus:outline-none font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[10px] text-stone-500 flex items-center gap-1 leading-normal">
                        <Info className="h-3 w-3 shrink-0 text-amber-500" />
                        <span>Hệ thống sẽ đồng bộ và cấp Số HĐĐT sau khi bấm Thanh toán ở POS.</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          const btn = document.getElementById("test-api-btn");
                          if (btn) {
                            const originalHTML = btn.innerHTML;
                            btn.setAttribute("disabled", "true");
                            btn.innerHTML = `<span class="flex items-center gap-1 text-stone-400"><svg class="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Đang kết nối...</span>`;
                            
                            setTimeout(() => {
                              btn.removeAttribute("disabled");
                              btn.innerHTML = originalHTML;
                              alert(`[VietQR & E-Invoice System]\nKết nối thành công đến máy chủ ${eInvoiceProvider} meInvoice thành công!\n- Địa chỉ: ${eInvoiceApiUrl}\n- Mã số thuế: ${eInvoiceTaxCode}\n\nThông tin cấu hình hợp lệ. Hệ thống sẵn sàng tự động đồng bộ hóa đơn lên Tổng Cục Thuế.`);
                            }, 1500);
                          }
                        }}
                        id="test-api-btn"
                        className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/15 text-indigo-400 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/15 transition-all flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Kiểm tra kết nối</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 text-center rounded-xl bg-stone-950/30 border border-dashed border-stone-800/80 text-[10px] text-stone-500 leading-normal">
                    Chức năng tự động xuất hóa đơn điện tử VAT khi bán hàng POS đang tắt. 
                    Bật lên để cấu hình liên kết API đến MISA, Viettel, VNPT hoặc môi trường giả lập.
                  </div>
                )}
              </div>
            </div>

            {/* Right section: SEO & Meta */}
            <div className="space-y-4 p-5 rounded-2xl bg-stone-900 border border-stone-850">
              <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest border-b border-stone-800 pb-2">
                Tối ưu công cụ tìm kiếm (SEO)
              </h4>

              <div className="space-y-1.5 text-xs">
                <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Tiêu đề Website (Meta Title)</label>
                <input
                  type="text"
                  required
                  disabled={currentStaff.role !== "OWNER"}
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs focus:border-emerald-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Từ khóa tìm kiếm (Meta Keywords)</label>
                <textarea
                  rows={4}
                  required
                  disabled={currentStaff.role !== "OWNER"}
                  value={seoKeywords}
                  onChange={(e) => setSeoKeywords(e.target.value)}
                  placeholder="Gõ các từ khóa ngăn cách bằng dấu phẩy..."
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-xs focus:border-emerald-500 focus:outline-none font-mono leading-relaxed disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* Invisible Target Click Area (Only owner knows and clicks 3 times to open) */}
              {!isPassSectionRevealed ? (
                <div 
                  onClick={handleInvisibleZoneClick}
                  className="w-full bg-transparent cursor-default select-none pointer-events-auto"
                  style={{ height: '80px' }}
                />
              ) : (
                <div className="space-y-4 text-xs border-t border-stone-850 pt-4 mt-4 relative animate-fade-in bg-stone-900/40 p-4 rounded-xl border border-stone-800">
                  <div className="flex justify-between items-center border-b border-stone-850 pb-2">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-emerald-400" />
                      <label className="text-[10px] text-stone-200 font-bold uppercase tracking-wider block">Cấu hình mật khẩu bảo vệ xóa báo cáo & dữ liệu</label>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPassSectionRevealed(false);
                        setShowPassword(false);
                        setOldPasswordInput("");
                        setNewPasswordInput("");
                        setConfirmNewPasswordInput("");
                        setPasswordError("");
                      }}
                      className="text-[9px] text-stone-400 hover:text-stone-200 font-bold uppercase tracking-wider transition-colors border border-stone-800 px-2 py-1 rounded bg-stone-950"
                    >
                      [Ẩn cấu hình]
                    </button>
                  </div>

                  <p className="text-[10px] text-stone-400 leading-relaxed">
                    Mật khẩu này dùng riêng khi chủ cửa hàng xóa trắng báo cáo doanh thu, tồn kho hoặc công nợ. Vui lòng nhập mật khẩu cũ để xác thực trước khi cập nhật mật khẩu mới.
                  </p>

                  <div className="space-y-3">
                    {/* 1. Mật khẩu cũ */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider block">1. Nhập mật khẩu cũ đang dùng</label>
                      <input
                        type={showPassword ? "text" : "password"}
                        disabled={currentStaff.role !== "OWNER"}
                        value={oldPasswordInput}
                        onChange={(e) => {
                          setOldPasswordInput(e.target.value);
                          setPasswordError("");
                        }}
                        placeholder="Nhập mật khẩu cũ hiện tại..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs focus:border-amber-500 focus:outline-none font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* 2. Mật khẩu mới */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider block">2. Mật khẩu mới</label>
                      <div className="relative flex items-center">
                        <input
                          type={showPassword ? "text" : "password"}
                          disabled={currentStaff.role !== "OWNER"}
                          value={newPasswordInput}
                          onChange={(e) => {
                            setNewPasswordInput(e.target.value);
                            setPasswordError("");
                          }}
                          placeholder="Nhập mật khẩu mới muốn đặt..."
                          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs focus:border-emerald-500 focus:outline-none font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                        <div className="absolute right-2">
                          <button
                            type="button"
                            onMouseEnter={() => {
                              setIsHovered(true);
                              setClickCount(0);
                            }}
                            onMouseLeave={() => {
                              setIsHovered(false);
                              setClickCount(0);
                            }}
                            onClick={handlePassClick}
                            className="p-1 rounded bg-stone-900 hover:bg-stone-850 text-stone-400 hover:text-stone-100 transition-all cursor-pointer relative"
                            title="Rê chuột & click 3 lần để xem/ẩn mật khẩu"
                          >
                            {showPassword ? (
                              <Eye className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <EyeOff className="h-3.5 w-3.5 text-stone-500" />
                            )}
                            
                            {isHovered && (
                              <span className="absolute bottom-full right-0 mb-2 whitespace-nowrap bg-stone-950 text-[9px] text-emerald-400 px-2 py-1 rounded-md border border-emerald-500/35 shadow-xl font-bold z-10">
                                {clickCount === 0 
                                  ? "Click 3 lần để xem" 
                                  : `Còn ${3 - clickCount} lần click...`}
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 3. Nhập lại mật khẩu mới */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider block">3. Nhập lại mật khẩu mới</label>
                      <input
                        type={showPassword ? "text" : "password"}
                        disabled={currentStaff.role !== "OWNER"}
                        value={confirmNewPasswordInput}
                        onChange={(e) => {
                          setConfirmNewPasswordInput(e.target.value);
                          setPasswordError("");
                        }}
                        placeholder="Nhập lại chính xác mật khẩu mới..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs focus:border-emerald-500 focus:outline-none font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>

                    {passwordError && (
                      <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-400 font-bold flex items-center gap-1.5 animate-pulse">
                        <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
                        <span>{passwordError}</span>
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleVerifyAndSavePassword}
                        disabled={currentStaff.role !== "OWNER"}
                        className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Xác nhận đổi mật khẩu
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Action Footer */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={currentStaff.role !== "OWNER"}
              className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-stone-800 disabled:text-stone-500 disabled:cursor-not-allowed text-stone-950 font-black text-xs uppercase tracking-widest flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-[0.98]"
            >
              <Save className="h-4.5 w-4.5" />
              <span>Lưu lại cài đặt</span>
            </button>
          </div>
        </form>
      )}

      {/* SUBTAB 2: STAFF LIST */}
      {activeSubTab === "staff" && (
        <div className="space-y-4">
          {getRoleRank(currentStaff.role) <= 1 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <Info className="h-5 w-5 shrink-0" />
              <span>Chế độ Chỉ xem (Read-Only): Bạn cần đăng nhập tài khoản Quản lý (MANAGER) hoặc Chủ cửa hàng (OWNER) để thêm mới hoặc thay đổi nhân viên cấp dưới.</span>
            </div>
          )}

          <div className="flex justify-between items-center bg-stone-900 p-4 rounded-xl border border-stone-850">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-stone-200 uppercase block">Danh sách nhân sự cửa hàng</span>
              <p className="text-[10px] text-stone-500">Mỗi vai trò (Owner, Manager, Cashier) phân tách quyền hạn vận hành.</p>
            </div>

            {getRoleRank(currentStaff.role) > 1 ? (
              <button
                onClick={() => setIsStaffModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black uppercase flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Thêm nhân viên</span>
              </button>
            ) : (
              <div className="px-3.5 py-1.5 rounded-xl text-xs bg-stone-800 text-stone-500 font-bold uppercase flex items-center gap-1.5 border border-stone-850" title="Chỉ Quản lý hoặc Chủ cửa hàng có quyền tạo tài khoản">
                <Shield className="h-3.5 w-3.5" />
                <span>Không có quyền thêm</span>
              </div>
            )}
          </div>

          {/* Table of staff members */}
          <div className="rounded-2xl bg-stone-900 border border-stone-850 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-950/60 border-b border-stone-850 text-stone-400">
                    <th className="p-4 font-bold uppercase tracking-wider">Họ và tên</th>
                    <th className="p-4 font-bold uppercase tracking-wider">Email liên lạc</th>
                    <th className="p-4 font-bold uppercase tracking-wider">Số điện thoại</th>
                    <th className="p-4 font-bold uppercase tracking-wider">Quyền hạn</th>
                    <th className="p-4 font-bold uppercase tracking-wider">Quyền chi tiết</th>
                    <th className="p-4 text-center font-bold uppercase tracking-wider">Trạng thái</th>
                    <th className="p-4 text-right font-bold uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-850/60">
                  {staff.map(member => (
                    <tr key={member.id} className={`hover:bg-stone-950/20 transition-all ${!member.active ? "opacity-50" : ""}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-stone-950 border border-stone-800 flex items-center justify-center font-bold text-xs text-stone-400">
                            {member.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-stone-100 text-sm block">{member.name}</span>
                            {member.id === "staff-1" && <span className="text-[9px] text-amber-500 font-bold uppercase">Sáng lập</span>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-stone-400">{member.email}</td>
                      <td className="p-4 font-mono text-stone-300">{member.phone}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold border flex items-center gap-1.5 w-fit ${
                          member.role === "OWNER" ? "bg-rose-500/10 text-rose-400 border-rose-500/20 font-black" :
                          member.role === "MANAGER" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                          "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}>
                          <Shield className="h-3 w-3" />
                          <span>{member.role}</span>
                        </span>
                      </td>
                      <td className="p-4">
                        {member.role === "OWNER" ? (
                          <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-wide">Toàn bộ quyền</span>
                        ) : (
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 w-max">
                            {/* Bán hàng POS */}
                            <label className={`inline-flex items-center gap-1 select-none text-[10.5px] ${
                              getRoleRank(currentStaff.role) > getRoleRank(member.role) && currentStaffHasPermission("posAccess")
                                ? "cursor-pointer text-stone-300"
                                : "cursor-not-allowed text-stone-500 opacity-40"
                            }`}>
                              <input
                                type="checkbox"
                                checked={member.permissions?.posAccess !== undefined ? member.permissions.posAccess : true}
                                disabled={!(getRoleRank(currentStaff.role) > getRoleRank(member.role) && currentStaffHasPermission("posAccess"))}
                                onChange={(e) => {
                                  const updated = {
                                    ...member,
                                    permissions: {
                                      ...(member.permissions || {}),
                                      posAccess: e.target.checked
                                    }
                                  };
                                  onUpdateStaff(updated);
                                  
                                  safeDispatchEvent("kiot-add-audit-log", {
                                    actionType: "STAFF_PERMISSION_CHANGE",
                                    actionName: "Thay đổi phân quyền nhân viên",
                                    description: `Cập nhật quyền bán hàng POS cho nhân viên ${member.name} (${member.role}) thành ${e.target.checked ? "Cho phép" : "Từ chối"}.`,
                                    actorName: currentStaff.name,
                                    actorRole: currentStaff.role
                                  });
                                }}
                                className="rounded border-stone-800 text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-stone-950 h-3 w-3 cursor-pointer disabled:cursor-not-allowed"
                              />
                              <span>Bán hàng POS</span>
                            </label>

                            {/* Sản phẩm & Kho */}
                            <label className={`inline-flex items-center gap-1 select-none text-[10.5px] ${
                              getRoleRank(currentStaff.role) > getRoleRank(member.role) && currentStaffHasPermission("productsAccess")
                                ? "cursor-pointer text-stone-300"
                                : "cursor-not-allowed text-stone-500 opacity-40"
                            }`}>
                              <input
                                type="checkbox"
                                checked={member.permissions?.productsAccess !== undefined ? member.permissions.productsAccess : (member.role !== "CASHIER")}
                                disabled={!(getRoleRank(currentStaff.role) > getRoleRank(member.role) && currentStaffHasPermission("productsAccess"))}
                                onChange={(e) => {
                                  const updated = {
                                    ...member,
                                    permissions: {
                                      ...(member.permissions || {}),
                                      productsAccess: e.target.checked
                                    }
                                  };
                                  onUpdateStaff(updated);
                                  
                                  safeDispatchEvent("kiot-add-audit-log", {
                                    actionType: "STAFF_PERMISSION_CHANGE",
                                    actionName: "Thay đổi phân quyền nhân viên",
                                    description: `Cập nhật quyền quản lý Kho sản phẩm cho nhân viên ${member.name} (${member.role}) thành ${e.target.checked ? "Cho phép" : "Từ chối"}.`,
                                    actorName: currentStaff.name,
                                    actorRole: currentStaff.role
                                  });
                                }}
                                className="rounded border-stone-800 text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-stone-950 h-3 w-3 cursor-pointer disabled:cursor-not-allowed"
                              />
                              <span>Sản phẩm & Kho</span>
                            </label>

                            {/* Khách hàng & NCC */}
                            <label className={`inline-flex items-center gap-1 select-none text-[10.5px] ${
                              getRoleRank(currentStaff.role) > getRoleRank(member.role) && currentStaffHasPermission("partnersAccess")
                                ? "cursor-pointer text-stone-300"
                                : "cursor-not-allowed text-stone-500 opacity-40"
                            }`}>
                              <input
                                type="checkbox"
                                checked={member.permissions?.partnersAccess !== undefined ? member.permissions.partnersAccess : (member.role !== "CASHIER")}
                                disabled={!(getRoleRank(currentStaff.role) > getRoleRank(member.role) && currentStaffHasPermission("partnersAccess"))}
                                onChange={(e) => {
                                  const updated = {
                                    ...member,
                                    permissions: {
                                      ...(member.permissions || {}),
                                      partnersAccess: e.target.checked
                                    }
                                  };
                                  onUpdateStaff(updated);
                                  
                                  safeDispatchEvent("kiot-add-audit-log", {
                                    actionType: "STAFF_PERMISSION_CHANGE",
                                    actionName: "Thay đổi phân quyền nhân viên",
                                    description: `Cập nhật quyền quản lý Đối tác cho nhân viên ${member.name} (${member.role}) thành ${e.target.checked ? "Cho phép" : "Từ chối"}.`,
                                    actorName: currentStaff.name,
                                    actorRole: currentStaff.role
                                  });
                                }}
                                className="rounded border-stone-800 text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-stone-950 h-3 w-3 cursor-pointer disabled:cursor-not-allowed"
                              />
                              <span>Đối tác</span>
                            </label>

                            {/* Sổ quỹ */}
                            <label className={`inline-flex items-center gap-1 select-none text-[10.5px] ${
                              getRoleRank(currentStaff.role) > getRoleRank(member.role) && currentStaffHasPermission("cashbookAccess")
                                ? "cursor-pointer text-stone-300"
                                : "cursor-not-allowed text-stone-500 opacity-40"
                            }`}>
                              <input
                                type="checkbox"
                                checked={member.permissions?.cashbookAccess !== undefined ? member.permissions.cashbookAccess : (member.role !== "CASHIER")}
                                disabled={!(getRoleRank(currentStaff.role) > getRoleRank(member.role) && currentStaffHasPermission("cashbookAccess"))}
                                onChange={(e) => {
                                  const updated = {
                                    ...member,
                                    permissions: {
                                      ...(member.permissions || {}),
                                      cashbookAccess: e.target.checked
                                    }
                                  };
                                  onUpdateStaff(updated);
                                  
                                  safeDispatchEvent("kiot-add-audit-log", {
                                    actionType: "STAFF_PERMISSION_CHANGE",
                                    actionName: "Thay đổi phân quyền nhân viên",
                                    description: `Cập nhật quyền truy cập Sổ quỹ cho nhân viên ${member.name} (${member.role}) thành ${e.target.checked ? "Cho phép" : "Từ chối"}.`,
                                    actorName: currentStaff.name,
                                    actorRole: currentStaff.role
                                  });
                                }}
                                className="rounded border-stone-800 text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-stone-950 h-3 w-3 cursor-pointer disabled:cursor-not-allowed"
                              />
                              <span>Xem Sổ quỹ</span>
                            </label>

                            {/* Xem Báo cáo */}
                            <label className={`inline-flex items-center gap-1 select-none text-[10.5px] ${
                              getRoleRank(currentStaff.role) > getRoleRank(member.role) && currentStaffHasPermission("reportsAccess")
                                ? "cursor-pointer text-stone-300"
                                : "cursor-not-allowed text-stone-500 opacity-40"
                            }`}>
                              <input
                                type="checkbox"
                                checked={member.permissions?.reportsAccess !== undefined ? member.permissions.reportsAccess : (member.role !== "CASHIER")}
                                disabled={!(getRoleRank(currentStaff.role) > getRoleRank(member.role) && currentStaffHasPermission("reportsAccess"))}
                                onChange={(e) => {
                                  const updated = {
                                    ...member,
                                    permissions: {
                                      ...(member.permissions || {}),
                                      reportsAccess: e.target.checked
                                    }
                                  };
                                  onUpdateStaff(updated);
                                  
                                  safeDispatchEvent("kiot-add-audit-log", {
                                    actionType: "STAFF_PERMISSION_CHANGE",
                                    actionName: "Thay đổi phân quyền nhân viên",
                                    description: `Cập nhật quyền xem Báo cáo doanh thu cho nhân viên ${member.name} (${member.role}) thành ${e.target.checked ? "Cho phép" : "Từ chối"}.`,
                                    actorName: currentStaff.name,
                                    actorRole: currentStaff.role
                                  });
                                }}
                                className="rounded border-stone-800 text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-stone-950 h-3 w-3 cursor-pointer disabled:cursor-not-allowed"
                              />
                              <span>Xem Báo cáo</span>
                            </label>

                            {/* Thiết lập */}
                            <label className={`inline-flex items-center gap-1 select-none text-[10.5px] ${
                              getRoleRank(currentStaff.role) > getRoleRank(member.role) && currentStaffHasPermission("settingsAccess")
                                ? "cursor-pointer text-stone-300"
                                : "cursor-not-allowed text-stone-500 opacity-40"
                            }`}>
                              <input
                                type="checkbox"
                                checked={member.permissions?.settingsAccess !== undefined ? member.permissions.settingsAccess : false}
                                disabled={!(getRoleRank(currentStaff.role) > getRoleRank(member.role) && currentStaffHasPermission("settingsAccess"))}
                                onChange={(e) => {
                                  const updated = {
                                    ...member,
                                    permissions: {
                                      ...(member.permissions || {}),
                                      settingsAccess: e.target.checked
                                    }
                                  };
                                  onUpdateStaff(updated);
                                  
                                  safeDispatchEvent("kiot-add-audit-log", {
                                    actionType: "STAFF_PERMISSION_CHANGE",
                                    actionName: "Thay đổi phân quyền nhân viên",
                                    description: `Cập nhật quyền Thiết lập hệ thống cho nhân viên ${member.name} (${member.role}) thành ${e.target.checked ? "Cho phép" : "Từ chối"}.`,
                                    actorName: currentStaff.name,
                                    actorRole: currentStaff.role
                                  });
                                }}
                                className="rounded border-stone-800 text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-stone-950 h-3 w-3 cursor-pointer disabled:cursor-not-allowed"
                              />
                              <span>Thiết lập</span>
                            </label>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          disabled={getRoleRank(currentStaff.role) <= getRoleRank(member.role)}
                          onClick={() => handleToggleStaffStatus(member)}
                          className="text-stone-400 hover:text-stone-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center animate-fadeIn"
                        >
                          {member.active ? (
                            <ToggleRight className={`h-6 w-6 ${getRoleRank(currentStaff.role) > getRoleRank(member.role) ? "text-emerald-500" : "text-stone-500"}`} />
                          ) : (
                            <ToggleLeft className="h-6 w-6 text-stone-600" />
                          )}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        {member.id !== "staff-1" && (
                          <button
                            disabled={getRoleRank(currentStaff.role) <= getRoleRank(member.role)}
                            onClick={() => handleDeleteStaffClick(member.id, member.name)}
                            className="p-2 bg-stone-950 hover:bg-rose-950/40 text-stone-400 hover:text-rose-400 disabled:opacity-30 disabled:hover:bg-stone-950 disabled:hover:text-stone-400 disabled:cursor-not-allowed rounded-lg border border-stone-850 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: BACKUP AND SYNC */}
      {activeSubTab === "backup" && (
        <div className="space-y-6 animate-fade-in">
          {currentStaff.role !== "OWNER" && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn mb-1">
              <Info className="h-5 w-5 shrink-0" />
              <span>Chế độ Xem &amp; Xuất dữ liệu: Bạn có thể tải file sao lưu Excel (CSV) hoặc JSON, nhưng chỉ Chủ cửa hàng (OWNER) mới có quyền Khôi phục dữ liệu hoặc thay đổi tùy chọn tự động đồng bộ đám mây.</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left box: Export/Import (Local files) */}
            <div className="space-y-4 p-5 rounded-2xl bg-stone-900 border border-stone-850">
              <div className="flex items-center gap-2 border-b border-stone-800 pb-2">
                <Database className="h-4 w-4 text-amber-500" />
                <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest">
                  Sao lưu thiết bị cục bộ (Local Files)
                </h4>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                Xuất toàn bộ dữ liệu cửa hàng của bạn ra các định dạng chuẩn JSON hoặc CSV. Bạn có thể lưu trữ các file này trên thiết bị cá nhân hoặc gửi qua email để tự khôi phục khi cần thiết.
              </p>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={exportAllToJSON}
                    className="flex-1 min-w-[150px] px-4 py-3 rounded-xl bg-stone-950 hover:bg-stone-850 text-stone-200 hover:text-emerald-400 border border-stone-800 hover:border-emerald-500/30 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer font-sans"
                  >
                    <FileJson className="h-4.5 w-4.5 text-emerald-400" />
                    <span>Xuất Toàn bộ (JSON)</span>
                  </button>

                  <button
                    type="button"
                    onClick={exportProductsToCSV}
                    className="flex-1 min-w-[150px] px-4 py-3 rounded-xl bg-stone-950 hover:bg-stone-850 text-stone-200 hover:text-amber-500 border border-stone-800 hover:border-amber-500/30 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer font-sans"
                  >
                    <FileSpreadsheet className="h-4.5 w-4.5 text-amber-500" />
                    <span>Sản phẩm (CSV)</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={exportInvoicesToCSV}
                    className="flex-1 min-w-[150px] px-4 py-3 rounded-xl bg-stone-950 hover:bg-stone-850 text-stone-200 hover:text-amber-500 border border-stone-800 hover:border-amber-500/30 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer font-sans"
                  >
                    <FileSpreadsheet className="h-4.5 w-4.5 text-amber-500" />
                    <span>Hóa đơn (CSV)</span>
                  </button>

                  <button
                    type="button"
                    onClick={exportCustomersToCSV}
                    className="flex-1 min-w-[150px] px-4 py-3 rounded-xl bg-stone-950 hover:bg-stone-850 text-stone-200 hover:text-amber-500 border border-stone-800 hover:border-amber-500/30 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer font-sans"
                  >
                    <FileSpreadsheet className="h-4.5 w-4.5 text-amber-500" />
                    <span>Khách hàng (CSV)</span>
                  </button>
                </div>
              </div>

              {/* Import/Restore option */}
              <div className="mt-4 pt-4 border-t border-stone-800/60 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-300">
                  <Upload className="h-4 w-4 text-emerald-400" />
                  <span>Phục hồi dữ liệu từ file JSON</span>
                </div>
                <p className="text-[10px] text-stone-500 leading-normal">
                  Chọn file backup định dạng <code className="text-amber-400 font-mono">.json</code> đã xuất trước đó để khôi phục lại toàn bộ dữ liệu cửa hàng của bạn.
                </p>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    disabled={currentStaff.role !== "OWNER"}
                    onChange={handleJSONImport}
                    className="block w-full text-xs text-stone-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-xl file:border-0
                      file:text-xs file:font-bold file:uppercase file:tracking-wider
                      file:bg-emerald-500/10 file:text-emerald-400
                      hover:file:bg-emerald-500/15 cursor-pointer file:cursor-pointer
                      disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

            </div>

            {/* Right box: PostgreSQL Cloud Sync */}
            <div className="space-y-4 p-5 rounded-2xl bg-stone-900 border border-stone-850 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-stone-800 pb-2">
                  <Cloud className="h-4 w-4 text-emerald-400" />
                  <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest">
                    Đồng bộ điện toán đám mây (PostgreSQL)
                  </h4>
                </div>
                
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  Tự động lưu trữ và đồng bộ hóa thời gian thực tất cả dữ liệu (sản phẩm, hóa đơn, khách hàng, cấu hình) lên máy chủ PostgreSQL an toàn của Google Cloud SQL. Đảm bảo an toàn dữ liệu tối đa kể cả khi mất thiết bị.
                </p>

                {/* Status Indicator */}
                <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-400">Trạng thái kết nối:</span>
                    <span className={`font-bold flex items-center gap-1.5 ${isOnline ? "text-emerald-400" : "text-amber-500 animate-pulse"}`}>
                      <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-emerald-400" : "bg-amber-500"}`} />
                      {isOnline ? "Trực tuyến (Online)" : "Ngoại tuyến (Offline)"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs border-t border-stone-900 pt-2.5">
                    <span className="text-stone-400">Lần đồng bộ cuối:</span>
                    <span className="font-mono text-stone-300 flex items-center gap-1.5">
                      <History className="h-3.5 w-3.5 text-stone-500" />
                      {lastSyncTime ? new Date(lastSyncTime).toLocaleString("vi-VN") : "Chưa đồng bộ"}
                    </span>
                  </div>

                  {/* Auto-Sync Switch */}
                  <div className="flex justify-between items-center text-xs border-t border-stone-900 pt-2.5">
                    <span className="text-stone-400">Tự động đồng bộ định kỳ:</span>
                    <button
                      type="button"
                      disabled={currentStaff.role !== "OWNER"}
                      onClick={() => onToggleAutoSync(!autoSyncEnabled)}
                      className="cursor-pointer text-stone-400 hover:text-stone-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {autoSyncEnabled ? (
                        <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2.5 py-1.5 rounded-lg border border-emerald-500/20 font-bold uppercase text-[10px]">
                          <Check className="h-3 w-3" />
                          <span>Đang bật</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 bg-stone-800 text-stone-500 px-2.5 py-1.5 rounded-lg border border-stone-850 uppercase text-[10px] font-bold">
                          <span>Đã tắt</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-stone-950 p-3 rounded-xl border border-stone-800 text-stone-400">
                  <Info className="h-4 w-4 text-amber-500 shrink-0" />
                  <p className="text-[10px] leading-normal">
                    Khi "Tự động đồng bộ" được bật, hệ thống sẽ tự động sao lưu dữ liệu lên đám mây cứ mỗi <strong className="text-amber-500">60 giây</strong> hoặc ngay khi bạn thanh toán một hóa đơn mới.
                  </p>
                </div>
              </div>

              {/* Sync Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={triggerSyncAll}
                  disabled={isSyncingAll}
                  className="w-full px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-stone-800 disabled:text-stone-600 text-stone-950 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.98] font-sans"
                >
                  <RefreshCw className={`h-4.5 w-4.5 ${isSyncingAll ? "animate-spin" : ""}`} />
                  <span>{isSyncingAll ? "Đang tiến hành đồng bộ..." : "Đồng bộ lên PostgreSQL"}</span>
                </button>

                {onRestoreFromPostgres && (
                  <button
                    type="button"
                    disabled={currentStaff.role !== "OWNER"}
                    onClick={onRestoreFromPostgres}
                    className="w-full px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-stone-800 disabled:text-stone-600 text-stone-100 hover:text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.98] font-sans border border-indigo-500/20 disabled:border-stone-800"
                  >
                    <Cloud className="h-4.5 w-4.5" />
                    <span>Khôi phục từ PostgreSQL</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ADD STAFF MODAL */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 text-stone-200 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-stone-100 uppercase tracking-wider">Thêm Nhân Viên Mới</h3>
              <button onClick={() => setIsStaffModalOpen(false)} className="text-stone-500 hover:text-stone-300 cursor-pointer">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 font-bold uppercase">Họ và tên nhân viên *</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setFormState(e.target.value, setStaffName)}
                  placeholder="Ví dụ: Nguyễn Thị Hoa..."
                  className="w-full px-3 py-2.5 rounded-lg bg-stone-950 border border-stone-800 focus:border-emerald-500 focus:outline-none text-stone-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 font-bold uppercase">Email đăng ký đăng nhập *</label>
                <input
                  type="email"
                  required
                  value={staffEmail}
                  onChange={(e) => setFormState(e.target.value, setStaffEmail)}
                  placeholder="hoa@kiotx.vn..."
                  className="w-full px-3 py-2.5 rounded-lg bg-stone-950 border border-stone-800 focus:border-emerald-500 focus:outline-none text-stone-100 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-400 font-bold uppercase">Số điện thoại *</label>
                  <input
                    type="text"
                    required
                    value={staffPhone}
                    onChange={(e) => setFormState(e.target.value, setStaffPhone)}
                    placeholder="09..."
                    className="w-full px-3 py-2.5 rounded-lg bg-stone-950 border border-stone-800 focus:border-emerald-500 focus:outline-none text-stone-100 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-400 font-bold uppercase">Quyền hạn</label>
                  <select
                    value={staffRole}
                    onChange={(e) => handleRoleChange(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-lg bg-stone-950 border border-stone-800 focus:border-emerald-500 focus:outline-none text-stone-300 cursor-pointer"
                  >
                    <option value="CASHIER">CASHIER (Thu ngân)</option>
                    {(getRoleRank(currentStaff.role) > 2 || isSuperAdmin) && (
                      <option value="MANAGER">MANAGER (Quản lý kho)</option>
                    )}
                    {(getRoleRank(currentStaff.role) > 3 || isSuperAdmin) && (
                      <option value="OWNER">OWNER (Chủ sở hữu)</option>
                    )}
                  </select>
                </div>
              </div>

              {staffRole !== "OWNER" && (
                <div className="p-3 bg-stone-950 rounded-xl border border-stone-850 space-y-3.5 animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-stone-900 pb-1.5">
                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Tùy chỉnh quyền hạn</span>
                  </div>

                  {/* Copy Permissions Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[9px] text-stone-500 font-bold uppercase block">Sao chép mẫu quyền từ</label>
                    <select
                      value={copyFromStaffId}
                      onChange={(e) => handleCopyPermissions(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-300 text-[10px] cursor-pointer focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Chọn nhân viên có sẵn --</option>
                      {staff.filter(s => s.role !== "OWNER").map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-[10px]">
                    {/* Bán hàng POS */}
                    <label className={`flex items-center gap-1.5 select-none ${currentStaffHasPermission("posAccess") ? "cursor-pointer" : "cursor-not-allowed opacity-40"}`}>
                      <input
                        type="checkbox"
                        checked={posAccess}
                        disabled={!currentStaffHasPermission("posAccess")}
                        onChange={(e) => setPosAccess(e.target.checked)}
                        className="rounded border-stone-800 text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-stone-900 h-3.5 w-3.5 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className="font-semibold text-stone-200">Bán hàng POS</span>
                    </label>

                    {/* Hàng hóa & Kho */}
                    <label className={`flex items-center gap-1.5 select-none ${currentStaffHasPermission("productsAccess") ? "cursor-pointer" : "cursor-not-allowed opacity-40"}`}>
                      <input
                        type="checkbox"
                        checked={productsAccess}
                        disabled={!currentStaffHasPermission("productsAccess")}
                        onChange={(e) => setProductsAccess(e.target.checked)}
                        className="rounded border-stone-800 text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-stone-900 h-3.5 w-3.5 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className="font-semibold text-stone-200">Sản phẩm & Kho</span>
                    </label>

                    {/* Khách hàng & NCC */}
                    <label className={`flex items-center gap-1.5 select-none ${currentStaffHasPermission("partnersAccess") ? "cursor-pointer" : "cursor-not-allowed opacity-40"}`}>
                      <input
                        type="checkbox"
                        checked={partnersAccess}
                        disabled={!currentStaffHasPermission("partnersAccess")}
                        onChange={(e) => setPartnersAccess(e.target.checked)}
                        className="rounded border-stone-800 text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-stone-900 h-3.5 w-3.5 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className="font-semibold text-stone-200">Đối tác (Khách/NCC)</span>
                    </label>

                    {/* Sổ quỹ */}
                    <label className={`flex items-center gap-1.5 select-none ${currentStaffHasPermission("cashbookAccess") ? "cursor-pointer" : "cursor-not-allowed opacity-40"}`}>
                      <input
                        type="checkbox"
                        checked={cashbookAccess}
                        disabled={!currentStaffHasPermission("cashbookAccess")}
                        onChange={(e) => setCashbookAccess(e.target.checked)}
                        className="rounded border-stone-800 text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-stone-900 h-3.5 w-3.5 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className="font-semibold text-stone-200">Xem Sổ Quỹ</span>
                    </label>

                    {/* Xem Báo cáo */}
                    <label className={`flex items-center gap-1.5 select-none ${currentStaffHasPermission("reportsAccess") ? "cursor-pointer" : "cursor-not-allowed opacity-40"}`}>
                      <input
                        type="checkbox"
                        checked={reportsAccess}
                        disabled={!currentStaffHasPermission("reportsAccess")}
                        onChange={(e) => setReportsAccess(e.target.checked)}
                        className="rounded border-stone-800 text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-stone-900 h-3.5 w-3.5 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className="font-semibold text-stone-200">Xem Báo cáo</span>
                    </label>

                    {/* Thiết lập hệ thống */}
                    <label className={`flex items-center gap-1.5 select-none ${currentStaffHasPermission("settingsAccess") ? "cursor-pointer" : "cursor-not-allowed opacity-40"}`}>
                      <input
                        type="checkbox"
                        checked={settingsAccess}
                        disabled={!currentStaffHasPermission("settingsAccess")}
                        onChange={(e) => setSettingsAccess(e.target.checked)}
                        className="rounded border-stone-800 text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-stone-900 h-3.5 w-3.5 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className="font-semibold text-stone-200">Thiết lập</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-850 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold rounded-xl cursor-pointer"
                >
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Simple state setter utility for React synthetic events inside modals
function setFormState(value: string, setter: (val: string) => void) {
  setter(value);
}
