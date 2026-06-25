import { useState, FormEvent, ChangeEvent } from "react";
import { Package, Search, Plus, Trash2, Edit2, ToggleLeft, ToggleRight, Check, AlertCircle, X, CheckCircle, Image as ImageIcon, Sparkles } from "lucide-react";

const GALLERY_IMAGES = [
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

export default function AdminProductsList() {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [products, setProducts] = useState([
    { id: 101, name: "Trần Thạch Cao Giật Cấp Cổ Điển", category: "Thạch cao", price: "245,000đ/m²", stock: true, img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=120&q=80", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
    { id: 102, name: "Nhựa Ốp Tường Composite Lam Sóng", category: "Nhựa Composite", price: "380,000đ/m²", stock: true, img: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=120&q=80", videoUrl: "" },
    { id: 103, name: "Tấm Nhựa PVC Giả Đá Cẩm Thạch", category: "Nhựa giả đá", price: "Liên hệ", stock: true, img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=120&q=80", videoUrl: "" },
    { id: 104, name: "Trần Thạch Cao Thả Tấm 60x60 Văn Phòng", category: "Thạch cao", price: "145,000đ/m²", stock: true, img: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=120&q=80", videoUrl: "" },
    { id: 105, name: "Phào Chỉ Thạch Cao Bản 8cm Tân Cổ Điển", category: "Thạch cao", price: "75,000đ/md", stock: false, img: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=120&q=80", videoUrl: "" },
  ]);

  // Load and merge gallery images from localStorage
  const [galleryImages, setGalleryImages] = useState(() => {
    try {
      const stored = localStorage.getItem("tgp_custom_images");
      const custom = stored ? JSON.parse(stored) : [];
      return [...custom, ...GALLERY_IMAGES];
    } catch {
      return GALLERY_IMAGES;
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
        setProdImg(base64String);
      } catch (err) {
        alert("Ảnh quá lớn hoặc bộ nhớ trình duyệt đã đầy! Vui lòng tải ảnh có dung lượng nhỏ hơn (dưới 1-2MB) hoặc dùng link ảnh trực tiếp.");
      }
    };
    reader.readAsDataURL(file);
  };

  // Form toggles and states
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [prodName, setProdName] = useState("");
  const [prodCat, setProdCat] = useState("Thạch cao");
  const [prodPrice, setProdPrice] = useState("");
  const [prodImg, setProdImg] = useState("");
  const [prodVideoUrl, setProdVideoUrl] = useState("");
  const [prodStock, setProdStock] = useState(true);

  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const toggleStock = (id: number) => {
    setProducts(products.map(p => p.id === id ? { ...p, stock: !p.stock } : p));
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa sản phẩm/vật tư "${name}" khỏi danh mục không?`)) {
      setProducts(products.filter(p => p.id !== id));
      setMsg({ text: `Đã xóa sản phẩm "${name}" khỏi hệ thống.`, type: "success" });
    }
  };

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setProdName("");
    setProdCat("Thạch cao");
    setProdPrice("");
    setProdImg("https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=120&q=80");
    setProdVideoUrl("");
    setProdStock(true);
    setMsg(null);
  };

  const handleStartEdit = (p: typeof products[0]) => {
    setEditingId(p.id);
    setIsAdding(false);
    setProdName(p.name);
    setProdCat(p.category);
    setProdPrice(p.price);
    setProdImg(p.img);
    setProdVideoUrl(p.videoUrl || "");
    setProdStock(p.stock);
    setMsg(null);
  };

  const handleCancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setMsg(null);
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPrice) {
      setMsg({ text: "Vui lòng nhập đầy đủ tên sản phẩm và đơn giá!", type: "error" });
      return;
    }

    const finalImg = prodImg.trim() || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=120&q=80";

    if (editingId !== null) {
      // Edit mode
      setProducts(products.map(p => p.id === editingId ? {
        ...p,
        name: prodName,
        category: prodCat,
        price: prodPrice,
        stock: prodStock,
        img: finalImg,
        videoUrl: prodVideoUrl.trim()
      } : p));
      setMsg({ text: `Đã cập nhật thông tin sản phẩm "${prodName}" thành công.`, type: "success" });
      setEditingId(null);
    } else {
      // Add mode
      const newId = Math.max(...products.map(p => p.id), 100) + 1;
      const newProd = {
        id: newId,
        name: prodName,
        category: prodCat,
        price: prodPrice,
        stock: prodStock,
        img: finalImg,
        videoUrl: prodVideoUrl.trim()
      };
      setProducts([...products, newProd]);
      setMsg({ text: `Đã thêm sản phẩm mới "${prodName}" thành công.`, type: "success" });
      setIsAdding(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCat === "all" || p.category === filterCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="p-5 sm:p-6 bg-stone-900 border border-stone-850 rounded-2xl shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-stone-100 uppercase tracking-wider flex items-center gap-2">
            <Package className="h-4.5 w-4.5 text-amber-500" />
            <span>Danh mục sản phẩm & dịch vụ ({products.length})</span>
          </h3>
          <p className="text-xs text-stone-400">Quản lý và điều chỉnh danh sách vật tư xây dựng thạch cao, tấm nhựa composite thi công thực tế.</p>
        </div>
        {!isAdding && editingId === null && (
          <button
            onClick={handleStartAdd}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 cursor-pointer transition-all self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm sản phẩm mới</span>
          </button>
        )}
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs sm:text-sm font-medium ${
          msg.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
            : "bg-red-500/10 border-red-500/20 text-red-400"
        }`}>
          {msg.type === "success" ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Form Add or Edit Product */}
      {(isAdding || editingId !== null) && (
        <form onSubmit={handleFormSubmit} className="p-5 bg-stone-950 border border-stone-800 rounded-xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-stone-850 pb-2.5">
            <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider">
              {editingId !== null ? "Chỉnh Sửa Thông Tin Sản Phẩm" : "Thêm Sản Phẩm / Vật Tư Mới"}
            </h4>
            <button
              type="button"
              onClick={handleCancelForm}
              className="p-1 rounded bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">Tên vật tư / sản phẩm *</label>
              <input
                type="text"
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                placeholder="Ví dụ: Trần Thạch Cao Giật Cấp Hiện Đại"
                required
                className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-100 text-xs focus:border-amber-500 focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">Đơn giá tham khảo *</label>
                <button
                  type="button"
                  onClick={() => setProdPrice("Liên hệ")}
                  className="text-[9px] font-black uppercase text-amber-500 hover:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 cursor-pointer hover:bg-amber-500/20 transition-all"
                >
                  Đặt "Liên hệ" nhanh
                </button>
              </div>
              <input
                type="text"
                value={prodPrice}
                onChange={(e) => setProdPrice(e.target.value)}
                placeholder="Ví dụ: 350,000đ/m² hoặc Liên hệ"
                required
                className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-100 text-xs focus:border-amber-500 focus:outline-none transition-all"
              />
              <p className="text-[9px] text-stone-500">Cho phép nhập cả số và chữ (Ví dụ: <b>Liên hệ</b>, <b>350k/m²</b>, <b>Thỏa thuận</b>).</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">Loại hình danh mục</label>
              <select
                value={prodCat}
                onChange={(e) => setProdCat(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-300 text-xs focus:border-amber-500 focus:outline-none transition-all"
              >
                <option value="Thạch cao">Thạch cao</option>
                <option value="Nhựa Composite">Nhựa Composite</option>
                <option value="Nhựa giả đá">Nhựa giả đá</option>
                <option value="Phào chỉ">Phào chỉ & phào tường</option>
                <option value="Dịch vụ khác">Dịch vụ khác</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">Đường dẫn hình ảnh (URL)</label>
              <input
                type="url"
                value={prodImg}
                onChange={(e) => setProdImg(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-100 text-xs focus:border-amber-500 focus:outline-none transition-all font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">Đường dẫn Video thực tế (YouTube Embed URL)</label>
              <input
                type="url"
                value={prodVideoUrl}
                onChange={(e) => setProdVideoUrl(e.target.value)}
                placeholder="Ví dụ: https://www.youtube.com/embed/dQw4w9WgXcQ"
                className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-100 text-xs focus:border-amber-500 focus:outline-none transition-all font-mono"
              />
            </div>

            {/* Pre-approved Image Library section */}
            <div className="space-y-2 md:col-span-2 bg-stone-900/40 p-3 rounded-xl border border-stone-850">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800/60 pb-2 mb-1">
                <div className="flex items-center gap-1.5 text-stone-300">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Kho Ảnh Thực Tế Trương Gia Phát (Nhấp chọn để đẩy lên sản phẩm)</span>
                </div>
                
                {/* Local file uploader */}
                <label className="flex items-center gap-1.5 bg-amber-500 text-stone-950 px-2.5 py-1 rounded text-[10px] font-black uppercase cursor-pointer hover:bg-amber-400 transition-all select-none shrink-0">
                  <ImageIcon className="h-3 w-3" />
                  <span>Úp ảnh từ máy lên</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLocalImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1">
                {galleryImages.map((img, index) => {
                  const isSelected = prodImg === img.url;
                  return (
                    <div
                      key={index}
                      onClick={() => setProdImg(img.url)}
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

            <div className="flex items-center space-y-1.5 md:col-span-2 pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={prodStock}
                  onChange={(e) => setProdStock(e.target.checked)}
                  className="h-4.5 w-4.5 rounded bg-stone-900 border-stone-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-stone-950 focus:ring-2"
                />
                <span className="text-xs font-bold text-stone-300 uppercase tracking-wide">Vật tư có sẵn để đặt thi công trực tiếp (Còn hàng)</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-stone-850">
            <button
              type="button"
              onClick={handleCancelForm}
              className="px-3.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs font-semibold transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{editingId !== null ? "Lưu chỉnh sửa" : "Xác nhận thêm sản phẩm"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 flex-grow max-w-md">
          <Search className="h-4 w-4 text-stone-500 mr-2 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên vật tư, sản phẩm..."
            className="bg-transparent text-stone-100 text-xs sm:text-sm focus:outline-none w-full"
          />
        </div>

        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="px-4 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-300 text-xs sm:text-sm focus:border-amber-500 focus:outline-none transition-all"
        >
          <option value="all">Tất cả danh mục</option>
          <option value="Thạch cao">Thạch cao</option>
          <option value="Nhựa Composite">Nhựa Composite</option>
          <option value="Nhựa giả đá">Nhựa giả đá</option>
          <option value="Phào chỉ">Phào chỉ & phào tường</option>
          <option value="Dịch vụ khác">Dịch vụ khác</option>
        </select>
      </div>

      {/* Products list table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-stone-800 text-stone-400 font-bold text-[10px] uppercase tracking-wider">
              <th className="pb-3 pr-4">Sản phẩm / Vật tư</th>
              <th className="pb-3 px-4">Đơn giá tham khảo</th>
              <th className="pb-3 px-4">Loại hình</th>
              <th className="pb-3 px-4">Trạng thái</th>
              <th className="pb-3 pl-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-850">
            {filteredProducts.map((prod) => (
              <tr key={prod.id} className="hover:bg-stone-850/30 transition-colors">
                <td className="py-3.5 pr-4 flex items-center gap-3">
                  <img
                    src={prod.img}
                    alt={prod.name}
                    className="h-10 w-14 object-cover rounded bg-stone-950 border border-stone-800 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-stone-200 line-clamp-1">{prod.name}</h4>
                      {prod.videoUrl && (
                        <span className="bg-red-500/10 text-red-400 text-[8px] font-bold uppercase px-1.5 py-0.2 rounded border border-red-500/20" title={prod.videoUrl}>
                          VIDEO
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-stone-500">Mã vật tư: TGP-#{prod.id}</p>
                  </div>
                </td>
                <td className="py-3.5 px-4 font-mono font-bold text-amber-500 text-xs sm:text-sm">
                  {prod.price}
                </td>
                <td className="py-3.5 px-4 text-stone-300 font-semibold">
                  {prod.category}
                </td>
                <td className="py-3.5 px-4">
                  <button
                    onClick={() => toggleStock(prod.id)}
                    className="inline-flex items-center gap-1.5 focus:outline-none cursor-pointer"
                  >
                    {prod.stock ? (
                      <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold uppercase tracking-wider">
                        Còn hàng
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20 font-bold uppercase tracking-wider">
                        Hết hàng
                      </span>
                    )}
                  </button>
                </td>
                <td className="py-3.5 pl-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleStartEdit(prod)}
                      className="p-1.5 rounded-lg bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-stone-300 border border-stone-750 cursor-pointer transition-all"
                      title="Chỉnh sửa sản phẩm"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleStock(prod.id)}
                      className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-300 border border-stone-750 cursor-pointer transition-all"
                      title={prod.stock ? "Đổi sang Hết hàng" : "Đổi sang Còn hàng"}
                    >
                      {prod.stock ? <ToggleRight className="h-4 w-4 text-emerald-400" /> : <ToggleLeft className="h-4 w-4 text-stone-500" />}
                    </button>
                    <button
                      onClick={() => handleDelete(prod.id, prod.name)}
                      className="p-1.5 rounded-lg bg-stone-800 hover:bg-red-500/20 hover:text-red-400 text-stone-400 border border-stone-750 cursor-pointer transition-all"
                      title="Xóa sản phẩm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-stone-500 text-xs">
                  Không tìm thấy sản phẩm nào khớp với bộ lọc hoặc tìm kiếm.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

