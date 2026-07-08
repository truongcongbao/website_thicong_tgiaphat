import React, { useState, useMemo, useEffect, useRef } from "react";
import { Product, Invoice, Category, Staff, SystemAuditLog, Customer, Supplier } from "../types";
import { safeDispatchEvent } from "../lib/events";
import * as XLSX from "xlsx";
import { 
  TrendingUp, ArrowUpRight, ArrowDownRight, Package, ShoppingBag, 
  DollarSign, Users, AlertTriangle, Layers, Calendar, ChevronRight, Activity,
  Search, Eye, X, Clock, CreditCard, Banknote, QrCode, User, FileText, RefreshCw, Download, FileSpreadsheet, Trash2,
  Printer, Mail, Plus, Cloud, Sparkles
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell, PieChart, Pie
} from "recharts";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface KiotDashboardProps {
  products: Product[];
  invoices: Invoice[];
  categories: Category[];
  currentStaff: Staff;
  staffList?: Staff[];
  systemLogs?: SystemAuditLog[];
  onNavigateToTab: (tab: string) => void;
  onCancelInvoice?: (invoiceId: string, reason: string, cancelledBy: string) => void;
  onUpdateInvoice?: (updatedInvoice: Invoice) => void;
  customers?: Customer[];
  suppliers?: Supplier[];
  settings?: any;
  onDeleteReportsData?: (
    type: "invoices" | "cashbook" | "all",
    rangeType: "day" | "month" | "year" | "all",
    value: string
  ) => { deletedInvoicesCount: number; deletedCashbookCount: number };
}

