import React, { useState, useMemo, useEffect } from "react";
import { Product, Customer, OrderItem, Invoice, ShopSetting, Supplier } from "../types";
import { 
  Search, ShoppingCart, UserPlus, Trash2, CreditCard, Banknote, 
  QrCode, Receipt, Check, RefreshCw, Sparkles, User, Tag, Plus, Minus, X, Package, AlertTriangle,
  Maximize2, Minimize2, Cloud
} from "lucide-react";
import BarcodeScannerModal from "./BarcodeScannerModal";
import { safeDispatchEvent } from "../lib/events";

interface KiotPOSProps {
  products: Product[];
  customers: Customer[];
  settings: ShopSetting;
  suppliers?: Supplier[];
  onAddInvoice: (invoice: Invoice) => void;
  onAddCustomer: (customer: Customer) => void;
  onUpdateProductStock: (productId: string, newStock: number) => void;
}

export default function KiotPOS({ 
  products, 
  customers, 
  settings, 
  suppliers = [],
  onAddInvoice, 
  onAddCustomer,
  onUpdateProductStock 
}: KiotPOSProps) {
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fullscreen state and handler
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error("Error entering fullscreen:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.error("Error exiting fullscreen:", err);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);
  const [selectedCategory, setSelectedCategory] = useState<string>("Tất cả");
  const [barcodeScannerMode, setBarcodeScannerMode] = useState(false);

  // Cart state
  const [cart, setCart] = useState<{ product: Product; quantity: number; discount: number }[]>([]);
  
  // Customer selection
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("cust-4"); // default is Walk-in (Khách vãng lai)
  const [customerSearch, setCustomerSearch] = useState("");
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);

  // New Customer Form
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustAddress, setNewCustAddress] = useState("");

  // Invoice discount
  const [invoiceDiscount, setInvoiceDiscount] = useState<number>(0); // Direct flat VND discount
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK_TRANSFER" | "CREDIT_CARD" | "DEBT">("CASH");
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [takeVat, setTakeVat] = useState(true); // Có lấy VAT hay không
  const [eInvoiceOptIn, setEInvoiceOptIn] = useState(!!settings.eInvoiceEnabled);

  useEffect(() => {
    if (!takeVat) {
      setEInvoiceOptIn(false);
    } else {
      setEInvoiceOptIn(!!settings.eInvoiceEnabled);
    }
  }, [takeVat, settings.eInvoiceEnabled]);

  // Completed Invoice State for Receipt Modal
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Temporary Draft (Waiting Invoices) Management State
  interface WaitingInvoice {
    id: string;
    name: string;
    cart: { product: Product; quantity: number; discount: number }[];
    selectedCustomerId: string;
    invoiceDiscount: number;
    paymentMethod: "CASH" | "BANK_TRANSFER" | "CREDIT_CARD" | "DEBT";
    timestamp: string;
    totalPayable: number;
    itemsCount: number;
  }

  const [waitingInvoices, setWaitingInvoices] = useState<WaitingInvoice[]>(() => {
    try {
      const saved = localStorage.getItem("kiot_waiting_invoices");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  });

  const handleSaveAsWaiting = () => {
    if (cart.length === 0) return;

    const defaultName = currentCustomer.id !== "cust-4" 
      ? `${currentCustomer.name}` 
      : `Khách lẻ #${waitingInvoices.length + 1}`;
    const timeStr = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const newWinv: WaitingInvoice = {
      id: `wait-${Date.now()}`,
      name: `${defaultName} (${timeStr})`,
      cart: [...cart],
      selectedCustomerId,
      invoiceDiscount,
      paymentMethod,
      timestamp: new Date().toISOString(),
      totalPayable,
      itemsCount: cart.reduce((sum, i) => sum + i.quantity, 0)
    };

    const updatedInvoices = [newWinv, ...waitingInvoices];
    setWaitingInvoices(updatedInvoices);
    localStorage.setItem("kiot_waiting_invoices", JSON.stringify(updatedInvoices));

    // Clear current cart
    setCart([]);
    setInvoiceDiscount(0);
    setSelectedCustomerId("cust-4");

    safeDispatchEvent("kiot-toast", {
      type: "success",
      title: "Đã lưu hóa đơn chờ 📥",
      message: `Giỏ hàng đã được đưa vào danh sách chờ với tên: ${newWinv.name}`
    });
  };

  const handleLoadWaiting = (winv: WaitingInvoice) => {
    let updatedInvoices = [...waitingInvoices];

    // If current active cart has products, automatically save it first so nothing is lost!
    if (cart.length > 0) {
      const defaultName = currentCustomer.id !== "cust-4" 
        ? `${currentCustomer.name}` 
        : `Khách lẻ #${updatedInvoices.length + 1}`;
      const timeStr = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      const currentWinv: WaitingInvoice = {
        id: `wait-${Date.now()}`,
        name: `${defaultName} (${timeStr})`,
        cart: [...cart],
        selectedCustomerId,
        invoiceDiscount,
        paymentMethod,
        timestamp: new Date().toISOString(),
        totalPayable,
        itemsCount: cart.reduce((sum, i) => sum + i.quantity, 0)
      };
      updatedInvoices.push(currentWinv);

      safeDispatchEvent("kiot-toast", {
        type: "success",
        title: "Hóa đơn hiện tại đã được cất",
        message: `Đã tự động lưu giỏ hàng hiện tại với tên: ${currentWinv.name}`
      });
    }

    // Load selected waiting invoice
    setCart(winv.cart);
    setSelectedCustomerId(winv.selectedCustomerId);
    setInvoiceDiscount(winv.invoiceDiscount);
    setPaymentMethod(winv.paymentMethod);

    // Remove the loaded invoice from the list
    updatedInvoices = updatedInvoices.filter(item => item.id !== winv.id);
    setWaitingInvoices(updatedInvoices);
    localStorage.setItem("kiot_waiting_invoices", JSON.stringify(updatedInvoices));

    safeDispatchEvent("kiot-toast", {
      type: "success",
      title: "Khôi phục hóa đơn chờ 📂",
      message: `Đã mở lại giỏ hàng của: ${winv.name}`
    });
  };

  const handleDeleteWaiting = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent loading it when clicking delete
    const updatedInvoices = waitingInvoices.filter(item => item.id !== id);
    setWaitingInvoices(updatedInvoices);
    localStorage.setItem("kiot_waiting_invoices", JSON.stringify(updatedInvoices));

    safeDispatchEvent("kiot-toast", {
      type: "success",
      title: "Đã xóa hóa đơn chờ",
      message: "Giỏ hàng chờ đã được dọn sạch."
    });
  };

  // Formatting helpers
  const formatVND = (value: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
  };

  // Filter products by search query and category
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.barcode && p.barcode.includes(searchQuery));
      const matchCategory = selectedCategory === "Tất cả" || p.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Unique categories
  const categoriesList = useMemo(() => {
    const list = new Set(products.map(p => p.category));
    return ["Tất cả", ...Array.from(list)];
  }, [products]);

  // Add to cart
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(`Sản phẩm "${product.name}" đã hết hàng trong kho! Hãy bổ sung tồn kho trước.`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Chỉ còn ${product.stock} ${product.unit} sản phẩm này trong kho.`);
          return prev;
        }
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1, discount: 0 }];
    });
  };

  // Barcode search handling (Enter key on scanner)
  const handleBarcodeSubmit = (query: string) => {
    if (!query.trim()) return;
    const foundProduct = products.find(p => 
      (p.barcode && p.barcode.trim() === query.trim()) || 
      p.code.toLowerCase() === query.trim().toLowerCase()
    );

    if (foundProduct) {
      handleAddToCart(foundProduct);
      setSearchQuery("");
      safeDispatchEvent("kiot-toast", {
        type: "success",
        title: "Đã quét sản phẩm! 🏷️",
        message: `Đã tự động thêm ${foundProduct.name} vào giỏ hàng.`
      });
    }
  };

  // Remove or adjust quantities
  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty > item.product.stock) {
            alert(`Sản phẩm chỉ còn ${item.product.stock} trong kho!`);
            return item;
          }
          return { ...item, quantity: Math.max(1, newQty) };
        }
        return item;
      });
    });
  };

  const handleManualQuantity = (productId: string, qtyStr: string, maxStock: number) => {
    const qty = parseInt(qtyStr) || 1;
    if (qty > maxStock) {
      alert(`Chỉ còn ${maxStock} sản phẩm trong kho!`);
      return;
    }
    setCart(prev => prev.map(item => item.product.id === productId ? { ...item, quantity: Math.max(1, qty) } : item));
  };

  const handleUpdateItemDiscount = (productId: string, discountVal: number) => {
    setCart(prev => prev.map(item => item.product.id === productId ? { ...item, discount: Math.max(0, discountVal) } : item));
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, curr) => acc + (curr.product.sellingPrice * curr.quantity), 0);
  }, [cart]);

  const itemDiscountsTotal = useMemo(() => {
    return cart.reduce((acc, curr) => acc + (curr.discount * curr.quantity), 0);
  }, [cart]);

  const taxAmount = useMemo(() => {
    if (!takeVat) return 0;
    const rate = settings.taxRate / 100;
    return (cartSubtotal - itemDiscountsTotal) * rate;
  }, [cartSubtotal, itemDiscountsTotal, settings.taxRate, takeVat]);

  const totalPayable = useMemo(() => {
    const originalWithTax = cartSubtotal - itemDiscountsTotal + taxAmount;
    return Math.max(0, originalWithTax - invoiceDiscount);
  }, [cartSubtotal, itemDiscountsTotal, taxAmount, invoiceDiscount]);

  // Sync cash given automatically when total changes
  useEffect(() => {
    if (paymentMethod === "CASH") {
      setCashGiven(totalPayable);
    } else {
      setCashGiven(0);
    }
  }, [totalPayable, paymentMethod]);

  // Keyboard shortcuts (F4: Open Scanner, F9: Checkout, F6: Save draft)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F4") {
        e.preventDefault();
        setBarcodeScannerMode(true);
      } else if (e.key === "F9") {
        e.preventDefault();
        handleCheckout();
      } else if (e.key === "F6") {
        e.preventDefault();
        handleSaveAsWaiting();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [cart, selectedCustomerId, paymentMethod, cashGiven, invoiceDiscount, totalPayable, waitingInvoices]);

  const changeDue = useMemo(() => {
    if (paymentMethod !== "CASH") return 0;
    return Math.max(0, cashGiven - totalPayable);
  }, [cashGiven, totalPayable, paymentMethod]);

  // Selected customer object
  const currentCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId) || customers[3]; // Fallback to walk-in
  }, [customers, selectedCustomerId]);

  // Trigger debt warning popup/toast when selecting a customer with high debt or when suppliers have outstanding liabilities
  useEffect(() => {
    if (currentCustomer && currentCustomer.id !== "cust-4") {
      const debt = currentCustomer.debt || 0;
      if (debt > 10000000) {
        safeDispatchEvent("kiot-toast", {
          type: "stock-warning",
          title: "🚨 VƯỢT HẠN MỨC NỢ KHÁCH HÀNG",
          message: `Khách hàng ${currentCustomer.name} đã VƯỢT HẠN MỨC NỢ cho phép (${formatVND(debt)} > 10.000.000đ) hoặc đã đến kỳ thanh toán công nợ! Vui lòng thu hồi nợ trước khi xuất thêm hàng.`
        });
      } else if (debt > 5000000 || (currentCustomer.tier === "VIP" && debt > 0)) {
        safeDispatchEvent("kiot-toast", {
          type: "stock-warning",
          title: "⚠️ CẢNH BÁO NỢ KHÁCH HÀNG",
          message: `Khách hàng ${currentCustomer.name} (${currentCustomer.tier}) đang có khoản nợ: ${formatVND(debt)}. Thu ngân vui lòng lưu ý thu hồi nợ trước khi tiếp tục bán sỉ/ghi nợ!`
        });
      }
    }
  }, [selectedCustomerId, currentCustomer]);

  // Check suppliers with excessive credit/debts on mount/load
  useEffect(() => {
    if (suppliers && suppliers.length > 0) {
      const highDebtSuppliers = suppliers.filter(s => (s.debt || 0) > 25000000);
      if (highDebtSuppliers.length > 0) {
        const timer = setTimeout(() => {
          safeDispatchEvent("kiot-toast", {
            type: "stock-warning",
            title: "🚨 NỢ NHÀ CUNG CẤP VƯỢT HẠN MỨC",
            message: `Hệ thống phát hiện ${highDebtSuppliers.length} nhà cung cấp có số nợ vượt quá hạn mức thanh toán (25.000.000đ) hoặc đã đến kỳ thanh toán nhập kho.`
          });
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [suppliers]);

  // Keyboard Shortcuts Listeners (F1: Search, F2: Add Cust, F8: Select Cust, F9: Checkout, F4: Clear Cart)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault();
        const searchInput = document.getElementById("pos-product-search");
        if (searchInput) {
          (searchInput as HTMLInputElement).focus();
          (searchInput as HTMLInputElement).select();
        }
      } else if (e.key === "F9") {
        e.preventDefault();
        const checkoutBtn = document.getElementById("pos-checkout-btn");
        if (checkoutBtn) {
          (checkoutBtn as HTMLButtonElement).click();
        }
      } else if (e.key === "F8") {
        e.preventDefault();
        const customerSelect = document.getElementById("pos-customer-select");
        if (customerSelect) {
          (customerSelect as HTMLSelectElement).focus();
        }
      } else if (e.key === "F2") {
        e.preventDefault();
        setIsAddingNewCustomer(prev => !prev);
      } else if (e.key === "F4") {
        e.preventDefault();
        if (confirm("Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng hiện tại?")) {
          setCart([]);
        }
      }
    };

    const handleCustomTriggerNewCust = () => {
      setIsAddingNewCustomer(true);
    };

    const handleCustomClearCart = () => {
      setCart([]);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("kiot-trigger-new-customer", handleCustomTriggerNewCust);
    window.addEventListener("kiot-clear-cart", handleCustomClearCart);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("kiot-trigger-new-customer", handleCustomTriggerNewCust);
      window.removeEventListener("kiot-clear-cart", handleCustomClearCart);
    };
  }, [setCart]);

  // Filter customers for selection list
  const filteredCustomersList = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
    );
  }, [customers, customerSearch]);

  // Add new customer handler
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) {
      alert("Tên khách hàng và Số điện thoại là bắt buộc!");
      return;
    }
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: newCustName,
      phone: newCustPhone,
      email: newCustEmail || undefined,
      address: newCustAddress || undefined,
      totalSpent: 0,
      points: 0,
      tier: "Standard"
    };
    onAddCustomer(newCust);
    setSelectedCustomerId(newCust.id);
    setIsAddingNewCustomer(false);
    
    // Clear form
    setNewCustName("");
    setNewCustPhone("");
    setNewCustEmail("");
    setNewCustAddress("");
  };

  // Complete Payment (Create Invoice)
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Giỏ hàng đang trống! Vui lòng chọn sản phẩm.");
      return;
    }

    if (paymentMethod === "DEBT" && currentCustomer.id === "cust-4") {
      alert("Khách vãng lai không được phép ghi nợ! Vui lòng chọn hoặc thêm nhanh khách hàng cụ thể.");
      return;
    }

    if (paymentMethod === "CASH" && cashGiven < totalPayable) {
      alert("Tiền khách đưa không đủ thanh toán!");
      return;
    }

    // 1. Generate unique invoice code
    const invoiceCode = `HD${String(Date.now()).slice(-6)}`;

    // 2. Map items
    const orderItems: OrderItem[] = cart.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      productCode: item.product.code,
      quantity: item.quantity,
      unitPrice: item.product.sellingPrice,
      discount: item.discount,
      total: (item.product.sellingPrice - item.discount) * item.quantity
    }));

    // 3. Points calculation (10,000 VND = 1 point, ignore if Walk-in customer)
    let pointsEarned = 0;
    if (currentCustomer.id !== "cust-4") {
      pointsEarned = Math.floor(totalPayable / 10000);
    }

    // 4. Create invoice object
    const hasEInvoice = eInvoiceOptIn && settings.eInvoiceEnabled;
    const eInvCode = hasEInvoice 
      ? `${settings.eInvoicePattern || "1C26TML"}-${settings.eInvoiceSerial || "C26TGP"}-${String(Math.floor(100000 + Math.random() * 900000))}`
      : undefined;
    const eInvUrl = hasEInvoice
      ? `https://tracuu.meinvoice.vn/invoice?taxcode=${settings.eInvoiceTaxCode || "3701548239"}&code=${invoiceCode}`
      : undefined;

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceCode,
      customerId: currentCustomer.id !== "cust-4" ? currentCustomer.id : undefined,
      customerName: currentCustomer.name,
      items: orderItems,
      totalOriginal: cartSubtotal,
      discountAmount: itemDiscountsTotal + invoiceDiscount,
      totalPayable,
      paymentMethod,
      status: "COMPLETED",
      date: new Date().toISOString(),
      cashierName: "Trương Công Bảo",
      pointsEarned,
      eInvoiceStatus: hasEInvoice ? "ISSUED" : "NONE",
      eInvoiceCode: eInvCode,
      eInvoiceUrl: eInvUrl,
      taxRate: takeVat ? settings.taxRate : 0,
      taxAmount: taxAmount
    };

    // 5. Update stock values for each product
    cart.forEach(item => {
      const remainingStock = item.product.stock - item.quantity;
      onUpdateProductStock(item.product.id, remainingStock);
    });

    // 6. Push to parent state
    onAddInvoice(newInvoice);

    // 7. Load to receipt printer modal
    setCompletedInvoice(newInvoice);
    setIsReceiptOpen(true);
  };

  const handleResetPOS = () => {
    setCart([]);
    setInvoiceDiscount(0);
    setSelectedCustomerId("cust-4");
    setCustomerSearch("");
    setCompletedInvoice(null);
    setIsReceiptOpen(false);
    setTakeVat(true);
  };

  // Simulated scan product action
  const handleSimulateScan = () => {
    if (filteredProducts.length > 0) {
      const randomProd = filteredProducts[Math.floor(Math.random() * filteredProducts.length)];
      handleAddToCart(randomProd);
    }
  };

  return (
    <div className="space-y-4">
      {/* POS Top Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-stone-900 border border-stone-850 rounded-2xl shadow-xl gap-3 select-none">
        <div className="flex items-center gap-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
          <div className="space-y-0.5">
            <h2 className="text-sm font-black uppercase tracking-widest text-stone-100 flex items-center gap-1.5">
              <span>Màn Hình Bán Hàng POS</span>
              <span className="text-[10px] bg-stone-800 text-stone-400 border border-stone-750 px-1.5 py-0.5 rounded font-normal font-mono uppercase">Offline-Ready</span>
            </h2>
            <p className="text-[10px] text-stone-500 font-medium">Nhân viên: <strong className="text-stone-300">Trương Công Bảo</strong> • Hỗ trợ quét mã vạch và phím tắt thông minh</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Shortcuts Quick Reference Guide */}
          <div className="hidden lg:flex items-center gap-2.5 text-[10px] text-stone-500 mr-2 border-r border-stone-800 pr-5">
            <span><kbd className="bg-stone-950 px-1.5 py-0.5 rounded border border-stone-800 font-mono text-stone-400 font-bold">F1</kbd> Tìm sản phẩm</span>
            <span><kbd className="bg-stone-950 px-1.5 py-0.5 rounded border border-stone-800 font-mono text-stone-400 font-bold">F2</kbd> Thêm khách</span>
            <span><kbd className="bg-stone-950 px-1.5 py-0.5 rounded border border-stone-800 font-mono text-stone-400 font-bold">F4</kbd> Quét barcode</span>
            <span><kbd className="bg-stone-950 px-1.5 py-0.5 rounded border border-stone-800 font-mono text-stone-400 font-bold">F6</kbd> Lưu tạm</span>
            <span><kbd className="bg-stone-950 px-1.5 py-0.5 rounded border border-stone-800 font-mono text-stone-400 font-bold">F8</kbd> Chọn khách</span>
            <span><kbd className="bg-stone-950 px-1.5 py-0.5 rounded border border-stone-800 font-mono text-stone-400 font-bold">F9</kbd> Thanh toán</span>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 select-none cursor-pointer border ${
              isFullscreen 
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20" 
                : "bg-stone-950 text-stone-300 border-stone-800 hover:bg-stone-850 hover:text-stone-100"
            }`}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-4 w-4 text-amber-400 animate-pulse" />
                <span>Thoát Toàn Màn Hình</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4 text-stone-400" />
                <span>Toàn Màn Hình</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      
      {/* LEFT COLUMN: Catalog & Products List (8 Cols) */}
      <div className="xl:col-span-7 lg:col-span-12 space-y-4">
        {/* Search, filters & Scanner simulation */}
        <div className="p-4 rounded-2xl bg-stone-900 border border-stone-850 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-stone-500" />
              <input
                id="pos-product-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleBarcodeSubmit(searchQuery);
                  }
                }}
                placeholder="[F1] Tìm sản phẩm theo tên, mã sản phẩm hoặc barcode..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-xs sm:text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder-stone-600"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-3 text-stone-500 hover:text-stone-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBarcodeScannerMode(true)}
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-stone-950 border border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 select-none cursor-pointer"
              >
                <QrCode className="h-4.5 w-4.5" />
                <span>Quét Mã Vạch (F4)</span>
              </button>
            </div>
          </div>

          {/* Category Scroller in Web3 Neon tags */}
          <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent">
            {categoriesList.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider shrink-0 border transition-all cursor-pointer select-none ${
                  selectedCategory === cat 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                    : "bg-stone-950/60 text-stone-500 border-stone-850 hover:text-stone-300 hover:border-stone-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Catalog Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3.5 max-h-[620px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-16 bg-stone-900 border border-stone-850 rounded-2xl flex flex-col items-center justify-center text-stone-500 space-y-2">
              <Package className="h-10 w-10 text-stone-600 stroke-[1.5]" />
              <p className="text-xs">Không tìm thấy sản phẩm phù hợp yêu cầu lọc.</p>
            </div>
          ) : (
            filteredProducts.map(p => {
              const isLowStock = p.stock <= p.minStock;
              const isOutOfStock = p.stock <= 0;
              
              return (
                <div
                  key={p.id}
                  onClick={() => !isOutOfStock && handleAddToCart(p)}
                  className={`p-3 rounded-2xl bg-stone-900 border relative group cursor-pointer overflow-hidden transition-all flex flex-col justify-between ${
                    isOutOfStock 
                      ? "opacity-50 border-stone-850 cursor-not-allowed bg-stone-900/40" 
                      : "border-stone-850 hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.06)] active:scale-[0.98]"
                  }`}
                >
                  {/* Stock tag */}
                  <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider z-10 select-none ${
                    isOutOfStock 
                      ? "bg-rose-500 text-white" 
                      : isLowStock 
                        ? "bg-amber-500 text-stone-950" 
                        : "bg-stone-950/80 text-stone-400"
                  }`}>
                    {isOutOfStock ? "Hết hàng" : `Kho: ${p.stock}`}
                  </div>

                  {/* Image with glow hover */}
                  <div className="w-full aspect-square rounded-xl bg-stone-950 border border-stone-850/60 overflow-hidden relative mb-2.5">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-700 bg-stone-900 font-bold text-xs">
                        TGP
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-40" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-stone-500 font-bold block uppercase tracking-wide">{p.code}</span>
                    <h4 className="text-xs font-bold text-stone-200 line-clamp-1 group-hover:text-emerald-400 transition-colors">{p.name}</h4>
                    <div className="flex items-center justify-between pt-1 border-t border-stone-850/60 mt-1">
                      <span className="text-xs font-extrabold text-emerald-400 font-mono">{formatVND(p.sellingPrice)}</span>
                      <span className="text-[9px] text-stone-500">/{p.unit}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: POS Checkout Counter & Cart (5 Cols) */}
      <div className="xl:col-span-5 lg:col-span-12 space-y-4">
        
        {/* Temporary Invoices / Drafts Bar */}
        <div className="p-4 rounded-2xl bg-stone-900 border border-stone-850 shadow-xl space-y-3 relative overflow-hidden select-none">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Receipt className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
                {waitingInvoices.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-rose-500 text-[8px] text-stone-100 font-bold flex items-center justify-center border border-stone-900 shadow-lg">
                    {waitingInvoices.length}
                  </span>
                )}
              </div>
              <div>
                <span className="text-xs font-bold text-stone-100 uppercase tracking-wider block">Hóa Đơn Chờ ({waitingInvoices.length})</span>
                <span className="text-[9px] text-stone-500 block">Lưu tạm giỏ hàng để phục vụ khách khác</span>
              </div>
            </div>
            
            {cart.length > 0 && (
              <button
                type="button"
                onClick={handleSaveAsWaiting}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1 shadow-md"
              >
                <Plus className="h-3 w-3" />
                <span>Lưu tạm (F6)</span>
              </button>
            )}
          </div>

          {waitingInvoices.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent">
              {waitingInvoices.map((winv) => (
                <div
                  key={winv.id}
                  onClick={() => handleLoadWaiting(winv)}
                  className="px-3 py-2 rounded-xl bg-stone-950/60 hover:bg-stone-950 border border-stone-850 hover:border-amber-500/40 flex items-center justify-between gap-3 shrink-0 group cursor-pointer transition-all duration-200"
                >
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-black text-stone-200 max-w-[120px] truncate group-hover:text-amber-400 transition-colors">{winv.name}</div>
                    <div className="text-[9px] text-stone-500 font-medium flex items-center gap-1">
                      <span className="bg-stone-900 px-1 py-0.2 rounded border border-stone-850">{winv.itemsCount} sản phẩm</span>
                      <span className="text-emerald-400 font-bold font-mono">{formatVND(winv.totalPayable)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteWaiting(winv.id, e)}
                    className="text-stone-600 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition-all cursor-pointer"
                    title="Hủy hóa đơn chờ"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-stone-500 italic">Không có hóa đơn tạm nào đang chờ...</p>
          )}
        </div>
        
        {/* Dynamic Glass shopping cart */}
        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-850 shadow-2xl space-y-4 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/2 to-transparent pointer-events-none" />
          
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2 uppercase tracking-wider">
              <ShoppingCart className="h-4.5 w-4.5 text-emerald-400" />
              <span>Hóa Đơn Bán Hàng</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-stone-950 font-bold text-stone-400 font-mono">
              {cart.reduce((sum, i) => sum + i.quantity, 0)} sản phẩm
            </span>
          </div>

          {/* Cart item listings */}
          <div className="min-h-[220px] max-h-[300px] overflow-y-auto pr-1 divide-y divide-stone-850/60 scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent">
            {cart.length === 0 ? (
              <div className="py-16 text-center text-stone-500 flex flex-col items-center justify-center space-y-1">
                <ShoppingCart className="h-8 w-8 text-stone-600 stroke-[1.5]" />
                <p className="text-xs">Chưa có sản phẩm nào được chọn.</p>
                <p className="text-[10px] text-stone-600">Bấm chọn sản phẩm ở khung catalog bên trái.</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product.id} className="py-1.5 px-2 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:bg-stone-850/20 flex items-start justify-between gap-2.5 group origin-center">
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-stone-500 bg-stone-950 px-1 rounded">{item.product.code}</span>
                      <h5 className="text-[11px] font-bold text-stone-200 line-clamp-1">{item.product.name}</h5>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      {/* Price & Discount per item */}
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-stone-400 font-mono">{formatVND(item.product.sellingPrice)}</span>
                        {item.discount > 0 && (
                          <span className="text-[10px] text-rose-400 font-mono font-bold">(-{formatVND(item.discount)})</span>
                        )}
                      </div>

                      {/* Quantity adjuster */}
                      <div className="flex items-center gap-1 bg-stone-950 rounded-lg p-0.5 border border-stone-800/80">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.product.id, -1)}
                          className="p-1 rounded-md text-stone-400 hover:text-stone-100 hover:bg-stone-900/80 transition-all cursor-pointer"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <input
                          type="text"
                          value={item.quantity}
                          onChange={(e) => handleManualQuantity(item.product.id, e.target.value, item.product.stock)}
                          className="w-8 text-center bg-transparent text-[11px] font-extrabold text-stone-200 focus:outline-none font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.product.id, 1)}
                          className="p-1 rounded-md text-stone-400 hover:text-stone-100 hover:bg-stone-900/80 transition-all cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Expandable item discount input */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <Tag className="h-3 w-3 text-stone-600" />
                      <span className="text-[9px] text-stone-500 uppercase font-bold">Giảm giá sản phẩm:</span>
                      <input
                        type="number"
                        value={item.discount || ""}
                        onChange={(e) => handleUpdateItemDiscount(item.product.id, Number(e.target.value))}
                        placeholder="VND"
                        className="w-20 px-1.5 py-0.5 rounded bg-stone-950 border border-stone-850 text-[10px] font-mono text-stone-300 focus:outline-none focus:border-emerald-500 text-right"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between min-h-[46px]">
                    <button
                      type="button"
                      onClick={() => handleRemoveFromCart(item.product.id)}
                      className="text-stone-600 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/5 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <span className="text-[11px] font-bold font-mono text-stone-100">
                      {formatVND((item.product.sellingPrice - item.discount) * item.quantity)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Customer Selection block with autocomplete */}
          <div className="border-t border-stone-800/80 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-emerald-400" />
                <span>Khách hàng áp dụng</span>
              </label>

              <button
                type="button"
                onClick={() => setIsAddingNewCustomer(prev => !prev)}
                className="text-[10px] text-amber-500 hover:text-amber-400 font-black uppercase flex items-center gap-0.5 cursor-pointer"
              >
                <UserPlus className="h-3 w-3" />
                <span>Thêm mới</span>
              </button>
            </div>

            {isAddingNewCustomer ? (
              /* Create customer card inline */
              <form onSubmit={handleCreateCustomer} className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 space-y-3 shadow-inner">
                <div className="flex justify-between items-center border-b border-stone-850 pb-1.5">
                  <span className="text-[10px] text-amber-500 font-bold uppercase">Đăng ký thành viên mới</span>
                  <button type="button" onClick={() => setIsAddingNewCustomer(false)} className="text-stone-500 hover:text-stone-300">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    placeholder="Họ và tên *"
                    className="px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-[11px] focus:outline-none focus:border-amber-500 text-stone-200"
                  />
                  <input
                    type="text"
                    required
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="Số điện thoại *"
                    className="px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-[11px] focus:outline-none focus:border-amber-500 text-stone-200 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="email"
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    placeholder="Email"
                    className="px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-[11px] focus:outline-none focus:border-amber-500 text-stone-200"
                  />
                  <input
                    type="text"
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    placeholder="Địa chỉ"
                    className="px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-[11px] focus:outline-none focus:border-amber-500 text-stone-200"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold uppercase py-1.5 rounded-lg text-[10px] tracking-wider transition-all"
                >
                  Xác nhận lưu thành viên
                </button>
              </form>
            ) : (
              /* Customer selector search */
              <div className="relative">
                <select
                  id="pos-customer-select"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-xs focus:border-emerald-500 focus:outline-none font-semibold cursor-pointer"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id} className="bg-stone-900 text-stone-200">
                      {c.name} {c.id !== "cust-4" ? `(${c.phone})` : ""} - Hạng {c.tier}
                    </option>
                  ))}
                </select>
                {selectedCustomerId !== "cust-4" && (
                  <div className="space-y-1.5">
                    <div className="mt-2 p-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-[10px] text-emerald-400 flex justify-between font-medium">
                      <span>Hạng thẻ: {currentCustomer.tier}</span>
                      <span>Điểm tích lũy: {currentCustomer.points}đ</span>
                      <span>Doanh số: {formatVND(currentCustomer.totalSpent)}</span>
                    </div>
                    {currentCustomer.debt && currentCustomer.debt > 0 ? (
                      <div className={`p-2.5 rounded-xl border text-[10px] flex items-center gap-1.5 font-bold uppercase tracking-wide animate-pulse ${
                        currentCustomer.debt > 5000000 
                          ? "bg-rose-500/15 text-rose-400 border-rose-500/30" 
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                        <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                        <div className="leading-tight">
                          <span>Nợ hiện tại: {formatVND(currentCustomer.debt)}</span>
                          {currentCustomer.debt > 5000000 && <span className="block text-[9px] text-stone-400 mt-0.5 normal-case font-normal">(Đã vượt quá hạn mức nợ VIP 5.000.000đ)</span>}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pricing & Checkout Calculations Summary */}
          <div className="border-t border-stone-800/80 pt-4 space-y-2.5 text-xs">
            <div className="flex justify-between text-stone-400">
              <span>Tổng tiền hàng:</span>
              <span className="font-bold font-mono">{formatVND(cartSubtotal)}</span>
            </div>

            {itemDiscountsTotal > 0 && (
              <div className="flex justify-between text-rose-400">
                <span>Giảm trực tiếp sản phẩm:</span>
                <span className="font-bold font-mono">-{formatVND(itemDiscountsTotal)}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-stone-400">
              <div className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  id="take-vat-checkbox"
                  checked={takeVat}
                  onChange={(e) => setTakeVat(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-stone-700 bg-stone-950 text-emerald-500 focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
                />
                <label htmlFor="take-vat-checkbox" className="cursor-pointer select-none font-semibold hover:text-stone-200 transition-colors text-[11px] flex items-center gap-1">
                  <span>Xuất hóa đơn VAT ({settings.taxRate}%)</span>
                </label>
              </div>
              <span className={`font-bold font-mono transition-colors ${takeVat ? "text-stone-200" : "text-stone-600 line-through"}`}>
                {formatVND(taxAmount)}
              </span>
            </div>

            {/* Direct Bill Discount input */}
            <div className="flex items-center justify-between text-stone-400">
              <span className="flex items-center gap-1">Giảm giá hóa đơn:</span>
              <div className="flex items-center gap-1 bg-stone-950 px-2 py-0.5 rounded border border-stone-850">
                <input
                  type="number"
                  value={invoiceDiscount || ""}
                  onChange={(e) => setInvoiceDiscount(Math.max(0, Number(e.target.value)))}
                  placeholder="Nhập số tiền..."
                  className="w-24 text-right bg-transparent border-none text-xs font-bold text-stone-200 font-mono focus:outline-none"
                />
                <span className="text-[10px] text-stone-500">đ</span>
              </div>
            </div>

            <div className="flex justify-between text-stone-100 font-extrabold text-sm border-t border-stone-850 pt-2 pb-1.5">
              <span className="uppercase text-emerald-400">Khách phải trả:</span>
              <span className="text-emerald-400 text-base font-mono font-black">{formatVND(totalPayable)}</span>
            </div>

            {/* Payment methods choice (CASH, BANK, CARD, DEBT) */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Phương thức thanh toán</span>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CASH")}
                  className={`py-2 rounded-xl text-xs font-bold border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                    paymentMethod === "CASH" 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.06)]" 
                      : "bg-stone-950 text-stone-500 border-stone-850 hover:text-stone-300"
                  }`}
                >
                  <Banknote className="h-4 w-4" />
                  <span className="text-[10px] sm:text-xs">Tiền mặt</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("BANK_TRANSFER")}
                  className={`py-2 rounded-xl text-xs font-bold border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                    paymentMethod === "BANK_TRANSFER" 
                      ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.06)]" 
                      : "bg-stone-950 text-stone-500 border-stone-850 hover:text-stone-300"
                  }`}
                >
                  <QrCode className="h-4 w-4" />
                  <span className="text-[10px] sm:text-xs">Chuyển khoản</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("CREDIT_CARD")}
                  className={`py-2 rounded-xl text-xs font-bold border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                    paymentMethod === "CREDIT_CARD" 
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.06)]" 
                      : "bg-stone-950 text-stone-500 border-stone-850 hover:text-stone-300"
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  <span className="text-[10px] sm:text-xs">Quẹt thẻ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("DEBT")}
                  className={`py-2 rounded-xl text-xs font-bold border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                    paymentMethod === "DEBT" 
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/40 shadow-[0_0_12px_rgba(239,68,68,0.06)]" 
                      : "bg-stone-950 text-stone-500 border-stone-850 hover:text-stone-300"
                  }`}
                >
                  <Receipt className="h-4 w-4" />
                  <span className="text-[10px] sm:text-xs">Ghi nợ</span>
                </button>
              </div>
            </div>

            {/* Cash exchange controls */}
            {paymentMethod === "CASH" && (
              <div className="p-3 rounded-xl bg-stone-950 border border-stone-850/80 space-y-2">
                <div className="flex justify-between items-center text-stone-400">
                  <span>Tiền khách đưa:</span>
                  <div className="flex items-center gap-1 bg-stone-900 px-2 py-0.5 rounded">
                    <input
                      type="number"
                      value={cashGiven || ""}
                      onChange={(e) => setCashGiven(Number(e.target.value))}
                      className="w-28 text-right bg-transparent border-none text-xs font-bold text-stone-200 font-mono focus:outline-none"
                    />
                    <span className="text-[10px] text-stone-500">đ</span>
                  </div>
                </div>

                {/* Quick denomination suggestions */}
                <div className="flex flex-wrap gap-1 pt-1 justify-end">
                  {[totalPayable, 50000, 100000, 200000, 500000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCashGiven(val)}
                      className="px-2 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded text-[9px] font-mono text-stone-400 font-bold transition-all cursor-pointer"
                    >
                      {val === totalPayable ? "Khớp hóa đơn" : formatVND(val)}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-1.5 border-t border-stone-850/50 text-xs font-semibold text-stone-300">
                  <span>Tiền thối lại khách:</span>
                  <span className="text-amber-400 font-mono font-bold text-sm">{formatVND(changeDue)}</span>
                </div>
              </div>
            )}

            {/* Dynamic bank transfer QR VietQR card for Bank Transfer */}
            {paymentMethod === "BANK_TRANSFER" && (() => {
              const bName = (settings.bankName || "MB").trim().toUpperCase();
              const bAccount = (settings.bankAccount || "7919399999").trim();
              const bOwner = (settings.bankOwner || "TRUONG CONG BAO").trim().toUpperCase();
              const bMemo = `TGP POS ${currentCustomer?.phone || "CK"}`.slice(0, 20).toUpperCase();
              
              return (
                <div className="p-3 rounded-xl bg-stone-950 border border-indigo-500/15 text-stone-300 space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-3">
                    {/* Real Dynamic VietQR image API */}
                    <div className="h-16 w-16 bg-white rounded-lg p-1 shrink-0 flex items-center justify-center relative overflow-hidden shadow-inner">
                      <img 
                        src={`https://img.vietqr.io/image/${bName}-${bAccount}-compact2.png?amount=${totalPayable}&addInfo=${encodeURIComponent(bMemo)}&accountName=${encodeURIComponent(bOwner)}`}
                        alt="VietQR Transfer"
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="space-y-0.5 text-[10px]">
                      <span className="text-indigo-400 font-bold block uppercase tracking-wide flex items-center gap-1">
                        <Sparkles className="h-3 w-3 animate-pulse text-indigo-400" />
                        <span>VietQR Chuyển Khoản Tự Động</span>
                      </span>
                      <p className="font-semibold text-stone-200">Ngân hàng: {bName}</p>
                      <p className="font-bold font-mono text-stone-100">STK: {bAccount}</p>
                      <p className="text-stone-400 truncate max-w-[190px]">Nội dung: <span className="font-mono text-indigo-400 font-bold">{bMemo}</span></p>
                    </div>
                  </div>
                  <div className="text-[9px] text-stone-500 text-center leading-relaxed">
                    Quét QR này trên app Ngân hàng để nhập tự động số tiền <span className="text-indigo-400 font-black">{formatVND(totalPayable)}</span>.
                  </div>
                </div>
              );
            })()}
          </div>

          {/* E-Invoice Toggle Option at POS Checkout */}
          {settings.eInvoiceEnabled && (
            <div className="mt-4 p-3 rounded-xl bg-stone-950 border border-stone-850/80 flex items-center justify-between text-xs transition-all hover:border-emerald-500/20">
              <div className="flex items-center gap-2">
                <Cloud className="h-4 w-4 text-emerald-400" />
                <div className="text-left">
                  <p className="font-bold text-stone-200">Xuất hóa đơn điện tử</p>
                  <p className="text-[10px] text-stone-500">Mẫu: {settings.eInvoicePattern} ({settings.eInvoiceProvider})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEInvoiceOptIn(!eInvoiceOptIn)}
                className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all ${
                  eInvoiceOptIn ? "bg-emerald-500 justify-end" : "bg-stone-800 justify-start"
                }`}
              >
                <span className="bg-stone-950 w-4 h-4 rounded-full shadow-md transition-all" />
              </button>
            </div>
          )}

          {/* Action trigger checkout buttons */}
          <div className="mt-5 pt-3 border-t border-stone-850">
            <button
              id="pos-checkout-btn"
              type="button"
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all shadow-md ${
                cart.length === 0 
                  ? "bg-stone-800 text-stone-600 border border-stone-850 cursor-not-allowed" 
                  : "bg-emerald-500 hover:bg-emerald-400 text-stone-950 border border-emerald-400 cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:scale-[1.01] active:scale-[0.99]"
              }`}
            >
              <Receipt className="h-4 w-4" />
              <span>Thanh Toán &amp; In Hóa Đơn (F9)</span>
            </button>
          </div>

          {/* Keyboard Shortcuts Quick Reference Legend */}
          <div className="border-t border-stone-850/80 pt-3 flex flex-wrap gap-1.5 text-[9px] text-stone-500 font-bold uppercase tracking-wider">
            <span className="bg-stone-950 px-2 py-1 rounded border border-stone-800 text-stone-400 font-mono">F1: Tìm hàng</span>
            <span className="bg-stone-950 px-2 py-1 rounded border border-stone-800 text-stone-400 font-mono">F2: Thêm khách</span>
            <span className="bg-stone-950 px-2 py-1 rounded border border-stone-800 text-stone-400 font-mono">F8: Chọn khách</span>
            <span className="bg-stone-950 px-2 py-1 rounded border border-stone-800 text-stone-400 font-mono">F9: Thanh toán</span>
            <span className="bg-stone-950 px-2 py-1 rounded border border-stone-800 text-stone-400 font-mono">F4: Xóa giỏ</span>
          </div>
        </div>

      </div>

      {/* VIRTUAL THERMAL RECEIPT MODAL (Simulated printer output) */}
      {isReceiptOpen && completedInvoice && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div id="pos-thermal-receipt" className="kiotx-printable-receipt bg-white text-stone-900 w-full max-w-sm rounded-3xl p-6 shadow-[0_0_40px_rgba(16,185,129,0.2)] border border-stone-100 font-mono text-[11px] leading-relaxed relative animate-scaleUp">
            
            {/* Header circles to resemble thermal paper roll cut */}
            <div className="absolute top-0 inset-x-6 flex justify-between -translate-y-1.5 pointer-events-none">
              {Array.from({ length: 15 }).map((_, idx) => (
                <div key={idx} className="w-3 h-3 rounded-full bg-stone-950 border-t border-white" />
              ))}
            </div>

            {/* Receipt container */}
            <div className="space-y-4 pt-2">
              <div className="text-center space-y-1">
                <h4 className="text-xs font-black uppercase text-stone-950">{settings.shopName}</h4>
                <p className="text-[9px] text-stone-600">{settings.address}</p>
                <p className="text-[9px] text-stone-600">Hotline: {settings.phone}</p>
                <div className="border-b border-dashed border-stone-400 py-1" />
              </div>

              <div className="text-center space-y-0.5">
                <h3 className="text-sm font-black uppercase text-stone-950 tracking-wider">Hóa Đơn Thanh Toán</h3>
                <p className="font-bold font-mono text-stone-700">{completedInvoice.invoiceCode}</p>
                <p className="text-[9px] text-stone-500">{new Date(completedInvoice.date).toLocaleString("vi-VN")}</p>
              </div>

              {/* Invoice details metadata */}
              <div className="space-y-0.5 text-stone-700">
                <p>Khách hàng: <span className="font-bold text-stone-900">{completedInvoice.customerName}</span></p>
                <p>Thu ngân: <span className="font-bold text-stone-900">{completedInvoice.cashierName}</span></p>
                <p>Hình thức: <span className="font-bold text-stone-900">{
                  completedInvoice.paymentMethod === "CASH" ? "Tiền mặt" : 
                  completedInvoice.paymentMethod === "BANK_TRANSFER" ? "Chuyển khoản" : 
                  completedInvoice.paymentMethod === "DEBT" ? "Khách ghi nợ" : "Thẻ tín dụng"
                }</span></p>
                <div className="border-b border-dashed border-stone-400 py-1" />
              </div>

              {/* Items Table */}
              <div className="space-y-1.5">
                <div className="grid grid-cols-12 font-bold text-stone-950 border-b border-stone-200 pb-1">
                  <span className="col-span-6">Tên hàng</span>
                  <span className="col-span-2 text-center">SL</span>
                  <span className="col-span-4 text-right">T.Tiền</span>
                </div>

                <div className="space-y-2">
                  {completedInvoice.items.map(item => (
                    <div key={item.productId} className="grid grid-cols-12 text-stone-800">
                      <div className="col-span-6 space-y-0.5">
                        <span className="font-bold block text-stone-950 truncate">{item.productName}</span>
                        <span className="text-[9px] text-stone-500 block">{formatVND(item.unitPrice)}</span>
                      </div>
                      <span className="col-span-2 text-center">{item.quantity}</span>
                      <span className="col-span-4 text-right font-bold text-stone-950">{formatVND(item.total)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-b border-dashed border-stone-400 py-1" />
              </div>

              {/* Total calculations */}
              <div className="space-y-1 text-stone-800">
                <div className="flex justify-between">
                  <span>Cộng tiền hàng:</span>
                  <span>{formatVND(completedInvoice.totalOriginal)}</span>
                </div>
                {completedInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Tổng giảm giá:</span>
                    <span>-{formatVND(completedInvoice.discountAmount)}</span>
                  </div>
                )}
                {completedInvoice.taxAmount !== undefined ? (
                  <div className="flex justify-between">
                    <span>Thuế VAT ({completedInvoice.taxRate || 0}%):</span>
                    <span>{formatVND(completedInvoice.taxAmount || 0)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span>Thuế VAT ({settings.taxRate}%):</span>
                    <span>{formatVND((completedInvoice.totalOriginal - completedInvoice.discountAmount) * (settings.taxRate / 100))}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-stone-950 text-xs border-t border-stone-200 pt-1">
                  <span>TỔNG KHÁCH TRẢ:</span>
                  <span>{formatVND(completedInvoice.totalPayable)}</span>
                </div>
                
                {completedInvoice.paymentMethod === "CASH" && (
                  <>
                    <div className="flex justify-between">
                      <span>Tiền mặt nhận:</span>
                      <span>{formatVND(cashGiven)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tiền thối lại:</span>
                      <span>{formatVND(changeDue)}</span>
                    </div>
                  </>
                )}

                {completedInvoice.paymentMethod === "DEBT" && (
                  <div className="flex justify-between text-rose-600 font-extrabold text-[11px] bg-rose-50 p-1.5 rounded border border-rose-200 mt-1">
                    <span>GHI NỢ CÔNG NỢ:</span>
                    <span>{formatVND(completedInvoice.totalPayable)}</span>
                  </div>
                )}

                {completedInvoice.pointsEarned > 0 && (
                  <div className="text-[10px] text-emerald-600 font-bold border-t border-stone-100 pt-1 mt-1 text-center">
                    Chúc mừng! Bạn nhận thêm +{completedInvoice.pointsEarned} điểm tích lũy!
                  </div>
                )}

                {completedInvoice.eInvoiceStatus === "ISSUED" && (
                  <div className="bg-stone-50 border border-stone-200 p-2.5 rounded-xl mt-2 space-y-1 text-left text-stone-800 text-[9px] leading-relaxed">
                    <p className="font-extrabold text-stone-900 uppercase tracking-wider flex items-center gap-1">
                      <span>★ HÓA ĐƠN ĐIỆN TỬ (HĐĐT)</span>
                    </p>
                    <p>Mẫu số: <span className="font-bold">{settings.eInvoicePattern || "1C26TML"}</span></p>
                    <p>Ký hiệu: <span className="font-bold">{settings.eInvoiceSerial || "C26TGP"}</span></p>
                    <p>Mã CQT: <span className="font-bold font-mono">{completedInvoice.eInvoiceCode}</span></p>
                    <p className="text-[8px] text-stone-500 truncate">Tra cứu: <a href={completedInvoice.eInvoiceUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline font-mono font-bold">{completedInvoice.eInvoiceUrl}</a></p>
                  </div>
                )}

                {(() => {
                  const completedCust = completedInvoice.customerId 
                    ? customers.find(c => c.id === completedInvoice.customerId) 
                    : null;
                  if (completedCust?.email) {
                    return (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[9px] p-2.5 rounded-xl mt-2 flex flex-col gap-1 text-left leading-relaxed">
                        <p className="font-bold flex items-center gap-1 text-emerald-900">
                          <span>📧 GỬI EMAIL XÁC NHẬN THÀNH CÔNG</span>
                        </p>
                        <p className="text-emerald-700">Hệ thống đã tự động gửi thông tin chi tiết hóa đơn này đến email của khách hàng: <strong className="font-mono">{completedCust.email}</strong></p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="border-b border-dashed border-stone-400 py-1" />

              {/* Bottom footer barcode scan simulation */}
              <div className="text-center space-y-2 pt-1 text-stone-600 text-[10px]">
                <p className="font-bold text-stone-950 uppercase">Cảm ơn quý khách &amp; hẹn gặp lại!</p>
                <div className="flex flex-col items-center space-y-1">
                  <div className="h-6 bg-stone-950 w-44 flex items-center justify-around px-2 py-0.5 rounded">
                    {Array.from({ length: 22 }).map((_, i) => (
                      <div 
                        key={i} 
                        className="bg-white h-full" 
                        style={{ width: `${Math.floor(Math.random() * 3) + 1}px` }} 
                      />
                    ))}
                  </div>
                  <span className="text-[8px] font-mono font-bold tracking-widest text-stone-500">{completedInvoice.invoiceCode}</span>
                </div>
                <p className="text-[8px] text-stone-500 italic">Hệ thống hóa đơn điện tử KiotX. Powered by TGP.</p>
              </div>

            </div>

            {/* Actions for printing and starting new invoice */}
            <div className="mt-6 flex gap-3 border-t border-stone-200 pt-4 font-sans text-xs">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-2.5 rounded-xl border border-stone-200 flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-[0.98]"
              >
                In Hóa Đơn
              </button>
              <button
                type="button"
                onClick={handleResetPOS}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black py-2.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all shadow-md active:scale-[0.98]"
              >
                Giao Dịch Mới
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEVICE CAMERA BARCODE SCANNER MODAL */}
      <BarcodeScannerModal
        isOpen={barcodeScannerMode}
        onClose={() => setBarcodeScannerMode(false)}
        products={products}
        onAddToCart={handleAddToCart}
      />

    </div>
  </div>
  );
}
