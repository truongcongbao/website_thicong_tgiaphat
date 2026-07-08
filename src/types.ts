export interface Product {
  id: string;
  code: string; // SKU code, e.g. "SP000001"
  name: string;
  barcode?: string;
  category: string; // e.g. "Thời trang", "Công nghệ", "Gia dụng", "Ẩm thực"
  costPrice: number; // Giá vốn bình quân
  sellingPrice: number; // Giá bán
  stock: number; // Tồn kho hiện tại
  minStock: number; // Số lượng tồn kho tối thiểu (để cảnh báo hết hàng)
  unit: string; // Đơn vị tính (Cái, Bộ, Lon, Chiếc, Thùng, Gói...)
  imageUrl?: string;
  expiryDate?: string; // Hạn sử dụng (YYYY-MM-DD)
  parentUnitId?: string; // ID của sản phẩm sỉ quy đổi (e.g. ID của Thùng)
  conversionRate?: number; // Tỷ lệ quy đổi lẻ (e.g. 24 cho thùng 24 lon)
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalSpent: number; // Tổng chi tiêu
  points: number; // Điểm tích lũy
  tier: "Standard" | "Bronze" | "Silver" | "Gold" | "Diamond";
  avatar?: string;
  debt?: number; // Sổ nợ Khách hàng (Bán gối đầu)
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  companyName?: string;
  debt?: number; // Sổ nợ Nhà cung cấp (Nhập hàng trả sau)
}

export interface OrderItem {
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number; // Giá bán lúc mua
  discount: number; // Chiết khấu theo dòng mặt hàng
  total: number; // Thành tiền sau chiết khấu
}

export interface Invoice {
  id: string;
  invoiceCode: string; // HD000001
  customerId?: string;
  customerName: string;
  items: OrderItem[];
  totalOriginal: number; // Tổng tiền hàng gốc
  discountAmount: number; // Giảm giá hóa đơn
  totalPayable: number; // Khách cần trả
  paymentMethod: "CASH" | "BANK_TRANSFER" | "CREDIT_CARD" | "DEBT";
  status: "COMPLETED" | "REFUNDED" | "CANCELLED";
  date: string; // ISO String or YYYY-MM-DD
  cashierName: string;
  pointsEarned: number;
  cancelReason?: string;
  cancelledBy?: string;
  cancelDate?: string;
  eInvoiceCode?: string; // Số hóa đơn điện tử cấp bởi cơ quan thuế
  eInvoiceStatus?: "NONE" | "PENDING" | "ISSUED" | "FAILED";
  eInvoiceUrl?: string; // Link tra cứu hóa đơn điện tử
  eInvoiceError?: string; // Lỗi khi phát hành
  taxRate?: number; // Tỷ lệ thuế áp dụng (e.g., 8 hoặc 0 nếu không lấy)
  taxAmount?: number; // Tiền thuế VAT thực tế của hóa đơn
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "MANAGER" | "CASHIER";
  phone: string;
  active: boolean;
  permissions?: {
    cashbookAccess?: boolean;
    reportsAccess?: boolean;
    posAccess?: boolean;
    productsAccess?: boolean;
    partnersAccess?: boolean;
    settingsAccess?: boolean;
  };
}

export interface ShopSetting {
  shopName: string;
  address: string;
  phone: string;
  logoUrl: string;
  taxRate: number; // % thuế
  currency: string; // "VND"
  zaloNumber: string;
  seoTitle: string;
  seoKeywords: string;
  reportDeletePassword?: string; // Mật khẩu riêng biệt để xóa báo cáo/giao dịch
  bankName?: string; // Tên ngân hàng nhận VietQR (e.g. MBBank, Vietcombank)
  bankAccount?: string; // Số tài khoản ngân hàng
  bankOwner?: string; // Tên chủ tài khoản ngân hàng
  eInvoiceEnabled?: boolean; // Bật xuất hóa đơn điện tử tự động
  eInvoiceProvider?: "MISA" | "VIETTEL" | "VNPT" | "MOCK"; // Nhà cung cấp HĐĐT
  eInvoiceTaxCode?: string; // Mã số thuế DN
  eInvoiceApiUrl?: string; // URL API kết nối
  eInvoiceUsername?: string; // Tài khoản kết nối API
  eInvoicePassword?: string; // Mật khẩu kết nối API
  eInvoicePattern?: string; // Ký hiệu mẫu số hóa đơn (e.g., 1C22TML)
  eInvoiceSerial?: string; // Ký hiệu hóa đơn (e.g., K22TBB)
}

