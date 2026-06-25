import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { 
  LogIn, LogOut, Plus, Edit2, Trash2, LayoutDashboard, FileText, 
  CheckCircle, Eye, EyeOff, Save, Undo, User as UserIcon, Globe, Image, List, Check, AlertCircle,
  Sparkles, Menu, X, HelpCircle, Package, ShoppingCart, PhoneCall, Ticket, Settings
} from "lucide-react";
import { auth, googleAuthProvider } from "../lib/firebase.ts";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { Post } from "./BlogSection.tsx";
import PluginGuide from "./PluginGuide";

// Custom Admin Subcomponents
import AdminSidebar from "./AdminSidebar";
import AdminDashboardHome from "./AdminDashboardHome";
import AdminUsersList from "./AdminUsersList";
import AdminProductsList from "./AdminProductsList";
import AdminOrdersList from "./AdminOrdersList";
import AdminConsultationsList from "./AdminConsultationsList";
import AdminCouponsList from "./AdminCouponsList";
import AdminSettingsPanel from "./AdminSettingsPanel";

interface AdminDashboardProps {
  onClose: () => void;
  onPostCreatedOrModified: () => void;
  onOpenChatWithPrompt: (prompt: string) => void;
}

const DEFAULT_GALLERY_IMAGES = [
  { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80", label: "Trần thạch cao phòng khách" },
  { url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80", label: "Vách lam sóng composite" },
  { url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=400&q=80", label: "Nhựa PVC giả đá" },
  { url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80", label: "Trần thạch cao thả văn phòng" },
  { url: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=400&q=80", label: "Phào chỉ thạch cao cổ điển" },
  { url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80", label: "Trần phẳng hiện đại" },
  { url: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=400&q=80", label: "Gỗ nhựa lót sàn ốp trần" },
  { url: "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=400&q=80", label: "Trần phòng ăn ấm cúng" },
  { url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=400&q=80", label: "Trần thạch cao biệt thự" },
  { url: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=400&q=80", label: "Phào chỉ nhựa PU/PS" }
];

export default function AdminDashboard({ onClose, onPostCreatedOrModified, onOpenChatWithPrompt }: AdminDashboardProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("tgp_admin_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem("tgp_admin_sidebar_collapsed", String(next));
      } catch (err) {}
      return next;
    });
  };
  
  // Load and merge gallery images from localStorage
  const [galleryImages, setGalleryImages] = useState(() => {
    try {
      const stored = localStorage.getItem("tgp_custom_images");
      const custom = stored ? JSON.parse(stored) : [];
      return [...custom, ...DEFAULT_GALLERY_IMAGES];
    } catch {
      return DEFAULT_GALLERY_IMAGES;
    }
  });

  const handleLocalImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const newImg = {
        url: base64String,
        label: file.name.split(".")[0] || "Ảnh mới"
      };
      try {
        const stored = localStorage.getItem("tgp_custom_images");
        const custom = stored ? JSON.parse(stored) : [];
        const updated = [newImg, ...custom];
        localStorage.setItem("tgp_custom_images", JSON.stringify(updated));
        setGalleryImages([newImg, ...galleryImages]);
        setImageUrl(base64String);
      } catch (err) {
        alert("Ảnh quá lớn hoặc bộ nhớ trình duyệt đã đầy! Vui lòng tải ảnh có dung lượng nhỏ hơn (dưới 1-2MB) hoặc dùng link ảnh trực tiếp.");
      }
    };
    reader.readAsDataURL(file);
  };
  
  // Form State
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Tin tức");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [focusKeyword, setFocusKeyword] = useState("thi công");
  
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error", text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Rank Math Style Live SEO Score Calculator
  const getSEOScore = () => {
    let score = 0;
    const checks: { ok: boolean; text: string }[] = [];

    // Check 1: Focus keyword in title (20 points)
    if (focusKeyword && title.toLowerCase().includes(focusKeyword.toLowerCase())) {
      score += 20;
      checks.push({ ok: true, text: `Từ khóa tập trung "${focusKeyword}" xuất hiện trong tiêu đề` });
    } else {
      checks.push({ ok: false, text: `Cần đưa từ khóa "${focusKeyword}" vào tiêu đề` });
    }

    // Check 2: Title length (20 points)
    if (title.length >= 35 && title.length <= 75) {
      score += 20;
      checks.push({ ok: true, text: `Độ dài tiêu đề tối ưu cho Google (${title.length} kí tự)` });
    } else {
      checks.push({ ok: false, text: `Tiêu đề nên có độ dài chuẩn từ 35 - 75 kí tự (hiện tại: ${title.length})` });
    }

    // Check 3: Focus keyword in content (20 points)
    if (focusKeyword && content.toLowerCase().includes(focusKeyword.toLowerCase())) {
      score += 20;
      checks.push({ ok: true, text: `Từ khóa tập trung "${focusKeyword}" xuất hiện trong nội dung chính` });
    } else {
      checks.push({ ok: false, text: `Chưa phân bổ từ khóa "${focusKeyword}" trong thân bài viết` });
    }

    // Check 4: Content length (20 points)
    const wordCount = content.trim() === "" ? 0 : content.trim().split(/\s+/).length;
    if (wordCount >= 100) {
      score += 20;
      checks.push({ ok: true, text: `Độ dài bài viết tốt (${wordCount} từ)` });
    } else {
      checks.push({ ok: false, text: `Nội dung quá ngắn để SEO (hiện tại: ${wordCount}/100 từ)` });
    }

    // Check 5: Excerpt presence (20 points)
    if (excerpt.trim().length >= 20) {
      score += 20;
      checks.push({ ok: true, text: "Đã điền mô tả tóm tắt (Excerpt) chuẩn Rank Math" });
    } else {
      checks.push({ ok: false, text: "Nên thêm mô tả tóm tắt ngắn (Excerpt) tối thiểu 20 kí tự" });
    }

    return { score, checks };
  };

  // Subscribe to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const token = await user.getIdToken();
          setAuthToken(token);
          // Sync with backend database user table
          await syncUserInDb(token);
          // Fetch admin-view posts (including drafts)
          await fetchAllPosts(token);
        } catch (err) {
          console.error("Lỗi xác thực người dùng:", err);
        }
      } else {
        setCurrentUser(null);
        setAuthToken(null);
        setPosts([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const syncUserInDb = async (token: string) => {
    try {
      await fetch("/api/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error("Không thể đồng bộ người dùng với Database:", err);
    }
  };

  const fetchAllPosts = async (token: string) => {
    try {
      const res = await fetch("/api/posts/all", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error("Không thể tải danh sách bài viết quản trị:", err);
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      setStatusMsg(null);
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err: any) {
      console.error("Lỗi đăng nhập Google:", err);
      if (err?.code === "auth/popup-closed-by-user") {
        setStatusMsg({ type: "error", text: "Cửa sổ đăng nhập đã bị đóng trước khi hoàn thành xác thực." });
      } else {
        setStatusMsg({ type: "error", text: "Đăng nhập thất bại. Vui lòng thử lại!" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setAuthToken(null);
      setIsEditing(false);
      setIsCreating(false);
    } catch (err) {
      console.error("Lỗi đăng xuất:", err);
    }
  };

  const handleCreateNewClick = () => {
    setTitle("");
    setCategory("Tin tức");
    setExcerpt("");
    setContent("");
    setImageUrl("https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80");
    setVideoUrl("");
    setIsPublished(true);
    setSelectedPostId(null);
    setIsCreating(true);
    setIsEditing(false);
    setStatusMsg(null);
  };

  const handleEditClick = (post: Post) => {
    setSelectedPostId(post.id);
    setTitle(post.title);
    setCategory(post.category);
    setExcerpt(post.excerpt || "");
    setContent(post.content);
    setImageUrl(post.imageUrl || "");
    setVideoUrl(post.videoUrl || "");
    setIsPublished(post.isPublished);
    setIsEditing(true);
    setIsCreating(false);
    setStatusMsg(null);
  };

  const handleDeleteClick = async (postId: number) => {
    if (!authToken) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể khôi phục.")) return;

    try {
      setActionLoading(true);
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      });

      if (res.ok) {
        setStatusMsg({ type: "success", text: "Đã xóa bài viết thành công khỏi hệ thống!" });
        fetchAllPosts(authToken);
        onPostCreatedOrModified();
      } else {
        const errData = await res.json();
        setStatusMsg({ type: "error", text: errData.error || "Lỗi khi xóa bài viết" });
      }
    } catch (err) {
      console.error("Lỗi khi xóa:", err);
      setStatusMsg({ type: "error", text: "Đã xảy ra lỗi kết nối." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!authToken) return;
    if (!title.trim() || !content.trim()) {
      setStatusMsg({ type: "error", text: "Vui lòng nhập đầy đủ Tiêu đề và Nội dung bài viết!" });
      return;
    }

    try {
      setActionLoading(true);
      const url = isCreating ? "/api/posts" : `/api/posts/${selectedPostId}`;
      const method = isCreating ? "POST" : "PUT";
      
      const payload = {
        title: title.trim(),
        category,
        excerpt: excerpt.trim(),
        content: content.trim(),
        imageUrl: imageUrl.trim() || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
        videoUrl: videoUrl.trim(),
        isPublished
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setStatusMsg({ 
          type: "success", 
          text: isCreating ? "Đăng bài viết mới thành công!" : "Cập nhật bài viết thành công!" 
        });
        setIsCreating(false);
        setIsEditing(false);
        fetchAllPosts(authToken);
        onPostCreatedOrModified();
      } else {
        const errData = await res.json();
        setStatusMsg({ type: "error", text: errData.error || "Gặp lỗi khi xử lý bài viết" });
      }
    } catch (err) {
      console.error("Lỗi submit form:", err);
      setStatusMsg({ type: "error", text: "Đã xảy ra lỗi kết nối đến máy chủ." });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-950 z-50 flex overflow-hidden h-screen w-screen font-sans">
      {loading ? (
        <div className="flex flex-col items-center justify-center flex-grow py-32 space-y-4 bg-stone-950 w-full h-full">
          <div className="h-8 w-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          <span className="text-stone-400 text-xs font-mono">Đang kết nối hệ thống dữ liệu...</span>
        </div>
      ) : !currentUser ? (
        /* Centered Authentication Gate */
        <div className="flex items-center justify-center w-full h-full bg-stone-950/90 p-4">
          <div className="max-w-md w-full p-8 bg-stone-900 border border-stone-800 rounded-2xl shadow-xl space-y-6 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-serif text-stone-100">Đăng Nhập Quản Trị Viên</h2>
              <p className="text-xs text-stone-400 leading-relaxed">
                Vui lòng đăng nhập bằng tài khoản Google để truy cập vào Bảng điều khiển thi công vật liệu thạch cao & nhựa giả gỗ Trương Gia Phát.
              </p>
            </div>

            {statusMsg && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{statusMsg.text}</span>
              </div>
            )}

            <button
              onClick={handleLogin}
              className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <LogIn className="h-5 w-5" />
              Đăng Nhập Với Google
            </button>
          </div>
        </div>
      ) : (
        /* Logged In Dashboard with Responsive Sidebar & Tab Workspace */
        <>
          {/* 1. Desktop Sidebar */}
          <div className={`hidden md:block h-full border-r border-stone-850 transition-all duration-300 ${isSidebarCollapsed ? "w-16" : "w-64"}`}>
            <AdminSidebar
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab);
                setStatusMsg(null);
              }}
              currentUser={currentUser}
              onLogout={handleLogout}
              onClose={onClose}
              postsCount={posts.length}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={toggleSidebarCollapse}
            />
          </div>

          {/* 2. Mobile Sidebar Slide-over Drawer */}
          {isSidebarMobileOpen && (
            <div className="fixed inset-0 z-50 flex md:hidden">
              {/* Overlay backdrop */}
              <div 
                className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm"
                onClick={() => setIsSidebarMobileOpen(false)}
              />
              {/* Sidebar body */}
              <div className="relative flex flex-col w-64 max-w-xs h-full bg-[#1e2d3b] shadow-2xl z-10 animate-slide-in">
                <div className="absolute top-4 right-4 z-20">
                  <button 
                    onClick={() => setIsSidebarMobileOpen(false)}
                    className="p-1 rounded-full bg-stone-800 text-stone-300 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="h-full overflow-y-auto">
                  <AdminSidebar
                    activeTab={activeTab}
                    setActiveTab={(tab) => {
                      setActiveTab(tab);
                      setStatusMsg(null);
                      setIsSidebarMobileOpen(false);
                    }}
                    currentUser={currentUser}
                    onLogout={handleLogout}
                    onClose={onClose}
                    postsCount={posts.length}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. Main content workspace area */}
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-stone-950">
            {/* Control Header Toolbar */}
            <header className="bg-stone-900 border-b border-stone-800 h-16 px-6 shrink-0 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                {/* Mobile Hamburger toggle button */}
                <button
                  onClick={() => setIsSidebarMobileOpen(true)}
                  className="md:hidden p-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700"
                >
                  <Menu className="h-5 w-5" />
                </button>

                <div className="space-y-0.5">
                  <h2 className="text-xs font-black uppercase tracking-widest text-amber-500">HỆ THỐNG ERP NỘI THẤT</h2>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider font-mono hidden sm:block">
                    Hệ thống: {activeTab === "posts" ? "Bài viết cẩm nang" : activeTab === "plugins" ? "Cẩm nang Plugin WP" : activeTab === "dashboard" ? "Bảng điều khiển" : activeTab}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold cursor-pointer border border-stone-700 hover:border-amber-500/40 transition-all"
                >
                  Quay lại Website
                </button>
              </div>
            </header>

            {/* Scrollable Work Area */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
              
              {/* Flash / Status alerts banner */}
              {statusMsg && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 animate-fade-in ${
                  statusMsg.type === "success" 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}>
                  {statusMsg.type === "success" ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
                  <span className="text-xs sm:text-sm font-medium">{statusMsg.text}</span>
                </div>
              )}

              {/* Dynamic tab contents switch */}
              {activeTab === "dashboard" && (
                <AdminDashboardHome
                  postsCount={posts.length}
                  productsCount={5}
                  ordersCount={4}
                  consultationsCount={4}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === "users" && (
                <AdminUsersList />
              )}

              {activeTab === "products" && (
                <AdminProductsList />
              )}

              {activeTab === "orders" && (
                <AdminOrdersList />
              )}

              {activeTab === "consultations" && (
                <AdminConsultationsList />
              )}

              {activeTab === "coupons" && (
                <AdminCouponsList />
              )}

              {activeTab === "settings" && (
                <AdminSettingsPanel />
              )}

              {activeTab === "plugins" && (
                <div className="bg-stone-900 rounded-2xl border border-stone-850 p-4 sm:p-6 overflow-hidden">
                  <PluginGuide onOpenChatWithPrompt={onOpenChatWithPrompt} />
                </div>
              )}

              {activeTab === "posts" && (
                <>
                  {/* Article creation and editing panel */}
                  {(isCreating || isEditing) && (
                    <div className="p-5 sm:p-6 bg-stone-900 border border-stone-850 rounded-2xl shadow-xl space-y-6 animate-fade-in">
                      <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                        <h3 className="text-sm sm:text-base font-bold text-stone-100 flex items-center gap-2">
                          <FileText className="h-5 w-5 text-amber-500" />
                          <span>{isCreating ? "Tạo Bài Viết Mới" : "Sửa Bài Viết"}</span>
                        </h3>
                        <button
                          onClick={() => {
                            setIsCreating(false);
                            setIsEditing(false);
                            setStatusMsg(null);
                          }}
                          className="p-1 text-stone-400 hover:text-stone-200 cursor-pointer"
                        >
                          <Undo className="h-5 w-5" />
                        </button>
                      </div>

                      <form onSubmit={handleFormSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 space-y-0">
                        {/* Left Inputs Column */}
                        <div className="lg:col-span-2 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Title */}
                            <div className="md:col-span-2 space-y-1.5">
                              <label className="text-xs text-stone-400 font-bold block uppercase tracking-wider">Tiêu đề bài viết *</label>
                              <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Nhập tiêu đề hấp dẫn..."
                                required
                                className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs sm:text-sm focus:border-amber-500 focus:outline-none transition-all"
                              />
                            </div>

                            {/* Category */}
                            <div className="space-y-1.5">
                              <label className="text-xs text-stone-400 font-bold block uppercase tracking-wider">Danh mục *</label>
                              <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs sm:text-sm focus:border-amber-500 focus:outline-none transition-all"
                              >
                                <option value="Tin tức">Tin tức</option>
                                <option value="Mẹo thi công">Mẹo thi công</option>
                                <option value="Vật liệu">Vật liệu</option>
                                <option value="Dự án">Dự án</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Featured Image URL */}
                            <div className="space-y-1.5">
                              <label className="text-xs text-stone-400 font-bold block uppercase tracking-wider">Đường dẫn ảnh nổi bật (Image URL)</label>
                              <input
                                type="url"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://images.unsplash.com/photo-..."
                                className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs sm:text-sm focus:border-amber-500 focus:outline-none transition-all font-mono text-[11px]"
                              />
                            </div>

                            {/* Video Walkthrough URL */}
                            <div className="space-y-1.5">
                              <label className="text-xs text-stone-400 font-bold block uppercase tracking-wider">Đường dẫn Video thực tế (YouTube Embed Link)</label>
                              <input
                                type="url"
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                placeholder="Ví dụ: https://www.youtube.com/embed/dQw4w9WgXcQ"
                                className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs sm:text-sm focus:border-amber-500 focus:outline-none transition-all font-mono text-[11px]"
                              />
                            </div>
                          </div>

                          <div className="flex items-center">
                            {/* Is Published Toggle */}
                            <label className="flex items-center gap-3 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={isPublished}
                                onChange={(e) => setIsPublished(e.target.checked)}
                                className="h-4.5 w-4.5 rounded bg-stone-950 border-stone-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-stone-900 focus:ring-2"
                              />
                              <div className="text-xs font-bold text-stone-300 uppercase tracking-wide flex items-center gap-1.5">
                                {isPublished ? (
                                  <>
                                    <Eye className="h-4 w-4 text-emerald-400" />
                                    <span className="text-emerald-400">Xuất bản công khai</span>
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="h-4 w-4 text-stone-500" />
                                    <span className="text-stone-500">Lưu bản nháp (Draft)</span>
                                  </>
                                )}
                              </div>
                            </label>
                          </div>

                          {/* Pre-approved Image Library section for Blog Post */}
                          <div className="space-y-2 bg-stone-950 p-4 rounded-xl border border-stone-850">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800/80 pb-2 mb-1">
                              <div className="flex items-center gap-1.5 text-stone-300">
                                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Kho Ảnh Thực Tế Trương Gia Phát (Nhấp chọn để gắn ảnh bài viết)</span>
                              </div>
                              
                              {/* Local file uploader from computer */}
                              <label className="flex items-center gap-1.5 bg-amber-500 text-stone-950 px-2.5 py-1 rounded text-[10px] font-black uppercase cursor-pointer hover:bg-amber-400 transition-all select-none shrink-0">
                                <Image className="h-3 w-3" />
                                <span>Úp ảnh từ máy lên</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleLocalImageUpload}
                                  className="hidden"
                                />
                              </label>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 max-h-40 overflow-y-auto pr-1">
                              {galleryImages.map((img, index) => {
                                const isSelected = imageUrl === img.url;
                                return (
                                  <div
                                    key={index}
                                    onClick={() => setImageUrl(img.url)}
                                    className={`relative aspect-[4/3] rounded-lg overflow-hidden border cursor-pointer transition-all hover:scale-[1.02] group ${
                                      isSelected 
                                        ? "border-amber-500 shadow-lg ring-1 ring-amber-500" 
                                        : "border-stone-800 hover:border-stone-600"
                                    }`}
                                  >
                                    <img
                                      src={img.url}
                                      alt={img.label}
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent opacity-100 flex items-end p-1.5">
                                      <span className="text-[8px] font-bold text-stone-200 line-clamp-1 group-hover:text-amber-400">{img.label}</span>
                                    </div>
                                    {isSelected && (
                                      <div className="absolute top-1 right-1 bg-amber-500 text-stone-950 p-0.5 rounded-full shadow">
                                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Excerpt */}
                          <div className="space-y-1.5">
                            <label className="text-xs text-stone-400 font-bold block uppercase tracking-wider">Mô tả ngắn (Excerpt)</label>
                            <textarea
                              value={excerpt}
                              onChange={(e) => setExcerpt(e.target.value)}
                              placeholder="Nhập tóm tắt ngắn cho bài viết hiển thị ở danh mục thẻ..."
                              rows={2}
                              className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs sm:text-sm focus:border-amber-500 focus:outline-none transition-all"
                            />
                          </div>

                          {/* Body Content */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-xs text-stone-400 font-bold block uppercase tracking-wider">Nội dung chi tiết bài viết (Markdown hoặc văn bản thường) *</label>
                              <span className="text-[10px] text-stone-500">Gõ <b># Tiêu đề</b> để tạo tiêu đề h1, gõ <b>- Dòng</b> để tạo gạch đầu dòng</span>
                            </div>
                            <textarea
                              value={content}
                              onChange={(e) => setContent(e.target.value)}
                              placeholder="Nội dung bài viết chi tiết... Sử dụng markdown cơ bản hoặc đoạn văn thông thường."
                              rows={8}
                              required
                              className="w-full px-4 py-3 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs sm:text-sm focus:border-amber-500 focus:outline-none transition-all font-sans leading-relaxed"
                            />
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
                            <button
                              type="button"
                              onClick={() => {
                                setIsCreating(false);
                                setIsEditing(false);
                                setStatusMsg(null);
                              }}
                              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold cursor-pointer"
                            >
                              Hủy bỏ
                            </button>
                            <button
                              type="submit"
                              disabled={actionLoading}
                              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              {actionLoading ? (
                                <div className="h-3.5 w-3.5 rounded-full border-2 border-stone-950 border-t-transparent animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                              <span>Lưu lại dữ liệu</span>
                            </button>
                          </div>
                        </div>

                        {/* Right Rank Math SEO Column */}
                        <div className="lg:col-span-1 space-y-4 bg-stone-950 p-4 border border-stone-850 rounded-2xl flex flex-col h-full justify-start">
                          <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
                            <Sparkles className="h-4.5 w-4.5 text-amber-500" />
                            <h4 className="text-xs font-bold text-stone-200 uppercase tracking-wider">Kiểm tra SEO (Rank Math)</h4>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">Từ khóa tập trung</label>
                            <input
                              type="text"
                              value={focusKeyword}
                              onChange={(e) => setFocusKeyword(e.target.value)}
                              placeholder="Từ khóa chính (Ví dụ: thi công)"
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-xs focus:border-amber-500 focus:outline-none transition-all font-sans font-bold"
                            />
                            <p className="text-[10px] text-stone-500">Dùng để chấm điểm mức độ tối ưu tiêu đề, nội dung chính trên Google.</p>
                          </div>

                          {/* SEO Score Gauge */}
                          {(() => {
                            const { score, checks } = getSEOScore();
                            const scoreColor = score >= 80 
                              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
                              : score >= 50 
                              ? "text-amber-400 bg-amber-500/10 border-amber-500/20" 
                              : "text-red-400 bg-red-500/10 border-red-500/20";
                            return (
                              <>
                                <div className="flex items-center justify-between bg-stone-900/50 p-3 rounded-xl border border-stone-800">
                                  <span className="text-xs text-stone-300 font-bold">Điểm tối ưu hóa</span>
                                  <span className={`px-3 py-1 rounded-full text-xs font-black border font-mono ${scoreColor}`}>
                                    {score}/100
                                  </span>
                                </div>

                                <div className="space-y-3 pt-2">
                                  <h5 className="text-[10px] text-stone-400 font-bold block uppercase tracking-widest">Danh sách tiêu chí đạt được:</h5>
                                  <div className="space-y-2.5 overflow-y-auto max-h-[16rem]">
                                    {checks.map((chk, idx) => (
                                      <div key={idx} className="flex items-start gap-2 text-[11px] leading-relaxed">
                                        {chk.ok ? (
                                          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                                        ) : (
                                          <AlertCircle className="h-4 w-4 text-stone-600 shrink-0 mt-0.5" />
                                        )}
                                        <span className={chk.ok ? "text-stone-300 font-medium" : "text-stone-500"}>{chk.text}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </form>
                    </div>
                  )}

                  {/* List of articles */}
                  <div className="p-5 sm:p-6 bg-stone-900 border border-stone-850 rounded-2xl shadow-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-3">
                      <h3 className="text-sm font-bold text-stone-200 uppercase tracking-wider flex items-center gap-2">
                        <List className="h-4.5 w-4.5 text-amber-500" />
                        <span>Danh sách bài viết trong Cơ Sở Dữ Liệu SQL</span>
                      </h3>
                      <button
                        onClick={handleCreateNewClick}
                        disabled={isCreating || actionLoading}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md shadow-amber-500/5 disabled:opacity-50 self-end sm:self-auto"
                      >
                        <Plus className="h-4 w-4" />
                        Viết Bài Mới
                      </button>
                    </div>

                    {posts.length === 0 ? (
                      <div className="text-center py-16 text-stone-500">
                        <FileText className="h-10 w-10 mx-auto opacity-30 mb-2" />
                        <p className="text-xs">Không có bài viết nào được tìm thấy. Bấm nút "Viết Bài Mới" để bắt đầu!</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-stone-800 text-stone-400 font-bold text-[10px] uppercase tracking-wider">
                              <th className="pb-3 pr-4">Bài viết</th>
                              <th className="pb-3 px-4">Danh mục</th>
                              <th className="pb-3 px-4">Trạng thái</th>
                              <th className="pb-3 pl-4 text-right">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-850">
                            {posts.map((post) => (
                              <tr key={post.id} className="hover:bg-stone-850/40 transition-colors">
                                <td className="py-3.5 pr-4 flex items-center gap-3">
                                  <img 
                                    src={post.imageUrl || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=80&q=80"} 
                                    alt="Thumbnail" 
                                    className="h-10 w-16 object-cover rounded bg-stone-950 border border-stone-800 shrink-0"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="space-y-0.5">
                                    <h4 className="font-bold text-stone-200 line-clamp-1 max-w-[150px] sm:max-w-[280px]">{post.title}</h4>
                                    <p className="text-[10px] text-stone-500">ID: #{post.id} • Đăng ngày {new Date(post.createdAt).toLocaleDateString()}</p>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 font-semibold text-stone-300">
                                  {post.category}
                                </td>
                                <td className="py-3.5 px-4">
                                  {post.isPublished ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/10 font-bold uppercase tracking-wider">
                                      <Globe className="h-3 w-3" />
                                      <span>Công khai</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] bg-stone-800 text-stone-500 px-2 py-0.5 rounded-full border border-stone-700/80 font-bold uppercase tracking-wider">
                                      <EyeOff className="h-3 w-3" />
                                      <span>Bản nháp</span>
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 pl-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => handleEditClick(post)}
                                      disabled={actionLoading}
                                      className="p-1.5 rounded-lg bg-stone-800 hover:bg-amber-500/10 text-stone-300 hover:text-amber-500 border border-stone-750 cursor-pointer transition-all"
                                      title="Chỉnh sửa"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteClick(post.id)}
                                      disabled={actionLoading}
                                      className="p-1.5 rounded-lg bg-stone-800 hover:bg-red-500/10 text-stone-300 hover:text-red-400 border border-stone-750 cursor-pointer transition-all"
                                      title="Xóa bỏ"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Other menu options placeholders with fully styled configurations */}
              {["support", "locations", "contact"].includes(activeTab) && (
                <div className="p-8 bg-stone-900 border border-stone-850 rounded-2xl shadow-xl text-center space-y-4 max-w-lg mx-auto my-12 animate-fade-in">
                  <div className="mx-auto h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500">
                    <HelpCircle className="h-6 w-6 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-stone-100 uppercase tracking-wider">Kênh Kỹ Thuật Đã Được Thiết Lập</h3>
                    <p className="text-xs text-stone-400 leading-relaxed">
                      Tính năng kết nối trực tiếp đến tổng đài hoặc hỗ trợ trực tuyến qua Zalo và Hotline đã được kích hoạt trên thanh liên hệ chính của khách hàng. Hãy nhấn vào nút liên hệ hoặc cấu hình trong mục "Thiết lập".
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("settings")}
                    className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-amber-500 border border-stone-700 text-xs font-bold tracking-wide transition-all cursor-pointer"
                  >
                    Đi tới Cài đặt liên hệ
                  </button>
                </div>
              )}

            </main>
          </div>
        </>
      )}
    </div>
  );
}