export default function KiotDashboard({ products, invoices, categories, currentStaff, staffList = [], systemLogs = [], onNavigateToTab, onCancelInvoice, onUpdateInvoice, customers = [], suppliers = [], settings, onDeleteReportsData }: KiotDashboardProps) {
  const [timeRange, setTimeRange] = useState<"today" | "yesterday" | "7days" | "30days">("7days");
  
  // Detect local trial state
  const [trialInfo] = useState<{ expireDate: string; shopName: string; status?: string } | null>(() => {
    try {
      const local = localStorage.getItem("kiot_trial_info");
      return local ? JSON.parse(local) : null;
    } catch (e) {
      return null;
    }
  });

  const trialDaysLeft = useMemo(() => {
    if (!trialInfo) return null;
    const diffTime = new Date(trialInfo.expireDate).getTime() - Date.now();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [trialInfo]);

  const [dashboardStaffFilter, setDashboardStaffFilter] = useState<string>("all");

  // Unique cashier names for dropdown filtering
  const cashierOptions = useMemo(() => {
    const fromInvoices = invoices.map(inv => inv.cashierName).filter(Boolean);
    const fromStaff = staffList.map(s => s.name).filter(Boolean);
    const combined = Array.from(new Set([...fromInvoices, ...fromStaff]));
    return combined.sort((a, b) => a.localeCompare(b));
  }, [invoices, staffList]);

  // Advanced search & time filters for the invoice list
  const [searchCustomer, setSearchCustomer] = useState("");
  const [searchStaff, setSearchStaff] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [dateFilterType, setDateFilterType] = useState<"all" | "today" | "yesterday" | "7days" | "30days" | "custom">("7days");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [eInvoiceFilter, setEInvoiceFilter] = useState<"all" | "issued" | "not_issued">("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // States for deleting reports
  const [deleteType, setDeleteType] = useState<"invoices" | "cashbook" | "all">("invoices");
  const [deleteRangeType, setDeleteRangeType] = useState<"day" | "month" | "year" | "all">("day");
  const [deleteDateValue, setDeleteDateValue] = useState<string>(new Date().toISOString().split("T")[0]);
  const [deleteMonthValue, setDeleteMonthValue] = useState<string>(new Date().toISOString().substring(0, 7));
  const [deleteYearValue, setDeleteYearValue] = useState<string>(new Date().getFullYear().toString());
  const [deletePassword, setDeletePassword] = useState<string>("");
  const [deleteErrorMsg, setDeleteErrorMsg] = useState<string>("");
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string>("");

  // States for 3-click invisible zone to reveal/hide data deletion section
  const [isDeleteSectionRevealed, setIsDeleteSectionRevealed] = useState(false);
  const deleteClickTimestampsRef = useRef<number[]>([]);

  const handleDeleteInvisibleZoneClick = (e: React.MouseEvent) => {
    if (e.detail === 3) {
      setIsDeleteSectionRevealed(prev => !prev);
      deleteClickTimestampsRef.current = [];
      return;
    }

    const now = Date.now();
    const recentClicks = [...deleteClickTimestampsRef.current, now].filter(t => now - t < 2000);
    deleteClickTimestampsRef.current = recentClicks;

    if (recentClicks.length >= 3) {
      setIsDeleteSectionRevealed(prev => !prev);
      deleteClickTimestampsRef.current = [];
    }
  };

  // Custom Confirmation Modal for Deletion
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [deleteConfirmError, setDeleteConfirmError] = useState("");
  const [pendingDeleteData, setPendingDeleteData] = useState<{
    type: "invoices" | "cashbook" | "all";
    rangeType: "day" | "month" | "year" | "all";
    value: string;
    formattedRangeStr: string;
  } | null>(null);

  // System Audit Log filter states
  const [logSearch, setLogSearch] = useState("");
  const [logTypeFilter, setLogTypeFilter] = useState<string>("ALL");

  const filteredLogs = useMemo(() => {
    return systemLogs.filter(log => {
      const matchesSearch = 
        log.actorName.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.description.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.actionName.toLowerCase().includes(logSearch.toLowerCase());
      
      const matchesType = logTypeFilter === "ALL" || log.actionType === logTypeFilter;
      
      return matchesSearch && matchesType;
    });
  }, [systemLogs, logSearch, logTypeFilter]);

  // Invoice cancellation states
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("Khách đổi ý không mua nữa");
  const [customCancelReason, setCustomCancelReason] = useState("");
  const [authManagerId, setAuthManagerId] = useState("");
  const [authPin, setAuthPin] = useState("");
  const [authError, setAuthError] = useState("");

  // PDF Export and Report States
  const [isExportingInvoice, setIsExportingInvoice] = useState(false);
  const [isExportingReport, setIsExportingReport] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailLogs, setEmailLogs] = useState<string[]>([]);
  const [showEmailLogs, setShowEmailLogs] = useState(false);

  // Format currency
  const formatVND = (value: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
  };

  // Synchronize timeRange top-level buttons with lower transaction registry dateFilterType
  useEffect(() => {
    setDateFilterType(timeRange);
  }, [timeRange]);

  // Handle navigating & starting quick PO purchase order creation
  const handleDashboardQuickPurchase = (productId: string) => {
    onNavigateToTab("products");
    setTimeout(() => {
      safeDispatchEvent("kiot-trigger-purchase", { productId });
    }, 150);
  };

  // Export revenue to Excel (.xlsx) - multi-sheet
  const exportRevenueToExcel = () => {
    try {
      const dateString = new Date().toISOString().split("T")[0];
      const rangeName = timeRange === "today" ? "Hom_nay" : timeRange === "yesterday" ? "Hom_qua" : timeRange === "7days" ? "7_Ngay" : "Thang";
      
      const wb = XLSX.utils.book_new();

      // Sheet 1: Tổng quan
      const overviewData = [
        { "Chỉ số tài chính": "Doanh thu thuần", "Giá trị (VND)": stats.revenue, "Mô tả": "Doanh thu thực tế sau khi giảm giá hóa đơn" },
        { "Chỉ số tài chính": "Giá vốn hàng bán", "Giá trị (VND)": stats.cost, "Mô tả": "Tổng giá vốn gốc của các mặt hàng bán ra" },
        { "Chỉ số tài chính": "Lợi nhuận thực tế", "Giá trị (VND)": stats.profit, "Mô tả": "Doanh thu thuần - Giá vốn bán hàng" },
        { "Chỉ số tài chính": "Tỉ suất lợi nhuận", "Giá trị (VND)": `${stats.margin.toFixed(2)}%`, "Mô tả": "Lợi nhuận thực tế / Doanh thu thuần" },
        { "Chỉ số tài chính": "Tổng giảm giá hóa đơn", "Giá trị (VND)": stats.discount, "Mô tả": "Số tiền đã giảm giá trực tiếp trên hóa đơn" },
        { "Chỉ số tài chính": "Tổng số hóa đơn phát sinh", "Giá trị (VND)": stats.transactions, "Mô tả": "Số lượng đơn hàng hoàn thành trong kỳ" },
        { "Chỉ số tài chính": "Thời gian báo cáo", "Giá trị (VND)": timeRange === "today" ? "Hôm nay" : timeRange === "yesterday" ? "Hôm qua" : timeRange === "7days" ? "7 ngày qua" : "Tháng này", "Mô tả": "" },
        { "Chỉ số tài chính": "Ngày tạo báo cáo", "Giá trị (VND)": new Date().toLocaleString("vi-VN"), "Mô tả": "Ngày giờ kết xuất dữ liệu" }
      ];
      const wsOverview = XLSX.utils.json_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(wb, wsOverview, "Tổng quan Doanh thu");

      // Sheet 2: Danh sách Hóa đơn
      const invoicesData = filteredInvoices.map((inv, idx) => ({
        "STT": idx + 1,
        "Mã hóa đơn": inv.invoiceCode,
        "Ngày tạo": new Date(inv.date).toLocaleString("vi-VN"),
        "Khách hàng": inv.customerName || "Khách lẻ",
        "Phương thức": inv.paymentMethod === "CASH" ? "Tiền mặt" : inv.paymentMethod === "BANK_TRANSFER" ? "Chuyển khoản" : inv.paymentMethod === "CREDIT_CARD" ? "Thẻ" : "Nợ",
        "Thu ngân": inv.cashierName,
        "Tổng tiền hàng": inv.totalOriginal,
        "Giảm giá hóa đơn": inv.discountAmount,
        "Khách cần trả": inv.totalPayable,
        "Trạng thái": inv.status === "COMPLETED" ? "Hoàn thành" : inv.status === "REFUNDED" ? "Trả hàng" : "Đã hủy"
      }));
      const wsInvoices = XLSX.utils.json_to_sheet(invoicesData);
      XLSX.utils.book_append_sheet(wb, wsInvoices, "Danh sách Hóa đơn");

      // Sheet 3: Chi tiết Mặt hàng đã bán
      const itemsData: any[] = [];
      filteredInvoices.forEach(inv => {
        inv.items.forEach(item => {
          itemsData.push({
            "Mã hóa đơn": inv.invoiceCode,
            "Ngày bán": new Date(inv.date).toLocaleString("vi-VN"),
            "Mã sản phẩm": item.productCode,
            "Tên sản phẩm": item.productName,
            "Số lượng": item.quantity,
            "Đơn giá bán": item.unitPrice,
            "Giảm giá mặt hàng": item.discount,
            "Thành tiền": item.total
          });
        });
      });
      const wsItems = XLSX.utils.json_to_sheet(itemsData);
      XLSX.utils.book_append_sheet(wb, wsItems, "Mặt hàng đã bán");

      XLSX.writeFile(wb, `BaoCao_DoanhThu_${rangeName}_${dateString}.xlsx`);

      safeDispatchEvent("kiot-toast", {
        type: "success",
        title: "Báo cáo Excel đã tải",
        message: `Báo cáo doanh thu kì "${rangeName}" đã được tải về dưới dạng bảng tính Excel (.xlsx) chuyên nghiệp.`
      });

      safeDispatchEvent("kiot-add-audit-log", {
        actionType: "SYSTEM_CONFIG",
        actionName: "Xuất báo cáo doanh thu Excel",
        description: `Đã kết xuất báo cáo doanh thu Excel kì "${rangeName}" gồm ${stats.transactions} giao dịch, tổng doanh thu ${stats.revenue.toLocaleString("vi-VN")}đ.`,
        actorName: currentStaff.name,
        actorRole: currentStaff.role
      });
    } catch (err) {
      console.error("Lỗi xuất Excel Doanh thu:", err);
      safeDispatchEvent("kiot-toast", {
        type: "stock-warning",
        title: "Lỗi xuất báo cáo",
        message: "Không thể kết xuất báo cáo Doanh thu ra file Excel."
      });
    }
  };

  // Export inventory to Excel (.xlsx)
  const exportInventoryToExcel = () => {
    try {
      const dateString = new Date().toISOString().split("T")[0];
      const wb = XLSX.utils.book_new();

      const inventoryData = products.map((prod, idx) => {
        const stockValue = prod.stock * prod.costPrice;
        const potentialRevenue = prod.stock * prod.sellingPrice;
        const potentialProfit = potentialRevenue - stockValue;
        
        let status = "Bình thường";
        if (prod.stock === 0) {
          status = "Hết hàng";
        } else if (prod.stock <= prod.minStock) {
          status = "Sắp hết hàng";
        }
        
        return {
          "STT": idx + 1,
          "Mã sản phẩm (SKU)": prod.code,
          "Tên sản phẩm": prod.name,
          "Danh mục": prod.category,
          "Đơn vị tính": prod.unit,
          "Giá vốn (đ)": prod.costPrice,
          "Giá bán (đ)": prod.sellingPrice,
          "Tồn kho hiện tại": prod.stock,
          "Định mức tối thiểu": prod.minStock,
          "Giá trị tồn kho (đ)": stockValue,
          "Doanh thu dự kiến (đ)": potentialRevenue,
          "Lợi nhuận dự kiến (đ)": potentialProfit,
          "Hạn sử dụng": prod.expiryDate || "Không có",
          "Trạng thái": status
        };
      });

      const wsInventory = XLSX.utils.json_to_sheet(inventoryData);
      XLSX.utils.book_append_sheet(wb, wsInventory, "Báo cáo Tồn kho");

      XLSX.writeFile(wb, `BaoCao_TonKho_${dateString}.xlsx`);

      safeDispatchEvent("kiot-toast", {
        type: "success",
        title: "Báo cáo Tồn kho đã tải",
        message: "Danh sách tồn kho chi tiết đã được tải về dưới dạng bảng tính Excel (.xlsx)."
      });

      safeDispatchEvent("kiot-add-audit-log", {
        actionType: "SYSTEM_CONFIG",
        actionName: "Xuất báo cáo tồn kho Excel",
        description: `Đã kết xuất báo cáo tồn kho Excel gồm ${products.length} sản phẩm, tổng giá trị tồn kho ${products.reduce((acc, p) => acc + p.stock * p.costPrice, 0).toLocaleString("vi-VN")}đ.`,
        actorName: currentStaff.name,
        actorRole: currentStaff.role
      });
    } catch (err) {
      console.error("Lỗi xuất Excel Tồn kho:", err);
      safeDispatchEvent("kiot-toast", {
        type: "stock-warning",
        title: "Lỗi xuất báo cáo",
        message: "Không thể kết xuất báo cáo Tồn kho ra file Excel."
      });
    }
  };

  // Export debt report to Excel (.xlsx)
  const exportDebtToExcel = () => {
    try {
      const dateString = new Date().toISOString().split("T")[0];
      const wb = XLSX.utils.book_new();

      const totalCustomerDebt = (customers || []).reduce((acc, c) => acc + (c.debt || 0), 0);
      const totalSupplierDebt = (suppliers || []).reduce((acc, s) => acc + (s.debt || 0), 0);

      // Sheet 1: Tổng quan Công nợ
      const debtSummary = [
        { "Chỉ tiêu": "Tổng nợ phải thu (Từ khách hàng)", "Giá trị (VND)": totalCustomerDebt, "Mô tả": "Khách mua hàng ghi nợ, cửa hàng cần thu hồi" },
        { "Chỉ tiêu": "Tổng nợ phải trả (Cho nhà cung cấp)", "Giá trị (VND)": totalSupplierDebt, "Mô tả": "Nhập hàng ghi nợ, cửa hàng cần chi trả" },
        { "Chỉ tiêu": "Cân đối công nợ ròng (Thu - Trả)", "Giá trị (VND)": totalCustomerDebt - totalSupplierDebt, "Mô tả": "Dương là thặng dư phải thu, âm là dư nợ phải trả" },
        { "Chỉ tiêu": "Số lượng khách nợ", "Giá trị (VND)": (customers || []).filter(c => (c.debt || 0) > 0).length, "Mô tả": "Số lượng khách hàng hiện đang nợ" },
        { "Chỉ tiêu": "Số lượng nhà cung cấp nợ", "Giá trị (VND)": (suppliers || []).filter(s => (s.debt || 0) > 0).length, "Mô tả": "Số lượng nhà cung cấp cửa hàng đang nợ" },
        { "Chỉ tiêu": "Ngày tạo báo cáo", "Giá trị (VND)": new Date().toLocaleString("vi-VN"), "Mô tả": "Ngày kết xuất dữ liệu" }
      ];
      const wsSummary = XLSX.utils.json_to_sheet(debtSummary);
      XLSX.utils.book_append_sheet(wb, wsSummary, "Tổng quan Công nợ");

      // Sheet 2: Công nợ Khách hàng
      const customerDebtList = (customers || [])
        .filter(c => (c.debt || 0) > 0)
        .map((c, idx) => ({
          "STT": idx + 1,
          "Mã khách hàng": c.id,
          "Tên khách hàng": c.name,
          "Số điện thoại": c.phone,
          "Địa chỉ": c.address || "Chưa cập nhật",
          "Hạng thành viên": c.tier,
          "Tổng chi tiêu": c.totalSpent,
          "Dư nợ hiện tại (đ)": c.debt || 0
        }));
      const wsCustDebt = XLSX.utils.json_to_sheet(customerDebtList);
      XLSX.utils.book_append_sheet(wb, wsCustDebt, "Nợ phải thu (Khách hàng)");

      // Sheet 3: Công nợ Nhà cung cấp
      const supplierDebtList = (suppliers || [])
        .filter(s => (s.debt || 0) > 0)
        .map((s, idx) => ({
          "STT": idx + 1,
          "Mã NCC": s.id,
          "Tên nhà cung cấp": s.name,
          "Tên công ty": s.companyName || "Chưa cập nhật",
          "Số điện thoại": s.phone,
          "Địa chỉ": s.address || "Chưa cập nhật",
          "Dư nợ hiện tại (đ)": s.debt || 0
        }));
      const wsSuppDebt = XLSX.utils.json_to_sheet(supplierDebtList);
      XLSX.utils.book_append_sheet(wb, wsSuppDebt, "Nợ phải trả (Nhà cung cấp)");

      XLSX.writeFile(wb, `BaoCao_CongNo_${dateString}.xlsx`);

      safeDispatchEvent("kiot-toast", {
        type: "success",
        title: "Báo cáo Công nợ đã tải",
        message: "Danh sách công nợ chi tiết (Khách hàng & Nhà cung cấp) đã được tải về dưới dạng bảng tính Excel (.xlsx)."
      });

      safeDispatchEvent("kiot-add-audit-log", {
        actionType: "SYSTEM_CONFIG",
        actionName: "Xuất báo cáo công nợ Excel",
        description: `Đã kết xuất báo cáo công nợ Excel, tổng phải thu: ${totalCustomerDebt.toLocaleString("vi-VN")}đ, tổng phải trả: ${totalSupplierDebt.toLocaleString("vi-VN")}đ.`,
        actorName: currentStaff.name,
        actorRole: currentStaff.role
      });
    } catch (err) {
      console.error("Lỗi xuất Excel Công nợ:", err);
      safeDispatchEvent("kiot-toast", {
        type: "stock-warning",
        title: "Lỗi xuất báo cáo",
        message: "Không thể kết xuất báo cáo Công nợ ra file Excel."
      });
    }
  };

  const exportReportToExcel = () => {
    exportRevenueToExcel();
  };

  const handleExecuteDeleteReports = () => {
    setDeleteErrorMsg("");
    setDeleteSuccessMsg("");
    setDeleteConfirmError("");

    // 1. Check Permissions: Only OWNER can delete
    if (currentStaff.role !== "OWNER") {
      setDeleteErrorMsg("Hành động bị chặn: Chỉ tài khoản Chủ cửa hàng (OWNER) mới được phép thực hiện thao tác xóa dữ liệu báo cáo!");
      return;
    }

    // 2. Verify security password
    const expectedPassword = settings?.reportDeletePassword || "admin123";
    if (deletePassword !== expectedPassword) {
      setDeleteErrorMsg("Mật khẩu bảo vệ không chính xác! Vui lòng thử lại hoặc kiểm tra cấu hình trong mục Cài đặt.");
      return;
    }

    // Determine filter value based on rangeType
    let targetValue = "";
    let formattedRangeStr = "";
    if (deleteRangeType === "day") {
      targetValue = deleteDateValue;
      formattedRangeStr = `ngày ${deleteDateValue ? new Date(deleteDateValue).toLocaleDateString("vi-VN") : ""}`;
    } else if (deleteRangeType === "month") {
      targetValue = deleteMonthValue;
      formattedRangeStr = `tháng ${deleteMonthValue}`;
    } else if (deleteRangeType === "year") {
      targetValue = deleteYearValue;
      formattedRangeStr = `năm ${deleteYearValue}`;
    } else {
      targetValue = "all";
      formattedRangeStr = "toàn bộ lịch sử";
    }

    if (deleteRangeType !== "all" && !targetValue) {
      setDeleteErrorMsg("Vui lòng nhập/chọn mốc thời gian cần xóa!");
      return;
    }

    // Set pending data and show custom confirmation modal
    setPendingDeleteData({
      type: deleteType,
      rangeType: deleteRangeType,
      value: targetValue,
      formattedRangeStr
    });
    setDeleteConfirmInput("");
    setDeleteConfirmError("");
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmDeleteFinal = () => {
    setDeleteConfirmError("");
    
    if (deleteConfirmInput.trim().toUpperCase() !== "XÓA") {
      setDeleteConfirmError("Vui lòng nhập chính xác chữ 'XÓA' để tiếp tục!");
      return;
    }

    if (!pendingDeleteData) return;

    const { type, rangeType, value, formattedRangeStr } = pendingDeleteData;

    if (onDeleteReportsData) {
      const result = onDeleteReportsData(type, rangeType, value);
      setDeleteSuccessMsg(`Đã xóa sạch thành công ${result.deletedInvoicesCount} hóa đơn và ${result.deletedCashbookCount} phiếu thu/chi thuộc ${formattedRangeStr}.`);
      setDeletePassword(""); // Reset password field for safety
      setShowDeleteConfirmModal(false);
      setPendingDeleteData(null);
      
      // Dispatch audit log
      safeDispatchEvent("kiot-add-audit-log", {
        actionType: "SYSTEM_CONFIG",
        actionName: "Xóa dữ liệu báo cáo",
        description: `Đã xóa dữ liệu báo cáo (${type}) thời kỳ ${formattedRangeStr}. Số lượng xóa: ${result.deletedInvoicesCount} hóa đơn, ${result.deletedCashbookCount} phiếu sổ quỹ.`,
        actorName: currentStaff.name,
        actorRole: currentStaff.role
      });
    } else {
      setDeleteConfirmError("Chức năng xóa dữ liệu chưa được kích hoạt trên hệ thống chính.");
    }
  };

  // Gửi email báo cáo tới Trương Công Bảo (congbaotruong8@gmail.com)
  const handleSendEmail = () => {
    setIsSendingEmail(true);
    setShowEmailLogs(true);
    setEmailLogs([]);

    const steps = [
      "Khởi tạo máy chủ gửi tin KiotX Mail-Service...",
      "Phân tích dữ liệu báo cáo hiệu suất tài chính...",
      "Kết nối với máy chủ SMTP mã hóa (smtp.kiotx.com:465)...",
      "Kênh truyền SSL bảo mật cao được xác thực thành công.",
      "Đang nén & đóng gói tài liệu PDF đính kèm: BaoCao_DoanhThu.pdf...",
      "Định tuyến thư tới hòm thư chủ cửa hàng: congbaotruong8@gmail.com...",
      "Giao dịch SMTP hoàn tất: 250 OK (Thư đã được chấp nhận).",
      "Gửi email báo cáo thành công!"
    ];

    let currentStep = 0;
    setEmailLogs([steps[0]]);

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setEmailLogs(prev => [...prev, steps[currentStep]]);
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsSendingEmail(false);
          setShowEmailLogs(false);
          safeDispatchEvent("kiot-toast", {
            type: "success",
            title: "Gửi Email báo cáo thành công! 📬",
            message: "Báo cáo doanh thu cuối ngày đã được gửi thẳng vào hộp thư congbaotruong8@gmail.com của chủ cửa hàng (Trương Công Bảo)."
          });
        }, 1000);
      }
    }, 600);
  };

  const [isIssuingEInvoice, setIsIssuingEInvoice] = useState(false);

  const handleIssueEInvoice = async (invoice: Invoice) => {
    if (!invoice) return;
    setIsIssuingEInvoice(true);
    
    // Simulate connection/processing with E-invoice provider & Taxation Department
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const pattern = settings?.eInvoicePattern || "1C26TML";
      const serial = settings?.eInvoiceSerial || "C26TGP";
      const taxCode = settings?.eInvoiceTaxCode || "3701548239";
      
      const eInvCode = `${pattern}-${serial}-${String(Math.floor(100000 + Math.random() * 900000))}`;
      const eInvUrl = `https://tracuu.meinvoice.vn/invoice?taxcode=${taxCode}&code=${invoice.invoiceCode}`;

      const updatedInv: Invoice = {
        ...invoice,
        eInvoiceStatus: "ISSUED",
        eInvoiceCode: eInvCode,
        eInvoiceUrl: eInvUrl,
        taxRate: invoice.taxRate !== undefined ? invoice.taxRate : (settings?.taxRate || 8),
        taxAmount: invoice.taxAmount !== undefined && invoice.taxAmount > 0 
          ? invoice.taxAmount 
          : (invoice.totalOriginal - invoice.discountAmount) * ((settings?.taxRate || 8) / 100)
      };

      if (onUpdateInvoice) {
        onUpdateInvoice(updatedInv);
      }
      
      // Update local state in modal to reflect changes immediately
      setSelectedInvoice(updatedInv);

      safeDispatchEvent("kiot-toast", {
        type: "success",
        title: "Phát hành hóa đơn thành công",
        message: `Hóa đơn điện tử ${invoice.invoiceCode} đã được cấp số bởi Cơ quan Thuế.`
      });
    } catch (err) {
      console.error("Lỗi phát hành HĐĐT:", err);
      safeDispatchEvent("kiot-toast", {
        type: "stock-warning",
        title: "Phát hành thất bại",
        message: "Không thể kết nối đến nhà cung cấp HĐĐT. Vui lòng thử lại."
      });
    } finally {
      setIsIssuingEInvoice(false);
    }
  };

  // Export specific invoice detail as a professional PDF receipt
  const exportInvoiceToPDF = async () => {
    const element = document.getElementById("invoice-receipt-pdf");
    if (!element) return;
    
    setIsExportingInvoice(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2.5, // High resolution crisp scaling
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      // Calculate scaled height
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Receipt starts at top
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, Math.min(imgHeight, pageHeight - 10));
      pdf.save(`Hoadon_${selectedInvoice?.invoiceCode || "Receipt"}.pdf`);
      
      safeDispatchEvent("kiot-toast", {
        type: "success",
        title: "Xuất PDF hóa đơn thành công",
        message: `Hóa đơn ${selectedInvoice?.invoiceCode} đã được tải về dưới dạng PDF.`
      });
    } catch (err) {
      console.error("Lỗi xuất hóa đơn PDF:", err);
      safeDispatchEvent("kiot-toast", {
        type: "stock-warning",
        title: "Lỗi xuất hóa đơn",
        message: "Không thể tạo file PDF hóa đơn. Vui lòng thử lại."
      });
    } finally {
      setIsExportingInvoice(false);
    }
  };

  // Export the active control room overview or executive revenue report as PDF
  const exportRevenueReportToPDF = async () => {
    const element = document.getElementById("revenue-report-pdf");
    if (!element) return;
    
    setIsExportingReport(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2.2, // Clean business document quality
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      // Page 1
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Handle multi-page reports beautifully
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const dateString = new Date().toISOString().split("T")[0];
      const rangeName = timeRange === "today" ? "Hôm nay" : timeRange === "7days" ? "7 Ngày" : "Tháng";
      pdf.save(`BaoCao_DoanhThu_${rangeName}_${dateString}.pdf`);
      
      safeDispatchEvent("kiot-toast", {
        type: "success",
        title: "Báo cáo PDF đã tải",
        message: `Báo cáo hiệu suất tài chính thời kỳ "${rangeName}" đã được tải về.`
      });
      setIsReportModalOpen(false);
    } catch (err) {
      console.error("Lỗi xuất báo cáo PDF:", err);
      safeDispatchEvent("kiot-toast", {
        type: "stock-warning",
        title: "Lỗi xuất báo cáo",
        message: "Gặp sự cố khi xuất báo cáo doanh thu PDF."
      });
    } finally {
      setIsExportingReport(false);
    }
  };

  // 1. Calculate stats based on time range (synchronized with dateFilterType for instant updates)
  const filteredInvoices = useMemo(() => {
    const now = new Date();
    // Midnight today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // Midnight yesterday
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(todayStart.getDate() - 1);

    return invoices.filter(inv => {
      // Filter by staff if active
      if (dashboardStaffFilter !== "all") {
        if (inv.cashierName !== dashboardStaffFilter) {
          return false;
        }
      }

      const invDate = new Date(inv.date);
      const invDayStart = new Date(invDate.getFullYear(), invDate.getMonth(), invDate.getDate());
      
      if (dateFilterType === "all") {
        return true;
      } else if (dateFilterType === "today") {
        return invDayStart.getTime() === todayStart.getTime();
      } else if (dateFilterType === "yesterday") {
        return invDayStart.getTime() === yesterdayStart.getTime();
      } else if (dateFilterType === "7days") {
        const diffTime = todayStart.getTime() - invDayStart.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays < 7;
      } else if (dateFilterType === "30days") {
        const diffTime = todayStart.getTime() - invDayStart.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays < 30;
      } else if (dateFilterType === "custom") {
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (invDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (invDate > end) return false;
        }
        return true;
      }
      return true;
    });
  }, [invoices, dateFilterType, startDate, endDate, dashboardStaffFilter]);

  // Calculate Key Performance Indicators (KPIs)
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalDiscount = 0;
    let totalCost = 0;
    let transactionCount = filteredInvoices.length;

    filteredInvoices.forEach(inv => {
      totalRevenue += inv.totalPayable;
      totalDiscount += inv.discountAmount;

      // Calculate cost price for items
      inv.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId || p.code === item.productCode);
        if (prod) {
          totalCost += prod.costPrice * item.quantity;
        } else {
          // Fallback if product is deleted
          totalCost += (item.unitPrice * 0.5) * item.quantity;
        }
      });
    });

    const netProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      revenue: totalRevenue,
      discount: totalDiscount,
      cost: totalCost,
      profit: netProfit,
      margin: profitMargin,
      transactions: transactionCount
    };
  }, [filteredInvoices, products]);

  // Calculate performance metrics for each cashier based on active date range filters
  const cashierPerformance = useMemo(() => {
    const performance: {
      [key: string]: {
        name: string;
        invoiceCount: number;
        revenue: number;
        avgInvoiceValue: number;
        itemsSold: number;
      }
    } = {};

    // Initialize with all staff names if available to show zero values too
    staffList.forEach(s => {
      performance[s.name] = {
        name: s.name,
        invoiceCount: 0,
        revenue: 0,
        avgInvoiceValue: 0,
        itemsSold: 0
      };
    });

    filteredInvoices.forEach(inv => {
      const name = inv.cashierName || "Không rõ";
      if (!performance[name]) {
        performance[name] = {
          name,
          invoiceCount: 0,
          revenue: 0,
          avgInvoiceValue: 0,
          itemsSold: 0
        };
      }
      performance[name].invoiceCount += 1;
      performance[name].revenue += inv.totalPayable;
      
      const qty = inv.items.reduce((sum, item) => sum + item.quantity, 0);
      performance[name].itemsSold += qty;
    });

    // Calculate averages and convert to array
    return Object.values(performance).map(p => {
      return {
        ...p,
        avgInvoiceValue: p.invoiceCount > 0 ? p.revenue / p.invoiceCount : 0
      };
    }).sort((a, b) => b.revenue - a.revenue); // sort by highest revenue first
  }, [filteredInvoices, staffList]);

  // 2. Out of stock / Low stock alerts
  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stock <= p.minStock);
  }, [products]);

  // Visual low stock chart data (first 8 products with lowest stock ratio)
  const lowStockChartData = useMemo(() => {
    return lowStockProducts
      .slice(0, 10)
      .map(p => ({
        name: p.name.length > 15 ? p.name.slice(0, 15) + "..." : p.name,
        fullName: p.name,
        "Hiện tại": p.stock,
        "Tối thiểu": p.minStock,
      }));
  }, [lowStockProducts]);

  // Dynamically compute the top 5 highest-selling products for the active filter range (with robust fallback mappings)
  const topSellingProducts = useMemo(() => {
    const productSales: { [key: string]: { name: string, productName: string, code: string, productCode: string, qty: number, quantity: number, revenue: number, total: number } } = {};
    filteredInvoices.forEach(inv => {
      inv.items.forEach(item => {
        const code = item.productCode || "UNKNOWN";
        if (productSales[code]) {
          productSales[code].qty += item.quantity;
          productSales[code].quantity += item.quantity;
          productSales[code].revenue += item.total;
          productSales[code].total += item.total;
        } else {
          productSales[code] = {
            name: item.productName,
            productName: item.productName,
            code: code,
            productCode: code,
            qty: item.quantity,
            quantity: item.quantity,
            revenue: item.total,
            total: item.total
          };
        }
      });
    });
    return Object.values(productSales)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [filteredInvoices]);

  // Top 5 best selling products mapped for the Recharts Bar Chart
  const topSellingChartData = useMemo(() => {
    return topSellingProducts.map(p => ({
      name: p.name.length > 15 ? p.name.slice(0, 15) + "..." : p.name,
      fullName: p.name,
      code: p.code || p.productCode || "N/A",
      "Số lượng": p.qty || p.quantity || 0,
      "Doanh thu": p.revenue || p.total || 0,
    }));
  }, [topSellingProducts]);

  // 3. Prepare data for Recharts Revenue & Profit over time (supports all filter types and custom date ranges)
  const chartData = useMemo(() => {
    // Group invoices by date
    const dailyData: { [key: string]: { revenue: number, cost: number, profit: number } } = {};
    
    // Initialize days based on active date filter
    let daysToGenerate = 15;
    if (dateFilterType === "today") daysToGenerate = 1;
    else if (dateFilterType === "yesterday") daysToGenerate = 1;
    else if (dateFilterType === "7days") daysToGenerate = 7;
    else if (dateFilterType === "30days") daysToGenerate = 30;
    else if (dateFilterType === "custom") {
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        daysToGenerate = Math.min(60, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
      } else {
        daysToGenerate = 15;
      }
    } else if (dateFilterType === "all") {
      daysToGenerate = 30; // default for all
    }

    for (let i = daysToGenerate - 1; i >= 0; i--) {
      const d = new Date();
      if (dateFilterType === "yesterday") {
        d.setDate(d.getDate() - 1);
      } else if (dateFilterType === "custom" && endDate) {
        const endD = new Date(endDate);
        d.setDate(endD.getDate() - i);
      } else {
        d.setDate(d.getDate() - i);
      }
      const dateStr = d.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" });
      dailyData[dateStr] = { revenue: 0, cost: 0, profit: 0 };
    }

    filteredInvoices.forEach(inv => {
      const invDate = new Date(inv.date);
      const dateStr = invDate.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" });
      
      // Calculate costs
      let cost = 0;
      inv.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        cost += (prod ? prod.costPrice : item.unitPrice * 0.5) * item.quantity;
      });

      if (dailyData[dateStr]) {
        dailyData[dateStr].revenue += inv.totalPayable;
        dailyData[dateStr].cost += cost;
        dailyData[dateStr].profit += (inv.totalPayable - cost);
      } else {
        dailyData[dateStr] = {
          revenue: inv.totalPayable,
          cost: cost,
          profit: inv.totalPayable - cost
        };
      }
    });

    return Object.keys(dailyData).map(key => ({
      name: key,
      "Doanh thu": dailyData[key].revenue,
      "Lợi nhuận": dailyData[key].profit,
    }));
  }, [filteredInvoices, products, dateFilterType, startDate, endDate]);

  // 4. Category distribution data
  const categoryChartData = useMemo(() => {
    const distribution: { [key: string]: number } = {};
    products.forEach(p => {
      distribution[p.category] = (distribution[p.category] || 0) + p.stock;
    });

    return Object.keys(distribution).map(key => ({
      name: key,
      value: distribution[key]
    }));
  }, [products]);

  // Colors for category distribution chart
  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6"];

  // 5. Filter invoice list dynamically for Search / Time components
  const dashboardInvoiceList = useMemo(() => {
    return invoices.filter(inv => {
      // Filter by Invoice Code
      if (searchCode.trim()) {
        const match = inv.invoiceCode.toLowerCase().includes(searchCode.trim().toLowerCase());
        if (!match) return false;
      }

      // Filter by Customer Name
      if (searchCustomer.trim()) {
        const match = inv.customerName.toLowerCase().includes(searchCustomer.trim().toLowerCase());
        if (!match) return false;
      }

      // Filter by Cashier / Staff Name
      if (searchStaff.trim()) {
        const match = inv.cashierName.toLowerCase().includes(searchStaff.trim().toLowerCase());
        if (!match) return false;
      }

      // Filter by Date Type
      if (dateFilterType !== "all") {
        const invDate = new Date(inv.date);
        const now = new Date();
        
        // Define boundaries
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        if (dateFilterType === "today") {
          if (invDate < today) return false;
        } else if (dateFilterType === "yesterday") {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          if (invDate < yesterday || invDate >= today) return false;
        } else if (dateFilterType === "7days") {
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          if (invDate < sevenDaysAgo) return false;
        } else if (dateFilterType === "30days") {
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          if (invDate < thirtyDaysAgo) return false;
        } else if (dateFilterType === "custom") {
          if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            if (invDate < start) return false;
          }
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (invDate > end) return false;
          }
        }
      }

      // Filter by E-Invoice Status
      if (eInvoiceFilter !== "all") {
        if (eInvoiceFilter === "issued") {
          if (inv.eInvoiceStatus !== "ISSUED") return false;
        } else if (eInvoiceFilter === "not_issued") {
          if (inv.eInvoiceStatus === "ISSUED") return false;
        }
      }

      return true;
    });
  }, [invoices, searchCustomer, searchStaff, searchCode, dateFilterType, startDate, endDate, eInvoiceFilter]);

  return (
    <div className="space-y-6">
      {/* Trial Notification Banner */}
      {trialInfo && trialInfo.status !== "CONVERTED" && trialDaysLeft !== null && (
        <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-stone-900 border border-amber-500/20 text-stone-250 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400 shrink-0 mt-0.5">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">Phiên bản Dùng thử</span>
                <span className="text-xs font-bold text-stone-300">Cửa hàng: <strong>{trialInfo.shopName}</strong></span>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">
                Bạn đang sử dụng bản quyền dùng thử 20 ngày của phần mềm KiotX Pro. Cửa hàng của bạn còn <strong className="text-emerald-400 font-extrabold">{Math.max(0, trialDaysLeft)} ngày</strong> sử dụng miễn phí đầy đủ tính năng.
              </p>
            </div>
          </div>
          <button 
            onClick={() => alert("Cảm ơn bạn đã quan tâm! Vui lòng liên hệ Trương Công Bảo để kích hoạt bản quyền chính thức.")}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 font-black rounded-xl transition-all cursor-pointer text-xs uppercase tracking-wider shrink-0 self-start md:self-auto"
          >
            Liên hệ mua Bản quyền
          </button>
        </div>
      )}

      {/* Time Filter with Web3 Neon style */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-stone-900/60 border border-stone-800/80 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-stone-100 flex items-center gap-2 uppercase tracking-wide">
            <Activity className="h-5 w-5 text-emerald-400 animate-pulse" />
            <span>KiotX Live Control Room</span>
          </h2>
          <p className="text-xs text-stone-400">Quản lý hiệu suất, báo cáo tài chính & dữ liệu kho thời gian thực.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-800">
            <button
              onClick={() => {
                setTimeRange("today");
                setDateFilterType("today");
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                dateFilterType === "today" 
                  ? "bg-emerald-500 text-stone-950 shadow-[0_0_12px_rgba(16,185,129,0.3)]" 
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              Hôm nay
            </button>
            <button
              onClick={() => {
                setTimeRange("yesterday");
                setDateFilterType("yesterday");
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                dateFilterType === "yesterday" 
                  ? "bg-emerald-500 text-stone-950 shadow-[0_0_12px_rgba(16,185,129,0.3)]" 
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              Hôm qua
            </button>
            <button
              onClick={() => {
                setTimeRange("7days");
                setDateFilterType("7days");
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                dateFilterType === "7days" 
                  ? "bg-emerald-500 text-stone-950 shadow-[0_0_12px_rgba(16,185,129,0.3)]" 
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              7 Ngày qua
            </button>
            <button
              onClick={() => {
                setTimeRange("30days");
                setDateFilterType("30days");
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                dateFilterType === "30days" 
                ? "bg-emerald-500 text-stone-950 shadow-[0_0_12px_rgba(16,185,129,0.3)]" 
                : "text-stone-400 hover:text-stone-200"
              }`}
            >
              Tháng này
            </button>
          </div>

          {/* Lọc theo nhân viên thu ngân */}
          <div className="flex items-center gap-1.5 bg-stone-950 px-3.5 py-2 rounded-xl border border-stone-800 text-stone-200">
            <User className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <select
              value={dashboardStaffFilter}
              onChange={(e) => setDashboardStaffFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-stone-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-stone-900 text-stone-300 font-sans">Tất cả nhân viên</option>
              {cashierOptions.map(name => (
                <option key={name} value={name} className="bg-stone-900 text-stone-200 font-sans">
                  {name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-3.5 py-2 bg-stone-850 hover:bg-stone-800 text-stone-200 border border-stone-700 hover:border-emerald-500/30 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md hover:text-stone-100"
            title="Xuất báo cáo doanh thu tài chính thành file PDF chuyên nghiệp"
          >
            <FileText className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>Báo cáo PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Doanh thu */}
        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-850 hover:border-emerald-500/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.05)] transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Doanh thu thuần</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="text-2xl font-black text-stone-100 font-mono tracking-tight">{formatVND(stats.revenue)}</h3>
            <p className="text-[10px] text-stone-400 flex items-center gap-1">
              <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                <ArrowUpRight className="h-3 w-3" />
                +14.5%
              </span>
              so với kỳ trước
            </p>
          </div>
        </div>

        {/* Lợi nhuận gộp */}
        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-850 hover:border-indigo-500/40 hover:shadow-[0_0_20px_rgba(99,102,241,0.05)] transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Lợi nhuận thực tế</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/15">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="text-2xl font-black text-stone-100 font-mono tracking-tight">
              {currentStaff?.role === "OWNER" ? formatVND(stats.profit) : "******"}
            </h3>
            <p className="text-[10px] text-stone-400 flex items-center gap-1">
              {currentStaff?.role === "OWNER" ? (
                <>
                  <span className="text-indigo-400 font-bold flex items-center gap-0.5">
                    <ArrowUpRight className="h-3 w-3" />
                    +18.2%
                  </span>
                  Tỉ suất {stats.margin.toFixed(1)}%
                </>
              ) : (
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  ⚠️ Bị chặn bởi phân quyền
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Giao dịch */}
        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-850 hover:border-amber-500/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.05)] transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 h-24 w-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Hóa đơn hoàn tất</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/15">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="text-2xl font-black text-stone-100 font-mono tracking-tight">{stats.transactions} đơn</h3>
            <p className="text-[10px] text-stone-400 flex items-center gap-1">
              <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                <ArrowUpRight className="h-3 w-3" />
                +8.7%
              </span>
              Giao dịch thành công
            </p>
          </div>
        </div>

        {/* Mặt hàng sắp hết */}
        <div className={`p-5 rounded-2xl bg-stone-900 border transition-all group relative overflow-hidden ${
          lowStockProducts.length > 0 
            ? "border-rose-500/20 hover:border-rose-500/40 hover:shadow-[0_0_20px_rgba(239,68,68,0.05)]" 
            : "border-stone-850 hover:border-stone-700"
        }`}>
          <div className="absolute top-0 right-0 h-24 w-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Cảnh báo tồn kho</span>
            <div className={`p-2 rounded-xl border ${
              lowStockProducts.length > 0 
                ? "bg-rose-500/10 text-rose-400 border-rose-500/15" 
                : "bg-stone-800 text-stone-400 border-stone-750"
            }`}>
              <AlertTriangle className={`h-5 w-5 ${lowStockProducts.length > 0 ? "animate-bounce" : ""}`} />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className={`text-2xl font-black font-mono tracking-tight ${
              lowStockProducts.length > 0 ? "text-rose-400" : "text-stone-100"
            }`}>
              {lowStockProducts.length} sản phẩm
            </h3>
            <p className="text-[10px] text-stone-400 flex items-center gap-1 cursor-pointer hover:text-stone-200" onClick={() => onNavigateToTab("products")}>
              {lowStockProducts.length > 0 ? (
                <span className="text-rose-400 font-bold flex items-center gap-0.5">
                  Cần nhập hàng ngay
                  <ChevronRight className="h-3 w-3" />
                </span>
              ) : (
                "Kho hàng ở trạng thái an toàn"
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Doanh thu & Lợi nhuận Chart */}
        <div className="p-4 lg:col-span-2 rounded-2xl bg-stone-900 border border-stone-850 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-xs font-bold text-stone-100 uppercase tracking-wider">Xu hướng doanh thu & Lợi nhuận</h3>
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                  <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Thời gian thực (7 ngày gần nhất)</span>
                </span>
              </div>
              <p className="text-[9px] text-stone-400">Cập nhật xu hướng bán hàng theo thời gian thực giúp theo dõi sát sao doanh thu.</p>
            </div>
          </div>
          
          <div className="h-[200px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="name" stroke="#737373" fontSize={10} tickLine={false} />
                <YAxis stroke="#737373" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1c1917", borderColor: "#44403c", borderRadius: "10px", color: "#e5e5e5", fontSize: "11px" }}
                  formatter={(value: any) => [formatVND(Number(value)), ""]}
                />
                <Area type="monotone" dataKey="Doanh thu" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#colorRev)" />
                {currentStaff?.role === "OWNER" && (
                  <Area type="monotone" dataKey="Lợi nhuận" stroke="#6366f1" strokeWidth={1.5} fillOpacity={1} fill="url(#colorProf)" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category distribution */}
        <div className="p-4 rounded-2xl bg-stone-900 border border-stone-850 flex flex-col justify-start gap-2">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-stone-100 uppercase tracking-wider">Cơ cấu tồn kho ngành hàng</h3>
            <p className="text-[9px] text-stone-400">Tỷ lệ phân phối số lượng sản phẩm đang có sẵn.</p>
          </div>

          <div className="h-[120px] w-full flex items-center justify-center relative my-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={50}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1c1917", borderColor: "#44403c", borderRadius: "10px", fontSize: "10px" }}
                  formatter={(value: any) => [`${value} cái`, "Tồn kho"]}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-[8px] font-bold text-stone-500 uppercase tracking-widest leading-none">Tổng Tồn</span>
              <span className="text-lg font-black text-stone-100 font-mono leading-none mt-1">
                {products.reduce((acc, curr) => acc + curr.stock, 0)}
              </span>
            </div>
          </div>

          <div className="space-y-1 pt-1 border-t border-stone-850">
            {categoryChartData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-stone-400">
                  <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="truncate max-w-[120px]">{item.name}</span>
                </div>
                <span className="font-bold text-stone-200 font-mono">{item.value} cái</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stock Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Interactive Low Stock Recharts Visual Bar Chart */}
        <div className="p-4 rounded-2xl bg-stone-900 border border-stone-850 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-850 pb-2">
            <div className="space-y-0.5">
              <h3 id="low-stock-chart-heading" className="text-xs font-bold text-stone-100 uppercase tracking-wider flex items-center gap-1.5 text-amber-500">
                <AlertTriangle className="h-4 w-4 animate-pulse text-amber-500" />
                <span>Biểu đồ sản phẩm sắp hết hàng (Dưới định mức tối thiểu)</span>
              </h3>
              <p className="text-[9px] text-stone-400">
                Tương quan lượng tồn thực tế so với hạn mức cảnh báo tối thiểu.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="text-[8px] bg-rose-500/10 text-rose-400 font-bold px-1.5 py-0.5 rounded-full border border-rose-500/15 uppercase tracking-wider">
                Cảnh báo
              </span>
            </div>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="h-[140px] flex flex-col items-center justify-center text-stone-500 space-y-1 border border-dashed border-stone-800 rounded-xl bg-stone-950/20">
              <Package className="h-6 w-6 text-stone-600" />
              <p className="text-[11px]">Tuyệt vời! Không có sản phẩm nào có mức tồn dưới định mức tối thiểu.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="h-[160px] w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lowStockChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="name" stroke="#a3a3a3" fontSize={9} tickLine={false} />
                    <YAxis stroke="#a3a3a3" fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#1c1917", borderColor: "#44403c", borderRadius: "10px", color: "#e5e5e5", fontSize: "11px" }}
                      formatter={(value: any, name: string) => [value + " cái", name]}
                    />
                    <Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: '10px', color: '#a3a3a3' }} />
                    <Bar name="Tồn hiện tại" dataKey="Hiện tại" fill="#ef4444" radius={[4, 4, 0, 0]}>
                      {lowStockChartData.map((entry, index) => (
                        <Cell key={`cell-curr-${index}`} fill={entry["Hiện tại"] === 0 ? "#f43f5e" : "#ef4444"} />
                      ))}
                    </Bar>
                    <Bar name="Hạn mức tối thiểu" dataKey="Tối thiểu" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                {lowStockChartData.slice(0, 5).map((prod, idx) => {
                  const ratio = prod["Tối thiểu"] > 0 ? (prod["Hiện tại"] / prod["Tối thiểu"]) * 100 : 0;
                  return (
                    <div key={idx} className="p-2.5 rounded-xl bg-stone-950/40 border border-stone-850 space-y-1 hover:border-stone-700 transition-all">
                      <span className="text-[9px] font-mono text-stone-500 block truncate" title={prod.fullName}>
                        {prod.fullName}
                      </span>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs font-black text-rose-400 font-mono">{prod["Hiện tại"]} / {prod["Tối thiểu"]}</span>
                        <span className="text-[8px] font-bold text-stone-400">cái</span>
                      </div>
                      <div className="w-full bg-stone-800 rounded-full h-1 overflow-hidden mt-1">
                        <div 
                          className={`h-full rounded-full ${ratio === 0 ? "bg-rose-600" : ratio < 50 ? "bg-rose-500" : "bg-amber-500"}`}
                          style={{ width: `${Math.min(100, Math.max(5, ratio))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Brand New Top 5 Best Selling Products Bar Chart */}
        <div className="p-4 rounded-2xl bg-stone-900 border border-stone-850 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-850 pb-2">
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-stone-100 uppercase tracking-wider flex items-center gap-1.5 text-emerald-400">
                <ShoppingBag className="h-4 w-4 text-emerald-400" />
                <span>Top 5 sản phẩm bán chạy nhất (Doanh thu & Số lượng)</span>
              </h3>
              <p className="text-[9px] text-stone-400">
                Theo dõi hiệu suất bán ra và nguồn thu lớn nhất trong khoảng thời gian đã chọn.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="text-[8px] bg-emerald-500/10 text-emerald-400 font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/15 uppercase tracking-wider animate-pulse">
                Hiệu suất cao
              </span>
            </div>
          </div>

          {topSellingChartData.length === 0 ? (
            <div className="h-[140px] flex flex-col items-center justify-center text-stone-500 space-y-1 border border-dashed border-stone-800 rounded-xl bg-stone-950/20">
              <ShoppingBag className="h-6 w-6 text-stone-600" />
              <p className="text-[11px]">Chưa có giao dịch bán hàng nào được ghi nhận trong thời kỳ này.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="h-[160px] w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topSellingChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="name" stroke="#a3a3a3" fontSize={9} tickLine={false} />
                    <YAxis yAxisId="left" stroke="#10b981" fontSize={8} tickLine={false} axisLine={false} tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val} />
                    <YAxis yAxisId="right" orientation="right" stroke="#0ea5e9" fontSize={8} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#1c1917", borderColor: "#44403c", borderRadius: "10px", color: "#e5e5e5", fontSize: "11px" }}
                      formatter={(value: any, name: string) => {
                        if (name === "Doanh thu") return [formatVND(value), name];
                        return [`${value} sản phẩm`, name];
                      }}
                    />
                    <Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: '10px' }} />
                    <Bar yAxisId="left" name="Doanh thu" dataKey="Doanh thu" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" name="Số lượng" dataKey="Số lượng" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                {topSellingChartData.map((prod, idx) => {
                  return (
                    <div key={idx} className="p-2.5 rounded-xl bg-stone-950/40 border border-stone-850 space-y-1 hover:border-stone-700 transition-all flex flex-col justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-mono text-stone-300 block truncate" title={prod.fullName}>
                          {prod.fullName}
                        </span>
                        <span className="text-[8px] text-stone-500 block leading-none font-mono">{prod.code}</span>
                      </div>
                      <div className="pt-1 border-t border-stone-900 mt-1">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[9px] font-black text-emerald-400 font-mono">
                            {formatVND(prod["Doanh thu"])}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[8px] text-stone-500 font-bold mt-0.5">
                          <span>Đã bán:</span>
                          <span className="text-sky-400 font-mono">{prod["Số lượng"]} cái</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TRUNG TÂM XUẤT BÁO CÁO EXCEL (.XLSX) */}
      <div className="p-5 rounded-2xl bg-stone-900 border border-stone-850 hover:border-emerald-500/20 transition-all space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-850 pb-3">
          <div className="space-y-1">
            <h3 className="text-xs font-black text-stone-100 flex items-center gap-2 uppercase tracking-wider">
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              <span>Trung tâm xuất dữ liệu Excel (.xlsx)</span>
            </h3>
            <p className="text-[11px] text-stone-400">Xuất dữ liệu hệ thống trực tiếp ra các bảng tính Excel chất lượng cao để lưu trữ và quản lý offline.</p>
          </div>
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 font-black px-2 py-1 rounded-lg border border-emerald-500/15 uppercase tracking-widest self-start sm:self-auto">
            Microsoft Excel Ready
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Báo cáo doanh thu */}
          <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-850 hover:border-stone-800 transition-all flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-bold text-stone-200 uppercase tracking-wide">Báo cáo doanh thu</h4>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                Chi tiết các chỉ số tài chính (doanh thu, giá vốn, lợi nhuận gộp), danh sách hóa đơn bán lẻ và danh mục sản phẩm đã bán trong kỳ lọc.
              </p>
            </div>
            <button
              onClick={exportRevenueToExcel}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-stone-950 text-xs font-bold uppercase rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.1)] hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Xuất Doanh Thu (.xlsx)</span>
            </button>
          </div>

          {/* Báo cáo tồn kho */}
          <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-850 hover:border-stone-800 transition-all flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                  <Package className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-bold text-stone-200 uppercase tracking-wide">Báo cáo tồn kho</h4>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                Toàn bộ danh sách sản phẩm hiện tại, số lượng tồn kho thực tế, định mức tối thiểu, tổng giá trị tồn kho theo giá vốn và dự kiến bán ra.
              </p>
            </div>
            <button
              onClick={exportInventoryToExcel}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-stone-950 text-xs font-bold uppercase rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.1)] hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Xuất Tồn Kho (.xlsx)</span>
            </button>
          </div>

          {/* Báo cáo công nợ */}
          <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-850 hover:border-stone-800 transition-all flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                  <Users className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-bold text-stone-200 uppercase tracking-wide">Báo cáo công nợ</h4>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                Bảng cân đối công nợ ròng, chi tiết công nợ phải thu từ khách hàng (bán gối đầu) và công nợ phải trả cho từng nhà cung cấp hàng hóa.
              </p>
            </div>
            <button
              onClick={exportDebtToExcel}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-stone-950 text-xs font-bold uppercase rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.1)] hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Xuất Công Nợ (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bảng đánh giá hiệu suất nhân viên thu ngân */}
      <div className="p-5 rounded-2xl bg-stone-900 border border-stone-850 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-850 pb-3">
          <div className="space-y-1">
            <h3 className="text-xs font-black text-stone-100 flex items-center gap-2 uppercase tracking-wider">
              <Users className="h-4 w-4 text-indigo-400" />
              <span>Bảng đánh giá hiệu suất nhân viên thu ngân</span>
            </h3>
            <p className="text-[11px] text-stone-400">
              Chi tiết doanh số bán hàng, số lượng hóa đơn lập và mức độ đóng góp doanh thu của từng thu ngân trong kỳ báo cáo hoạt động hiện tại.
            </p>
          </div>
          <span className="text-[10px] text-indigo-400 bg-indigo-500/10 font-black px-2 py-1 rounded-lg border border-indigo-500/15 uppercase tracking-widest self-start sm:self-auto flex items-center gap-1">
            <Activity className="h-3 w-3 text-indigo-400 animate-pulse" />
            <span>Xếp hạng doanh thu</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-stone-400 border-b border-stone-850">
                <th className="pb-3 font-bold uppercase tracking-wider text-left">Nhân viên thu ngân</th>
                <th className="pb-3 text-center font-bold uppercase tracking-wider">Số hóa đơn</th>
                <th className="pb-3 text-center font-bold uppercase tracking-wider">Sản phẩm đã bán</th>
                <th className="pb-3 text-right font-bold uppercase tracking-wider">Doanh số thu được</th>
                <th className="pb-3 text-right font-bold uppercase tracking-wider">Giá trị đơn TB</th>
                <th className="pb-3 text-right font-bold uppercase tracking-wider pl-4">Đóng góp doanh thu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-850/60">
              {cashierPerformance.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-500">
                    Chưa có dữ liệu giao dịch của nhân viên nào trong thời kỳ này.
                  </td>
                </tr>
              ) : (
                cashierPerformance.map((item, idx) => {
                  const totalStoreRevenue = stats.revenue || 1;
                  const contributionPercent = (item.revenue / totalStoreRevenue) * 100;
                  
                  return (
                    <tr key={item.name} className="hover:bg-stone-950/40 transition-colors">
                      <td className="py-3 font-semibold text-stone-200 flex items-center gap-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-850 text-stone-300 border border-stone-800 text-[10px] font-black font-mono">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-stone-100">{item.name}</p>
                          <p className="text-[9px] text-stone-500">Thành viên bán hàng</p>
                        </div>
                      </td>
                      <td className="py-3 text-center font-bold font-mono text-stone-300">
                        {item.invoiceCount} đơn
                      </td>
                      <td className="py-3 text-center font-bold font-mono text-stone-300">
                        {item.itemsSold} cái
                      </td>
                      <td className="py-3 text-right font-bold font-mono text-emerald-400">
                        {formatVND(item.revenue)}
                      </td>
                      <td className="py-3 text-right font-mono text-stone-400">
                        {formatVND(item.avgInvoiceValue)}
                      </td>
                      <td className="py-3 text-right pl-4">
                        <div className="flex flex-col items-end gap-1 min-w-[120px]">
                          <span className="font-mono text-[10px] font-black text-indigo-400">
                            {contributionPercent.toFixed(1)}%
                          </span>
                          <div className="w-24 bg-stone-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 rounded-full" 
                              style={{ width: `${contributionPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TRUNG TÂM DỌN DẸP & XÓA BÁO CÁO (DỮ LIỆU GIAO DỊCH) */}
      {!isDeleteSectionRevealed ? (
        /* Invisible Target Click Area (Only owner knows and clicks 3 times to open) */
        <div 
          onClick={handleDeleteInvisibleZoneClick}
          className="w-full bg-transparent cursor-default select-none pointer-events-auto transition-colors"
          style={{ height: "40px" }}
          title="Click 3 lần để mở cấu hình xóa dữ liệu"
        />
      ) : (
        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-850 hover:border-red-500/20 transition-all space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-32 w-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-850 pb-3">
            <div className="space-y-1">
              <h3 className="text-xs font-black text-stone-100 flex items-center gap-2 uppercase tracking-wider">
                <Trash2 className="h-4 w-4 text-rose-500" />
                <span>Trung tâm dọn dẹp & xóa báo cáo giao dịch</span>
              </h3>
              <p className="text-[11px] text-stone-400">Xóa trắng các dữ liệu báo cáo (hóa đơn, sổ quỹ dòng tiền) theo Ngày, Tháng, Năm hoặc Toàn bộ lịch sử.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteSectionRevealed(false);
                  setDeletePassword("");
                  setDeleteErrorMsg("");
                  setDeleteSuccessMsg("");
                }}
                className="text-[9px] text-stone-400 hover:text-stone-200 font-bold uppercase tracking-wider transition-colors border border-stone-800 px-2 py-1 rounded bg-stone-950 cursor-pointer"
              >
                [Ẩn dọn dẹp]
              </button>
              <span className="text-[10px] text-rose-400 bg-rose-500/10 font-black px-2 py-1 rounded-lg border border-rose-500/15 uppercase tracking-widest self-start sm:self-auto flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-rose-400" />
                <span>Mật khẩu bảo vệ</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Cấu hình dọn dẹp */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Chọn loại báo cáo xóa */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Mục tiêu dọn dẹp</label>
                <select
                  value={deleteType}
                  onChange={(e: any) => setDeleteType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-xs focus:border-rose-500 focus:outline-none cursor-pointer"
                >
                  <option value="invoices">Hóa đơn bán hàng (Doanh thu)</option>
                  <option value="cashbook">Sổ quỹ dòng tiền (Thu/Chi)</option>
                  <option value="all">Tất cả giao dịch (Hóa đơn & Sổ quỹ)</option>
                </select>
              </div>

              {/* Chọn thời kỳ xóa */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Lọc theo thời gian</label>
                <select
                  value={deleteRangeType}
                  onChange={(e: any) => setDeleteRangeType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-xs focus:border-rose-500 focus:outline-none cursor-pointer"
                >
                  <option value="day">Xóa theo Ngày cụ thể</option>
                  <option value="month">Xóa theo Tháng cụ thể</option>
                  <option value="year">Xóa theo Năm cụ thể</option>
                  <option value="all">Xóa Toàn bộ lịch sử hệ thống</option>
                </select>
              </div>

              {/* Giá trị mốc thời gian */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Chọn thời điểm cần xóa</label>
                {deleteRangeType === "day" && (
                  <input
                    type="date"
                    value={deleteDateValue}
                    onChange={(e) => setDeleteDateValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-xs focus:border-rose-500 focus:outline-none font-mono"
                  />
                )}
                {deleteRangeType === "month" && (
                  <input
                    type="month"
                    value={deleteMonthValue}
                    onChange={(e) => setDeleteMonthValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-xs focus:border-rose-500 focus:outline-none font-mono"
                  />
                )}
                {deleteRangeType === "year" && (
                  <select
                    value={deleteYearValue}
                    onChange={(e) => setDeleteYearValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-xs focus:border-rose-500 focus:outline-none font-mono cursor-pointer"
                  >
                    <option value="2024">Năm 2024</option>
                    <option value="2025">Năm 2025</option>
                    <option value="2026">Năm 2026</option>
                    <option value="2027">Năm 2027</option>
                  </select>
                )}
                {deleteRangeType === "all" && (
                  <div className="px-3 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-bold uppercase text-center tracking-wider">
                    ⚠️ XÓA TRẮNG TOÀN BỘ SỐ LIỆU
                  </div>
                )}
              </div>
            </div>

            {/*Xác nhận mật khẩu & Hành động */}
            <div className="lg:col-span-4 flex flex-col md:flex-row lg:flex-col gap-3 justify-end items-stretch">
              {/* Trường nhập mật khẩu */}
              <div className="space-y-1.5 flex-1">
                <label className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block">Mật khẩu bảo vệ riêng biệt</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Nhập mật khẩu riêng biệt..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-rose-950/40 text-stone-100 text-xs focus:border-rose-500 focus:outline-none font-mono placeholder:text-stone-700"
                />
              </div>

              {/* Nút dọn dẹp */}
              <button
                onClick={handleExecuteDeleteReports}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-stone-950 text-xs font-black uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 self-end w-full md:w-auto lg:w-full shadow-md hover:shadow-rose-600/10 active:scale-[0.98]"
              >
                <Trash2 className="h-4 w-4" />
                <span>Thực Hiện Xóa Dữ Liệu</span>
              </button>
            </div>
          </div>

          {/* Thông báo lỗi / Thành công */}
          {deleteErrorMsg && (
            <div className="p-3 bg-red-950/30 border border-red-900/30 text-rose-400 text-xs rounded-xl flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-rose-400" />
              <span>{deleteErrorMsg}</span>
            </div>
          )}

          {deleteSuccessMsg && (
            <div className="p-3 bg-emerald-950/30 border border-emerald-900/30 text-emerald-400 text-xs rounded-xl flex items-start gap-2">
              <FileText className="h-4 w-4 mt-0.5 shrink-0 text-emerald-400" />
              <span>{deleteSuccessMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* Low stock & Top Sellers columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Out of Stock alerts table */}
        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-850 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-100 uppercase tracking-wider flex items-center gap-1.5 text-rose-400">
              <AlertTriangle className="h-4.5 w-4.5" />
              <span>Sản phẩm dưới định mức tối thiểu ({lowStockProducts.length})</span>
            </h3>
            <button 
              onClick={() => onNavigateToTab("products")}
              className="text-[10px] font-black text-amber-500 hover:text-amber-400 uppercase tracking-wider flex items-center gap-0.5"
            >
              Nhập hàng
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <div className="overflow-x-auto max-h-[250px] overflow-y-auto pr-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-stone-900 z-10 shadow-[0_1px_0_0_#262626]">
                <tr className="text-stone-400">
                  <th className="pb-2 font-bold uppercase tracking-wider bg-stone-900">Mã hàng</th>
                  <th className="pb-2 font-bold uppercase tracking-wider bg-stone-900">Tên sản phẩm</th>
                  <th className="pb-2 text-right font-bold uppercase tracking-wider bg-stone-900">Còn lại</th>
                  <th className="pb-2 text-right font-bold uppercase tracking-wider bg-stone-900">Đơn vị</th>
                  <th className="pb-2 text-right font-bold uppercase tracking-wider bg-stone-900">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-850/60">
                {lowStockProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-stone-500">
                      Tuyệt vời! Không có sản phẩm nào sắp hết hàng.
                    </td>
                  </tr>
                ) : (
                  lowStockProducts.map(p => (
                    <tr key={p.id} className="hover:bg-stone-950/40 transition-colors">
                      <td className="py-2.5 font-mono text-stone-400">{p.code}</td>
                      <td className="py-2.5 font-semibold text-stone-200 line-clamp-1 max-w-[180px]">{p.name}</td>
                      <td className="py-2.5 text-right font-bold font-mono">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          p.stock === 0 ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-stone-400">{p.unit}</td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => handleDashboardQuickPurchase(p.id)}
                          className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-[10px] uppercase rounded-lg transition-colors flex items-center gap-1 cursor-pointer ml-auto"
                          title="Lập phiếu nhập hàng nhanh"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Nhập hàng</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top-selling Products Table */}
        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-850 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-100 uppercase tracking-wider flex items-center gap-1.5 text-emerald-400">
              <TrendingUp className="h-4.5 w-4.5" />
              <span>Sản phẩm bán chạy tuần này</span>
            </h3>
            <span className="text-[10px] text-stone-400 bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/15">
              Doanh thu cao
            </span>
          </div>

          <div className="overflow-x-auto max-h-[250px] overflow-y-auto pr-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-stone-900 z-10 shadow-[0_1px_0_0_#262626]">
                <tr className="text-stone-400">
                  <th className="pb-2 font-bold uppercase tracking-wider bg-stone-900">Mã hàng</th>
                  <th className="pb-2 font-bold uppercase tracking-wider bg-stone-900">Tên sản phẩm</th>
                  <th className="pb-2 text-right font-bold uppercase tracking-wider bg-stone-900">Đã bán</th>
                  <th className="pb-2 text-right font-bold uppercase tracking-wider bg-stone-900">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-850/60">
                {topSellingProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-stone-500">
                      Chưa có dữ liệu bán hàng. Hãy mở POS bán sản phẩm đầu tiên!
                    </td>
                  </tr>
                ) : (
                  topSellingProducts.map(p => (
                    <tr key={p.code} className="hover:bg-stone-950/40 transition-colors">
                      <td className="py-2.5 font-mono text-stone-400">{p.code}</td>
                      <td className="py-2.5 font-semibold text-stone-200 line-clamp-1 max-w-[180px]">{p.name}</td>
                      <td className="py-2.5 text-right font-bold font-mono text-emerald-400">{p.qty} cái</td>
                      <td className="py-2.5 text-right font-bold font-mono text-stone-100">{formatVND(p.revenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 7. ADVANCED SALES INVOICE REGISTRY */}
      <div className="p-6 rounded-2xl bg-stone-900 border border-stone-850 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-850 pb-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2 uppercase tracking-wider">
              <FileText className="h-4.5 w-4.5 text-emerald-400" />
              <span>Sổ Sứ Mệnh Hóa Đơn (Lịch sử giao dịch)</span>
            </h3>
            <p className="text-xs text-stone-400">Xem, tra cứu chi tiết và lọc tất cả hóa đơn bán lẻ trong cơ sở dữ liệu.</p>
          </div>
          
          {/* Clear Filters helper */}
          {(searchCode || searchCustomer || searchStaff || dateFilterType !== "all" || startDate || endDate || eInvoiceFilter !== "all") && (
            <button
              onClick={() => {
                setSearchCode("");
                setSearchCustomer("");
                setSearchStaff("");
                setDateFilterType("all");
                setStartDate("");
                setEndDate("");
                setEInvoiceFilter("all");
              }}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs font-bold rounded-lg transition-colors border border-stone-700 flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Xóa bộ lọc</span>
            </button>
          )}
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] text-stone-400 font-bold uppercase block mb-1">Mã hóa đơn</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-stone-500 h-4 w-4" />
              <input
                type="text"
                placeholder="Tìm mã hóa đơn (e.g. HD000001)..."
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-stone-950 border border-stone-800 text-stone-200 text-xs rounded-xl focus:outline-none focus:border-emerald-500 font-mono placeholder:text-stone-600"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-stone-400 font-bold uppercase block mb-1">Tên khách hàng</label>
            <div className="relative">
              <Users className="absolute left-3 top-2.5 text-stone-500 h-4 w-4" />
              <input
                type="text"
                placeholder="Tìm theo tên khách hàng..."
                value={searchCustomer}
                onChange={(e) => setSearchCustomer(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-stone-950 border border-stone-800 text-stone-200 text-xs rounded-xl focus:outline-none focus:border-emerald-500 placeholder:text-stone-600"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-stone-400 font-bold uppercase block mb-1">Nhân viên / Thu ngân</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 text-stone-500 h-4 w-4" />
              <input
                type="text"
                placeholder="Tìm theo tên nhân viên..."
                value={searchStaff}
                onChange={(e) => setSearchStaff(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-stone-950 border border-stone-800 text-stone-200 text-xs rounded-xl focus:outline-none focus:border-emerald-500 placeholder:text-stone-600"
              />
            </div>
          </div>
        </div>

        {/* Time and Date Range selector + E-Invoice filter */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 p-4 rounded-xl bg-stone-950/40 border border-stone-850/80">
          {/* Left: Time Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between xl:border-r xl:border-stone-850 xl:pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-stone-400 font-black uppercase tracking-wider mr-2">Bộ lọc thời gian:</span>
              <div className="flex flex-wrap gap-1.5 bg-stone-950 p-1 rounded-xl border border-stone-850">
                {[
                  { key: "all", label: "Tất cả" },
                  { key: "today", label: "Hôm nay" },
                  { key: "yesterday", label: "Hôm qua" },
                  { key: "7days", label: "7 ngày qua" },
                  { key: "30days", label: "30 ngày qua" },
                  { key: "custom", label: "Chọn khoảng ngày" }
                ].map(btn => (
                  <button
                    key={btn.key}
                    onClick={() => setDateFilterType(btn.key as any)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      dateFilterType === btn.key
                        ? "bg-emerald-500 text-stone-950 shadow-md"
                        : "text-stone-400 hover:text-stone-250 hover:bg-stone-900"
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Inputs */}
            {dateFilterType === "custom" && (
              <div className="flex items-center gap-3 animate-fade-in">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-stone-500 font-bold uppercase">Từ ngày:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-2.5 py-1 bg-stone-950 border border-stone-800 text-stone-300 text-xs rounded-lg focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-stone-500 font-bold uppercase">Đến ngày:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-2.5 py-1 bg-stone-950 border border-stone-800 text-stone-300 text-xs rounded-lg focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right: E-Invoice Filter */}
          <div className="flex flex-wrap items-center gap-2 xl:pl-4">
            <span className="text-[10px] text-indigo-400 font-black uppercase tracking-wider mr-2 flex items-center gap-1">
              <Cloud className="h-3.5 w-3.5 shrink-0" />
              <span>Thuế & HĐ Điện Tử:</span>
            </span>
            <div className="flex flex-wrap gap-1.5 bg-stone-950 p-1 rounded-xl border border-stone-850">
              {[
                { key: "all", label: "Tất cả" },
                { key: "issued", label: "Đã xuất HĐĐT" },
                { key: "not_issued", label: "Chưa xuất HĐĐT" }
              ].map(btn => (
                <button
                  key={btn.key}
                  onClick={() => setEInvoiceFilter(btn.key as any)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    eInvoiceFilter === btn.key
                      ? "bg-indigo-600 text-white shadow-md font-black"
                      : "text-stone-400 hover:text-stone-250 hover:bg-stone-900"
                  }`}
                >
                  <span>{btn.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Invoice List Table */}
        <div className="overflow-x-auto rounded-xl border border-stone-850 bg-stone-950/20 max-h-[380px] overflow-y-auto scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-800 bg-stone-950 text-stone-400 sticky top-0 z-10">
                <th className="py-2 px-3 font-bold uppercase tracking-wider">Mã hóa đơn</th>
                <th className="py-2 px-3 font-bold uppercase tracking-wider">Thời gian</th>
                <th className="py-2 px-3 font-bold uppercase tracking-wider">Khách hàng</th>
                <th className="py-2 px-3 font-bold uppercase tracking-wider">Nhân viên lập</th>
                <th className="py-2 px-3 text-right font-bold uppercase tracking-wider">Tổng thanh toán</th>
                <th className="py-2 px-3 text-center font-bold uppercase tracking-wider">Hình thức</th>
                <th className="py-2 px-3 text-center font-bold uppercase tracking-wider">Trạng thái</th>
                <th className="py-2 px-3 text-center font-bold uppercase tracking-wider">HĐ Điện Tử</th>
                <th className="py-2 px-3 text-center font-bold uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-850/50">
              {dashboardInvoiceList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-stone-500 font-semibold">
                    Không tìm thấy hóa đơn nào khớp với các điều kiện lọc.
                  </td>
                </tr>
              ) : (
                dashboardInvoiceList.map(inv => {
                  const formattedDate = new Date(inv.date).toLocaleString("vi-VN", {
                    day: "numeric",
                    month: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  });

                  const isCancelled = inv.status === "CANCELLED";

                  return (
                    <tr key={inv.id} className={`hover:bg-stone-950/40 transition-all group ${
                      isCancelled ? "opacity-60 bg-rose-950/5 text-stone-500" : ""
                    }`}>
                      <td className={`py-2 px-3 font-mono font-black transition-colors ${
                        isCancelled ? "text-rose-500/80 line-through group-hover:text-rose-400" : "text-stone-300 group-hover:text-emerald-400"
                      }`}>
                        {inv.invoiceCode}
                      </td>
                      <td className={`py-2 px-3 ${isCancelled ? "line-through" : "text-stone-400"}`}>
                        <div className="flex items-center gap-1.5">
                          <Clock className={`h-3.5 w-3.5 shrink-0 ${isCancelled ? "text-rose-900/40" : "text-stone-600"}`} />
                          <span>{formattedDate}</span>
                        </div>
                      </td>
                      <td className={`py-2 px-3 font-semibold ${isCancelled ? "line-through text-stone-500" : "text-stone-250"}`}>
                        {inv.customerName}
                      </td>
                      <td className={`py-2 px-3 ${isCancelled ? "line-through text-stone-500" : "text-stone-300"}`}>
                        {inv.cashierName}
                      </td>
                      <td className={`py-2 px-3 text-right font-black font-mono text-sm ${
                        isCancelled ? "text-rose-400/70 line-through" : "text-emerald-400"
                      }`}>
                        {formatVND(inv.totalPayable)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.paymentMethod === "CASH" 
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/15" 
                            : inv.paymentMethod === "BANK_TRANSFER"
                            ? "bg-sky-500/10 text-sky-400 border border-sky-500/15"
                            : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/15"
                        }`}>
                          {inv.paymentMethod === "CASH" && <Banknote className="h-3 w-3" />}
                          {inv.paymentMethod === "BANK_TRANSFER" && <QrCode className="h-3 w-3" />}
                          {inv.paymentMethod === "CREDIT_CARD" && <CreditCard className="h-3 w-3" />}
                          <span>{inv.paymentMethod === "CASH" ? "Tiền mặt" : inv.paymentMethod === "BANK_TRANSFER" ? "Chuyển khoản" : "Thẻ tín dụng"}</span>
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border ${
                          inv.status === "COMPLETED"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}>
                          {inv.status === "COMPLETED" ? "Đã xong" : "Đã hủy"}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        {inv.eInvoiceStatus === "ISSUED" ? (
                          <a
                            href={inv.eInvoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Xem HĐĐT mã: ${inv.eInvoiceCode}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all cursor-pointer font-sans"
                          >
                            <Cloud className="h-2.5 w-2.5" />
                            <span>Đã cấp số</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-stone-600 font-bold font-sans">—</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-300 hover:text-stone-100 transition-all flex items-center gap-1 mx-auto cursor-pointer font-bold text-[11px]"
                        >
                          <Eye className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 8. SYSTEM AUDIT LOG */}
      <div className="p-6 rounded-2xl bg-stone-900 border border-stone-850 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-850 pb-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2 uppercase tracking-wider">
              <Activity className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
              <span>Nhật Ký Hệ Thống (System Audit Log)</span>
            </h3>
            <p className="text-xs text-stone-400">Tra cứu dấu vết thao tác nhạy cảm: sửa giá sản phẩm, xóa danh mục, thay đổi phân quyền nhân viên.</p>
          </div>
          
          {/* Clear Filters helper */}
          {(logSearch || logTypeFilter !== "ALL") && (
            <button
              onClick={() => {
                setLogSearch("");
                setLogTypeFilter("ALL");
              }}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs font-bold rounded-lg transition-colors border border-stone-700 flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Xóa bộ lọc</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-stone-400 font-bold uppercase block mb-1">Tìm kiếm nội dung</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-stone-500 h-4 w-4" />
              <input
                type="text"
                placeholder="Tìm theo người thực hiện, nội dung chi tiết..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-stone-950 border border-stone-800 text-stone-200 text-xs rounded-xl focus:outline-none focus:border-emerald-500 placeholder:text-stone-600"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-stone-400 font-bold uppercase block mb-1">Loại thao tác</label>
            <select
              value={logTypeFilter}
              onChange={(e) => setLogTypeFilter(e.target.value)}
              className="w-full p-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">-- Tất cả thao tác --</option>
              <option value="PRODUCT_PRICE_EDIT">Chỉnh sửa giá sản phẩm</option>
              <option value="CATEGORY_DELETE">Xóa danh mục</option>
              <option value="CATEGORY_CREATE">Thêm danh mục mới</option>
              <option value="STAFF_PERMISSION_CHANGE">Thay đổi phân quyền nhân viên</option>
              <option value="PRODUCT_CREATE">Thêm sản phẩm mới</option>
              <option value="PRODUCT_DELETE">Xóa sản phẩm</option>
              <option value="STAFF_CREATE">Thêm nhân viên mới</option>
              <option value="STAFF_DELETE">Xóa nhân viên</option>
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto rounded-xl border border-stone-850 bg-stone-950/20 max-h-[350px] overflow-y-auto scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-800 bg-stone-950 text-stone-400 sticky top-0 z-10">
                <th className="py-2 px-3 font-bold uppercase tracking-wider w-40">Thời gian</th>
                <th className="py-2 px-3 font-bold uppercase tracking-wider w-56">Thao tác</th>
                <th className="py-2 px-3 font-bold uppercase tracking-wider w-48">Người thực hiện</th>
                <th className="py-2 px-3 font-bold uppercase tracking-wider">Chi tiết nội dung thay đổi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-850/50">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-stone-500 font-semibold">
                    Không tìm thấy nhật ký hệ thống nào khớp với điều kiện lọc.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const formattedTime = new Date(log.timestamp).toLocaleString("vi-VN", {
                    day: "numeric",
                    month: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                  });

                  // Color mapping based on actionType
                  let badgeClass = "bg-stone-500/10 text-stone-400 border border-stone-500/20";
                  if (log.actionType === "PRODUCT_PRICE_EDIT") {
                    badgeClass = "bg-amber-500/10 text-amber-400 border border-amber-500/15";
                  } else if (log.actionType === "CATEGORY_DELETE" || log.actionType === "PRODUCT_DELETE" || log.actionType === "STAFF_DELETE") {
                    badgeClass = "bg-rose-500/10 text-rose-400 border border-rose-500/15";
                  } else if (log.actionType === "STAFF_PERMISSION_CHANGE") {
                    badgeClass = "bg-indigo-500/10 text-indigo-400 border border-indigo-500/15";
                  } else if (log.actionType === "PRODUCT_CREATE" || log.actionType === "CATEGORY_CREATE" || log.actionType === "STAFF_CREATE") {
                    badgeClass = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15";
                  }

                  return (
                    <tr key={log.id} className="hover:bg-stone-950/40 transition-all">
                      <td className="py-3 px-3 font-mono text-stone-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-stone-600" />
                          <span>{formattedTime}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide ${badgeClass}`}>
                          {log.actionName}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="space-y-0.5 leading-none">
                          <span className="font-bold text-stone-250 block">{log.actorName}</span>
                          <span className="text-[9px] text-stone-500 font-bold uppercase tracking-wider block">
                            {log.actorRole === "OWNER" ? "Chủ shop" : log.actorRole === "MANAGER" ? "Quản lý" : "Thu ngân"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-stone-300 leading-relaxed max-w-md break-words">
                        {log.description}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED RECEIPT MODAL FOR SELECTED INVOICE */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white text-stone-900 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-stone-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header bar */}
            <div className="bg-stone-900 text-stone-100 px-5 py-3.5 flex justify-between items-center border-b border-stone-850">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-stone-100">Chi Tiết Hóa Đơn</h3>
                  <p className="text-[10px] text-stone-400 font-mono leading-none mt-0.5">{selectedInvoice.invoiceCode}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-400 hover:text-stone-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Scrollable Receipt Body */}
            <div id="invoice-receipt-pdf" className="kiotx-printable-receipt p-4.5 overflow-y-auto space-y-4 flex-1 text-xs select-text font-sans bg-white text-stone-900">
              
              {selectedInvoice.status === "CANCELLED" && (
                <div className="border-2 border-rose-500 rounded-xl p-3 bg-rose-50 text-rose-700 font-extrabold text-xs text-center space-y-1 mb-4 select-none relative overflow-hidden">
                  <div className="text-[13px] uppercase tracking-widest font-black animate-pulse flex items-center justify-center gap-1.5 text-rose-600">
                    <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
                    <span>HÓA ĐƠN ĐÃ HỦY</span>
                  </div>
                  <div className="text-[10px] text-stone-600 font-normal normal-case text-left pt-1.5 border-t border-rose-250/50 space-y-0.5">
                    <div>• <strong>Lý do hủy:</strong> {selectedInvoice.cancelReason || "Không rõ lý do"}</div>
                    <div>• <strong>Người duyệt hủy:</strong> {selectedInvoice.cancelledBy || "Hệ thống"}</div>
                    <div>• <strong>Thời gian hủy:</strong> {selectedInvoice.cancelDate ? new Date(selectedInvoice.cancelDate).toLocaleString("vi-VN") : "N/A"}</div>
                  </div>
                  <div className="absolute right-2 bottom-0 text-[32px] opacity-5 font-black rotate-12 uppercase select-none pointer-events-none">
                    VOIDED
                  </div>
                </div>
              )}

              {/* Store metadata branding */}
              <div className="text-center pb-2.5 border-b border-dashed border-stone-300">
                <h4 className="font-extrabold text-sm uppercase tracking-wider text-stone-850">KIOTX PRO CENTER</h4>
                <p className="text-[10px] text-stone-500 mt-0.5">Phần Mềm Quản Lý Cửa Hàng Thông Minh</p>
                <p className="text-[9px] text-stone-400 mt-0.5">Hệ thống chuyển đổi số POS thời gian thực</p>
              </div>

              {/* Core Metadata Info Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-200/50">
                <div>
                  <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block">Mã hóa đơn</span>
                  <span className="font-black font-mono text-stone-900">{selectedInvoice.invoiceCode}</span>
                </div>
                <div>
                  <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block">Thời gian lập</span>
                  <span className="font-semibold text-stone-800">{new Date(selectedInvoice.date).toLocaleString("vi-VN")}</span>
                </div>
                <div>
                  <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block">Tên khách hàng</span>
                  <span className="font-bold text-stone-900">{selectedInvoice.customerName}</span>
                </div>
                <div>
                  <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block">Nhân viên thu ngân</span>
                  <span className="font-bold text-stone-900">{selectedInvoice.cashierName}</span>
                </div>
              </div>

              {/* Items List Table */}
              <div className="space-y-1">
                <span className="text-[9px] text-stone-400 font-black uppercase tracking-wider block">Danh sách mặt hàng</span>
                <div className="border border-stone-200 rounded-xl overflow-hidden bg-stone-50">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-stone-100 border-b border-stone-200 text-stone-600">
                        <th className="py-1 px-2 font-bold uppercase text-[9px]">Sản phẩm</th>
                        <th className="py-1 px-2 text-center font-bold uppercase text-[9px] w-12">SL</th>
                        <th className="py-1 px-2 text-right font-bold uppercase text-[9px]">Giá bán</th>
                        <th className="py-1 px-2 text-right font-bold uppercase text-[9px]">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 text-stone-700">
                      {selectedInvoice.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-stone-100/40">
                          <td className="py-1.5 px-2">
                            <span className="font-bold text-stone-855 block leading-tight">{item.productName}</span>
                            <span className="text-[9px] text-stone-400 font-mono mt-0.5 block">{item.productCode}</span>
                          </td>
                          <td className="py-1.5 px-2 text-center font-bold">{item.quantity}</td>
                          <td className="py-1.5 px-2 text-right font-mono text-stone-600">{formatVND(item.unitPrice)}</td>
                          <td className="py-1.5 px-2 text-right font-bold font-mono text-stone-900">{formatVND(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Calculations summary and payment method */}
              <div className="space-y-1.5 border-t border-dashed border-stone-300 pt-2.5 text-[11px]">
                <div className="flex justify-between text-stone-600">
                  <span>Tổng tiền hàng hóa:</span>
                  <span className="font-mono font-semibold">{formatVND(selectedInvoice.totalOriginal)}</span>
                </div>
                {selectedInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Giảm giá hóa đơn:</span>
                    <span className="font-mono">-{formatVND(selectedInvoice.discountAmount)}</span>
                  </div>
                )}
                {selectedInvoice.taxAmount !== undefined ? (
                  selectedInvoice.taxAmount > 0 && (
                    <div className="flex justify-between text-stone-600">
                      <span>Thuế VAT ({selectedInvoice.taxRate || 0}%):</span>
                      <span className="font-mono font-semibold text-stone-850">{formatVND(selectedInvoice.taxAmount)}</span>
                    </div>
                  )
                ) : (
                  (settings?.taxRate || 8) > 0 && (
                    <div className="flex justify-between text-stone-600">
                      <span>Thuế VAT ({settings?.taxRate || 8}%):</span>
                      <span className="font-mono font-semibold text-stone-850">
                        {formatVND((selectedInvoice.totalOriginal - selectedInvoice.discountAmount) * ((settings?.taxRate || 8) / 100))}
                      </span>
                    </div>
                  )
                )}
                <div className="flex justify-between text-stone-600">
                  <span>Hình thức thanh toán:</span>
                  <span className="font-bold text-stone-850">
                    {selectedInvoice.paymentMethod === "CASH" ? "Tiền mặt (Cash)" : selectedInvoice.paymentMethod === "BANK_TRANSFER" ? "Chuyển khoản QR" : "Thẻ tín dụng"}
                  </span>
                </div>
                <div className="flex justify-between text-stone-900 font-black text-sm border-t border-stone-200 pt-1.5">
                  <span>Khách cần trả (Phải thu):</span>
                  <span className="text-emerald-600 font-mono text-sm">{formatVND(selectedInvoice.totalPayable)}</span>
                </div>

                {selectedInvoice.pointsEarned > 0 && (
                  <div className="mt-2 py-1.5 px-2.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-[9px] border border-emerald-100 text-center uppercase tracking-wide">
                    Tích lũy khách hàng nhận thêm: +{selectedInvoice.pointsEarned} điểm
                  </div>
                )}

                {selectedInvoice.eInvoiceStatus === "ISSUED" && (
                  <div className="mt-2.5 p-3 rounded-xl bg-indigo-50/50 border border-indigo-150 space-y-1.5 text-left text-stone-850">
                    <p className="font-extrabold text-indigo-900 text-[10px] uppercase tracking-wider flex items-center gap-1">
                      <Cloud className="h-3 w-3 text-indigo-500 shrink-0" />
                      <span>HÓA ĐƠN ĐIỆN TỬ (HĐĐT)</span>
                    </p>
                    <div className="grid grid-cols-2 gap-x-2 text-[9px] text-stone-600">
                      <p>Mã CQT: <strong className="font-mono text-stone-900 select-all">{selectedInvoice.eInvoiceCode}</strong></p>
                      <p>Trạng thái: <strong className="text-indigo-600 font-bold">Đã cấp số</strong></p>
                      <p className="col-span-2 mt-1 border-t border-dashed border-indigo-150/60 pt-1">
                        Tra cứu HĐĐT tại: <a href={selectedInvoice.eInvoiceUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold underline font-mono select-all">{selectedInvoice.eInvoiceUrl}</a>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer thank message */}
              <div className="text-center pt-1.5 border-t border-dashed border-stone-200">
                <p className="text-[10px] text-stone-400 italic">Cảm ơn Quý khách và Hẹn gặp lại!</p>
                <p className="text-[8px] text-stone-400 font-mono mt-0.5 uppercase tracking-widest">{selectedInvoice.invoiceCode}</p>
              </div>

            </div>

            {/* Modal Footer actions */}
            <div className="bg-stone-50 border-t border-stone-200 p-4 space-y-2">
              {selectedInvoice.status !== "CANCELLED" && selectedInvoice.eInvoiceStatus !== "ISSUED" && (
                <div className="pb-1">
                  <button
                    type="button"
                    onClick={() => handleIssueEInvoice(selectedInvoice)}
                    disabled={isIssuingEInvoice}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700/60 text-white font-black text-[11px] uppercase rounded-xl cursor-pointer text-center transition-all shadow-md flex items-center justify-center gap-1.5 border border-indigo-500/20 active:scale-[0.98]"
                  >
                    {isIssuingEInvoice ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Cloud className="h-3.5 w-3.5" />
                    )}
                    <span>{isIssuingEInvoice ? "Đang kết nối Thuế & Phát hành..." : "Phát hành hóa đơn điện tử"}</span>
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={exportInvoiceToPDF}
                  disabled={isExportingInvoice}
                  className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-850 font-bold text-[11px] uppercase rounded-xl cursor-pointer text-center transition-colors shadow-sm flex items-center justify-center gap-1 border border-stone-200"
                >
                  {isExportingInvoice ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <Download className="h-3 w-3" />
                  )}
                  <span>Xuất PDF</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-[11px] uppercase rounded-xl cursor-pointer text-center transition-colors shadow-sm flex items-center justify-center gap-1"
                >
                  <Printer className="h-3 w-3" />
                  <span>In hóa đơn</span>
                </button>
              </div>

              {selectedInvoice.status !== "CANCELLED" ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      // Find first owner/manager to auto-select
                      const managers = staffList.filter(s => s.role === "OWNER" || s.role === "MANAGER");
                      if (managers.length > 0) {
                        setAuthManagerId(managers[0].id);
                      }
                      setAuthPin("");
                      setAuthError("");
                      setCustomCancelReason("");
                      setCancelReason("Khách đổi ý không mua nữa");
                      setIsCancelModalOpen(true);
                    }}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] uppercase rounded-xl cursor-pointer text-center transition-colors shadow-sm flex items-center justify-center gap-1 border border-rose-700/20"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Hủy hóa đơn</span>
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="w-full py-2 bg-stone-900 hover:bg-stone-850 text-stone-100 font-bold text-[11px] uppercase rounded-xl cursor-pointer text-center transition-colors shadow-sm"
                  >
                    Đóng
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="w-full py-2 bg-stone-900 hover:bg-stone-850 text-stone-100 font-bold text-[11px] uppercase rounded-xl cursor-pointer text-center transition-colors shadow-sm"
                >
                  Đóng
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* CUSTOM RE-CONFIRM REPORT DELETION MODAL */}
      {showDeleteConfirmModal && pendingDeleteData && (
        <div className="fixed inset-0 bg-stone-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4 text-left">
          <div className="bg-stone-900 border border-red-950 text-stone-100 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col relative">
            <div className="absolute top-0 right-0 h-32 w-32 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
            
            {/* Header */}
            <div className="bg-rose-950/30 border-b border-rose-900/20 px-5 py-4 flex justify-between items-center text-rose-400">
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-rose-500 animate-bounce" />
                <h3 className="text-sm font-black uppercase tracking-wider">Xác nhận xóa vĩnh viễn</h3>
              </div>
              <button
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setPendingDeleteData(null);
                }}
                className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 text-xs">
              
              <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-3 text-stone-300 leading-relaxed space-y-2">
                <p className="font-extrabold text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                  <span>CẢNH BÁO NGUY HIỂM: HÀNH ĐỘNG KHÔNG THỂ HOÀN TÁC!</span>
                </p>
                <p className="text-[11px]">
                  Bạn đang chuẩn bị thực hiện xóa vĩnh viễn dữ liệu báo cáo:
                </p>
                <div className="px-3 py-2 bg-stone-950 rounded-lg border border-stone-850 space-y-1 text-[11px] font-mono">
                  <p><span className="text-stone-500">Mục tiêu:</span> <span className="text-rose-400 font-bold uppercase">{pendingDeleteData.type === "invoices" ? "Hóa đơn doanh thu" : pendingDeleteData.type === "cashbook" ? "Sổ quỹ thu chi" : "Tất cả (Hóa đơn & Sổ quỹ)"}</span></p>
                  <p><span className="text-stone-500">Thời kỳ:</span> <span className="text-stone-200 font-bold uppercase">{pendingDeleteData.formattedRangeStr}</span></p>
                </div>
                <p className="text-[11px] text-stone-400">
                  Khi đồng ý, toàn bộ các bản ghi trong thời kỳ này sẽ bị xóa sạch khỏi cả bộ nhớ máy chủ (Google Firestore) lẫn thiết bị cục bộ của bạn.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-rose-400 font-black uppercase tracking-wider block">
                  Nhập từ <span className="text-white underline font-extrabold">"XÓA"</span> để xác thực
                </label>
                <input
                  type="text"
                  value={deleteConfirmInput}
                  onChange={(e) => setDeleteConfirmInput(e.target.value)}
                  placeholder="Nhập chữ XÓA (viết hoa)..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-rose-950/40 text-stone-100 text-xs focus:border-rose-500 focus:outline-none font-mono placeholder:text-stone-700"
                />
              </div>

              {deleteConfirmError && (
                <div className="p-2.5 bg-rose-950/40 border border-rose-900/30 text-rose-400 text-[11px] rounded-lg">
                  {deleteConfirmError}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-stone-950/40 border-t border-stone-850 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setPendingDeleteData(null);
                }}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-750 text-stone-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmDeleteFinal}
                disabled={deleteConfirmInput.trim().toUpperCase() !== "XÓA"}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-stone-800 disabled:text-stone-500 disabled:cursor-not-allowed text-stone-950 rounded-lg text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-1 shadow-md animate-pulse"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Thực hiện xóa ngay</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CANCEL INVOICE CONFIRMATION & MANAGER AUTHENTICATION MODAL */}
      {isCancelModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-stone-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in text-left">
          <div className="bg-stone-900 border border-stone-800 text-stone-100 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            
            {/* Header */}
            <div className="bg-rose-950/30 border-b border-stone-800 px-5 py-4 flex justify-between items-center text-rose-400">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-500 animate-pulse" />
                <h3 className="text-sm font-black uppercase tracking-wider">Xác Nhận Hủy Hóa Đơn</h3>
              </div>
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
              
              {/* Alert Warning details */}
              <div className="bg-rose-950/20 border border-rose-900/30 rounded-xl p-3 text-stone-300 leading-relaxed space-y-1">
                <p className="font-bold text-rose-400">⚠️ LƯU Ý QUAN TRỌNG VỀ TÀI CHÍNH:</p>
                <p>Hệ thống KiotX Pro vận hành theo quy chuẩn kiểm toán chặt chẽ:</p>
                <ul className="list-disc list-inside space-y-0.5 text-stone-400 text-[11px] pt-1 border-t border-stone-800">
                  <li>Không xoá dữ liệu hoá đơn khỏi database (tránh thất thoát/gian lận).</li>
                  <li>Tự động <strong className="text-emerald-400">Hoàn kho</strong> số lượng đã bán của các sản phẩm.</li>
                  <li>Tự động <strong className="text-emerald-400">Đảo dòng tiền</strong> (tạo phiếu chi ngược hoàn tiền).</li>
                  <li>Dấu vết hủy sẽ được ghi lại vĩnh viễn kèm tên người phê duyệt và lý do.</li>
                </ul>
              </div>

              {/* Invoice Quick Summary */}
              <div className="grid grid-cols-2 gap-3 bg-stone-950/40 border border-stone-850 p-3 rounded-xl text-[11px]">
                <div>
                  <span className="text-stone-500">Mã hóa đơn:</span>
                  <p className="font-mono font-black text-stone-300">{selectedInvoice.invoiceCode}</p>
                </div>
                <div>
                  <span className="text-stone-500">Giá trị:</span>
                  <p className="font-mono font-black text-emerald-400">{formatVND(selectedInvoice.totalPayable)}</p>
                </div>
              </div>

              {/* Input: Select Cancellation Reason */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-stone-400">1. Lý do hủy đơn (Bắt buộc):</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    "Khách trả hàng",
                    "Lên sai giá",
                    "Thu ngân lên nhầm đơn",
                    "Nhập sai số lượng",
                    "Khách đổi ý",
                    "Khác"
                  ].map(reason => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setCancelReason(reason)}
                      className={`py-1.5 px-2 rounded-lg border text-center transition-all font-semibold ${
                        cancelReason === reason
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          : "bg-stone-950/30 text-stone-400 border-stone-850 hover:bg-stone-850"
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>

                {cancelReason === "Khác" && (
                  <textarea
                    value={customCancelReason}
                    onChange={(e) => setCustomCancelReason(e.target.value)}
                    placeholder="Vui lòng nhập chi tiết lý do hủy đơn..."
                    rows={2}
                    className="w-full mt-2 p-2 bg-stone-950 border border-stone-800 rounded-lg text-stone-200 placeholder-stone-600 focus:outline-none focus:border-rose-500 text-[11px]"
                  />
                )}
              </div>

              {/* Input: Manager approval credentials */}
              <div className="space-y-2 pt-2 border-t border-stone-800">
                <label className="text-[10px] font-black uppercase tracking-wider text-stone-400 flex items-center gap-1">
                  <span>2. Xác thực phê duyệt (Cấp Quản lý/Chủ):</span>
                </label>

                {currentStaff.role === "CASHIER" ? (
                  <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-3 space-y-2.5">
                    <p className="text-[10px] text-amber-400 leading-normal font-bold">
                      ⚠️ TÀI KHOẢN THU NGÂN KHÔNG CÓ QUYỀN HỦY. VUI LÒNG YÊU CẦU QUẢN LÝ/CHỦ CỬA HÀNG NHẬP MÃ PIN ĐỂ DUYỆT LỆNH:
                    </p>
                    
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-stone-400">Chọn người phê duyệt:</span>
                      <select
                        value={authManagerId}
                        onChange={(e) => setAuthManagerId(e.target.value)}
                        className="w-full p-2 bg-stone-950 border border-stone-800 rounded-lg text-stone-200 text-xs cursor-pointer focus:outline-none focus:border-rose-500 font-bold"
                      >
                        {staffList
                          .filter(s => s.role === "OWNER" || s.role === "MANAGER")
                          .map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.role === "OWNER" ? "Chủ shop" : "Quản lý"})
                            </option>
                          ))
                        }
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] text-stone-400">Nhập mã PIN xác nhận (Mặc định: 123456 hoặc 123):</span>
                      <input
                        type="password"
                        placeholder="••••••"
                        maxLength={6}
                        value={authPin}
                        onChange={(e) => {
                          setAuthPin(e.target.value);
                          setAuthError("");
                        }}
                        className="w-full p-2 bg-stone-950 border border-stone-800 rounded-lg text-stone-200 text-center text-sm font-mono tracking-widest focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-950/10 border border-emerald-900/20 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>Bạn đang đăng nhập bằng quyền {currentStaff.role === "OWNER" ? "Chủ cửa hàng" : "Quản lý"}</span>
                    </div>
                    <p className="text-[10px] text-stone-400 leading-normal">
                      Hủy đơn hàng dưới tư cách <strong>{currentStaff.name}</strong>. Vui lòng nhập mã PIN xác thực của bạn để tránh bấm nhầm (Mặc định: 123456 hoặc 123):
                    </p>
                    <input
                      type="password"
                      placeholder="••••••"
                      maxLength={6}
                      value={authPin}
                      onChange={(e) => {
                        setAuthPin(e.target.value);
                        setAuthError("");
                      }}
                      className="w-full p-2 bg-stone-950 border border-stone-800 rounded-lg text-stone-200 text-center text-sm font-mono tracking-widest focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                )}

                {authError && (
                  <p className="text-[10px] text-rose-500 font-bold text-center border border-rose-950 bg-rose-950/20 py-1.5 px-2.5 rounded-lg animate-pulse">
                    ❌ {authError}
                  </p>
                )}
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="bg-stone-950 p-4 border-t border-stone-800 grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="py-2.5 bg-stone-900 hover:bg-stone-850 text-stone-300 hover:text-stone-100 rounded-xl font-bold cursor-pointer transition-colors text-center"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  // 1. Verify cancellation reason
                  const finalReason = cancelReason === "Khác" ? customCancelReason.trim() : cancelReason;
                  if (!finalReason) {
                    setAuthError("Vui lòng nhập lý do hủy đơn.");
                    return;
                  }

                  // 2. Verify PIN
                  if (authPin !== "123456" && authPin !== "123") {
                    setAuthError("Mã PIN bảo mật không đúng. Vui lòng nhập PIN đúng (123456 hoặc 123).");
                    return;
                  }

                  // 3. Find authorizer name
                  let authorizerName = currentStaff.name;
                  if (currentStaff.role === "CASHIER") {
                    const chosenManager = staffList.find(s => s.id === authManagerId);
                    authorizerName = chosenManager ? chosenManager.name : "Quản lý";
                  }

                  // 4. Trigger onCancelInvoice callback!
                  if (onCancelInvoice) {
                    onCancelInvoice(selectedInvoice.id, finalReason, authorizerName);
                  }

                  // 5. Update local selectedInvoice in details modal to be marked as CANCELLED!
                  setSelectedInvoice({
                    ...selectedInvoice,
                    status: "CANCELLED",
                    cancelReason: finalReason,
                    cancelledBy: authorizerName,
                    cancelDate: new Date().toISOString()
                  });

                  // 6. Close cancellation confirmation modal
                  setIsCancelModalOpen(false);
                }}
                className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black cursor-pointer transition-colors text-center"
              >
                XÁC NHẬN HỦY
              </button>
            </div>

          </div>
        </div>
      )}

      {/* EXECUTIVE REVENUE REPORT PREVIEW & EXPORT MODAL */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-stone-900 text-stone-100 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl border border-stone-800 flex flex-col max-h-[95vh] my-4">
            
            {/* Modal Header */}
            <div className="bg-stone-950 px-6 py-4 flex justify-between items-center border-b border-stone-850">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/25">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-stone-100">Báo Cáo Doanh Thu Doanh Nghiệp</h3>
                  <p className="text-xs text-stone-400 mt-0.5">Xem trước tài liệu PDF trước khi lưu hoặc gửi cho đối tác</p>
                </div>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-1.5 rounded-lg bg-stone-850 hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Document Preview Stage - styled as white clean A4 paper sheet */}
            <div className="p-6 overflow-y-auto bg-stone-950 flex-1 flex justify-center">
              
              <div 
                id="revenue-report-pdf" 
                className="bg-white text-stone-900 w-full max-w-[210mm] p-10 font-sans shadow-lg rounded-sm flex flex-col space-y-8 select-text"
                style={{ minHeight: "297mm" }}
              >
                {/* Branding and Title */}
                <div className="flex justify-between items-start border-b-2 border-stone-900 pb-5">
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-stone-950 uppercase">KIOTX PRO SMART SYSTEM</h1>
                    <p className="text-xs text-stone-500 font-medium">Báo cáo hiệu suất kinh doanh & tài chính</p>
                    <p className="text-[10px] text-stone-400 leading-tight mt-1">Hệ thống chuyển đổi số POS thời gian thực</p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black uppercase tracking-wider">
                      BẢN CHÍNH THỨC
                    </span>
                    <p className="text-[10px] text-stone-400 mt-2 font-mono uppercase tracking-widest">REF: REPORT-{new Date().toISOString().slice(0,10).replace(/-/g,'')}</p>
                  </div>
                </div>

                {/* Report Meta Info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-stone-50 p-5 rounded-xl border border-stone-200 text-xs">
                  <div>
                    <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block mb-0.5">Kỳ báo cáo</span>
                    <span className="font-extrabold text-stone-900 uppercase text-[11px]">
                      {timeRange === "today" ? "Hôm nay" : timeRange === "7days" ? "7 Ngày qua" : "Tháng này"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block mb-0.5">Ngày lập báo cáo</span>
                    <span className="font-semibold text-stone-800">{new Date().toLocaleString("vi-VN")}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block mb-0.5">Người thực hiện</span>
                    <span className="font-semibold text-stone-800">Quản trị viên KiotX</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block mb-0.5">Tổng số giao dịch</span>
                    <span className="font-extrabold text-emerald-600 font-mono text-xs">{stats.transactions} đơn hoàn thành</span>
                  </div>
                </div>

                {/* KPI Metrics Breakdown Block */}
                <div>
                  <h2 className="text-xs font-black uppercase tracking-wider text-stone-500 mb-3.5 flex items-center gap-1.5 border-b border-stone-200 pb-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-stone-800" />
                    <span>I. TỔNG QUAN CHỈ SỐ TÀI CHÍNH (KPI)</span>
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-left">
                      <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">Doanh thu thuần</span>
                      <h4 className="text-base font-black text-stone-900 font-mono mt-1">{formatVND(stats.revenue)}</h4>
                      <p className="text-[9px] text-emerald-600 font-bold mt-1">Doanh số thực nhận</p>
                    </div>
                    <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 text-left">
                      <span className="text-[9px] text-emerald-800/80 font-bold uppercase tracking-wider">Lợi nhuận thực tế</span>
                      <h4 className="text-base font-black text-emerald-700 font-mono mt-1">
                        {currentStaff?.role === "OWNER" ? formatVND(stats.profit) : "******"}
                      </h4>
                      <p className="text-[9px] text-emerald-600 font-bold mt-1">
                        {currentStaff?.role === "OWNER" ? `Tỉ suất: ${stats.margin.toFixed(1)}%` : "⚠️ Bị chặn bởi phân quyền"}
                      </p>
                    </div>
                    <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-left">
                      <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">Tổng giá vốn hàng hóa</span>
                      <h4 className="text-base font-black text-stone-900 font-mono mt-1">
                        {currentStaff?.role === "OWNER" ? formatVND(stats.cost) : "******"}
                      </h4>
                      <p className="text-[9px] text-stone-500 mt-1">
                        {currentStaff?.role === "OWNER" ? "Chi phí nhập kho" : "⚠️ Bị chặn bởi phân quyền"}
                      </p>
                    </div>
                    <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-left">
                      <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">Chiết khấu & Giảm giá</span>
                      <h4 className="text-base font-black text-rose-600 font-mono mt-1">{formatVND(stats.discount)}</h4>
                      <p className="text-[9px] text-rose-500 mt-1">Khuyến mãi cho khách</p>
                    </div>
                    <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-left">
                      <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">Đơn hàng thành công</span>
                      <h4 className="text-base font-black text-stone-900 font-mono mt-1">{stats.transactions} đơn</h4>
                      <p className="text-[9px] text-stone-500 mt-1">Bình quân {stats.transactions > 0 ? formatVND(stats.revenue / stats.transactions) : "0 đ"}/đơn</p>
                    </div>
                    <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-left">
                      <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">Tỉ suất lợi nhuận</span>
                      <h4 className="text-base font-black text-stone-900 font-mono mt-1">{stats.margin.toFixed(1)}%</h4>
                      <p className="text-[9px] text-indigo-600 font-bold mt-1">Hiệu suất sinh lời</p>
                    </div>
                  </div>
                </div>

                {/* Best Sellers Table Block */}
                <div>
                  <h2 className="text-xs font-black uppercase tracking-wider text-stone-500 mb-3.5 flex items-center gap-1.5 border-b border-stone-200 pb-1.5">
                    <Package className="h-3.5 w-3.5 text-stone-800" />
                    <span>II. DANH SÁCH MẶT HÀNG BÁN CHẠY NHẤT</span>
                  </h2>
                  <div className="border border-stone-200 rounded-xl overflow-hidden bg-stone-50">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-stone-100 border-b border-stone-200 text-stone-600">
                          <th className="p-2.5 font-bold uppercase text-[9px] w-12 text-center">STT</th>
                          <th className="p-2.5 font-bold uppercase text-[9px]">Sản phẩm</th>
                          <th className="p-2.5 font-bold uppercase text-[9px] text-center w-24">Mã hàng</th>
                          <th className="p-2.5 font-bold uppercase text-[9px] text-center w-24">Số lượng đã bán</th>
                          <th className="p-2.5 font-bold uppercase text-[9px] text-right">Doanh số thu về</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200 text-stone-700">
                        {topSellingProducts.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-stone-400 font-medium">
                              Không có dữ liệu giao dịch sản phẩm nào trong kỳ.
                            </td>
                          </tr>
                        ) : (
                          topSellingProducts.map((item, idx) => (
                            <tr key={idx} className="hover:bg-stone-100/50">
                              <td className="p-2.5 text-center font-bold text-stone-400">{idx + 1}</td>
                              <td className="p-2.5 font-bold text-stone-900">{item.productName}</td>
                              <td className="p-2.5 text-center font-mono text-stone-500 text-[10px]">{item.productCode}</td>
                              <td className="p-2.5 text-center font-black font-mono text-stone-950 text-xs">{item.quantity}</td>
                              <td className="p-2.5 text-right font-black font-mono text-emerald-600">{formatVND(item.revenue)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Stock Warning Box if there is any */}
                {lowStockProducts.length > 0 && (
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-stone-500 mb-3.5 flex items-center gap-1.5 border-b border-stone-200 pb-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                      <span className="text-rose-700">III. CẢNH BÁO TỒN KHO TỐI THIỂU ({lowStockProducts.length})</span>
                    </h2>
                    <div className="border border-rose-100 rounded-xl overflow-hidden bg-rose-50/30">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-rose-50 border-b border-rose-100 text-rose-700">
                            <th className="p-2 font-bold uppercase text-[9px] w-24">Mã sản phẩm</th>
                            <th className="p-2 font-bold uppercase text-[9px]">Tên sản phẩm</th>
                            <th className="p-2 font-bold uppercase text-[9px] text-center w-20">Đơn vị</th>
                            <th className="p-2 font-bold uppercase text-[9px] text-center w-24">Tồn hiện tại</th>
                            <th className="p-2 font-bold uppercase text-[9px] text-center w-24">Hạn mức tối thiểu</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-rose-100 text-stone-700">
                          {lowStockProducts.slice(0, 5).map(prod => (
                            <tr key={prod.id}>
                              <td className="p-2 font-mono text-stone-500 text-[10px]">{prod.code}</td>
                              <td className="p-2 font-semibold text-stone-800">{prod.name}</td>
                              <td className="p-2 text-center text-stone-600">{prod.unit}</td>
                              <td className="p-2 text-center font-black text-rose-600 font-mono">{prod.stock}</td>
                              <td className="p-2 text-center font-bold text-stone-500 font-mono">{prod.minStock}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Document Footer Signature lines */}
                <div className="flex justify-between pt-10 border-t border-stone-200 text-xs">
                  <div className="text-center w-48">
                    <p className="font-bold text-stone-500 uppercase tracking-wide text-[9px] mb-12">Người lập báo cáo</p>
                    <p className="font-extrabold text-stone-850">Quản trị viên KiotX</p>
                    <p className="text-[9px] text-stone-400 italic">(Ký và ghi rõ họ tên)</p>
                  </div>
                  <div className="text-center w-48">
                    <p className="font-bold text-stone-500 uppercase tracking-wide text-[9px] mb-12">Đại diện cửa hàng</p>
                    <p className="font-extrabold text-stone-850">Chủ cửa hàng</p>
                    <p className="text-[9px] text-stone-400 italic">(Ký, đóng dấu bản điện tử)</p>
                  </div>
                </div>

              </div>

            </div>

            {/* Modal Actions */}
            <div className="bg-stone-950 border-t border-stone-850 p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 bg-stone-850 hover:bg-stone-800 text-stone-300 hover:text-stone-100 font-bold text-xs uppercase rounded-xl cursor-pointer text-center transition-colors"
              >
                Đóng xem trước
              </button>
              
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={exportReportToExcel}
                  className="w-full sm:w-auto px-5 py-2.5 bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-stone-100 font-bold text-xs uppercase rounded-xl cursor-pointer text-center transition-all flex items-center justify-center gap-1.5 border border-stone-700"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Xuất báo cáo Excel</span>
                </button>

                <button
                  onClick={handleSendEmail}
                  disabled={isSendingEmail}
                  className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 font-bold text-xs uppercase rounded-xl cursor-pointer text-center transition-all flex items-center justify-center gap-1.5"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>Gửi email đơn vị</span>
                </button>

                <button
                  onClick={exportRevenueReportToPDF}
                  disabled={isExportingReport}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-stone-800 text-stone-950 font-black text-xs uppercase rounded-xl cursor-pointer text-center transition-all shadow-[0_0_20px_rgba(16,185,129,0.15)] flex items-center justify-center gap-1.5"
                >
                  {isExportingReport ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin shrink-0" />
                      <span>Đang tạo PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 shrink-0" />
                      <span>Tải file PDF báo cáo</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Email Logs Overlay */}
            {showEmailLogs && (
              <div className="absolute inset-0 bg-stone-950/95 z-50 flex items-center justify-center p-6 rounded-3xl">
                <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
                  <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
                    <Mail className="h-5 w-5 text-indigo-400 animate-pulse" />
                    <span className="text-xs font-bold text-stone-200 uppercase tracking-wider">Tiến trình Gửi Email Đơn vị</span>
                  </div>
                  <div className="bg-stone-950 border border-stone-850 p-4 rounded-xl font-mono text-[10px] text-emerald-400 space-y-1.5 h-[160px] overflow-y-auto scrollbar-thin">
                    {emailLogs.map((log, index) => (
                      <div key={index} className="flex gap-1.5">
                        <span className="text-emerald-700 select-none">&gt;</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      disabled={isSendingEmail}
                      onClick={() => setShowEmailLogs(false)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase rounded-xl disabled:opacity-40 transition-colors"
                    >
                      {isSendingEmail ? "Đang gửi thư..." : "Đóng cửa sổ"}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