export interface InventoryAuditItem {
  productId: string;
  productName: string;
  productCode: string;
  systemQty: number; // Tồn kho hệ thống
  actualQty: number; // Thực tế đếm được
  discrepancy: number; // Chênh lệch (actual - system)
  notes?: string;
}

export interface InventoryAudit {
  id: string;
  auditCode: string; // KK000001
  date: string;
  auditorName: string;
  items: InventoryAuditItem[];
  status: "DRAFT" | "COMPLETED";
  notes?: string;
}

export interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  costPrice: number; // Giá nhập
  total: number;
}

export interface PurchaseOrder {
  id: string;
  orderCode: string; // PN000001 (Mã nhập)
  date: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  amountPaid: number; // Tiền đã trả
  amountOwed: number; // Tiền nợ lại (Công nợ NCC)
  status: "COMPLETED" | "DRAFT";
}

export interface CashbookEntry {
  id: string;
  entryCode: string; // SQ000001 (Mã phiếu)
  type: "INCOME" | "EXPENSE"; // Thu/Chi
  amount: number;
  category: string; // Loại thu chi (e.g., Tiền điện, xăng xe, lương, Bán hàng, Thu nợ...)
  description: string; // Lý do
  paymentMethod: "CASH" | "BANK_TRANSFER"; // Tiền mặt vs Chuyển khoản
  date: string;
  creatorName: string;
}

export interface ProjectMaterial {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  costPrice: number;
}

export interface ProjectStaff {
  staffId: string;
  staffName: string;
  role: string;
  wage: number;
}

export interface Project {
  id: string;
  name: string; // Tên công trình
  address: string; // Địa chỉ công trình
  customerName: string;
  customerId?: string;
  status: "PLANNING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "PAUSED"; // Tiến độ
  startDate: string;
  endDate?: string;
  materials: ProjectMaterial[]; // Vật tư xuất kho theo công trình
  staff: ProjectStaff[]; // Thợ thi công & chi phí
  budget: number; // Tổng giá trị thi công dự kiến
  expenses: number; // Chi phí khác phát sinh
  notes?: string;
}

export interface CashShift {
  id: string;
  code: string; // CC000001
  startTime: string;
  endTime?: string;
  staffId: string;
  staffName: string;
  initialCash: number; // Tiền mặt đầu ca
  expectedCash: number; // Tiền mặt lý thuyết
  actualCash?: number; // Tiền mặt thực tế đếm được cuối ca
  expectedBank: number; // Tiền chuyển khoản lý thuyết
  actualBank?: number; // Tiền chuyển khoản thực tế cuối ca
  notes?: string;
  status: "ACTIVE" | "COMPLETED";
}

export interface SystemAuditLog {
  id: string;
  actionType: "PRODUCT_PRICE_EDIT" | "CATEGORY_DELETE" | "STAFF_PERMISSION_CHANGE" | "PRODUCT_CREATE" | "PRODUCT_DELETE" | "STAFF_CREATE" | "STAFF_DELETE" | "CATEGORY_CREATE" | "INVOICE_UPDATE" | "INVOICE_CANCEL";
  actionName: string; // Tên hành động tiếng Việt để render đẹp
  description: string; // Chi tiết thay đổi (ví dụ: "Sản phẩm A thay đổi giá từ Xđ thành Yđ")
  actorName: string; // Người thực hiện
  actorRole: "OWNER" | "MANAGER" | "CASHIER"; // Vai trò của người thực hiện
  timestamp: string; // ISO String
}

export interface TrialRegistration {
  id: string;
  shopName: string;
  ownerName: string;
  phone: string;
  email: string;
  password?: string; // Mật khẩu đăng nhập
  address: string;
  notes: string;
  createdAt: string;
  expireDate: string;
  status: "TRIAL_ACTIVE" | "EXPIRED" | "CONVERTED";
}


