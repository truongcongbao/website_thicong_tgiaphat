import { useState, useEffect } from "react";
import { BookOpen, Calendar, ArrowRight, X, User, Tag, Clock } from "lucide-react";

export interface Post {
  id: number;
  title: string;
  excerpt: string | null;
  content: string;
  imageUrl: string | null;
  videoUrl?: string | null;
  category: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function BlogSection() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const categories = ["Tất cả", "Tin tức", "Mẹo thi công", "Vật liệu", "Dự án"];

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/posts");
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error("Lỗi khi tải bài viết từ database:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = activeCategory === "Tất cả" 
    ? posts 
    : posts.filter(p => p.category === activeCategory);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `Ngày ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <section id="blog" className="py-20 bg-stone-900/40 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.03),rgba(255,255,255,0))]" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full">
            Kiến Thức & Kinh Nghiệm
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif text-stone-100">
            Tin Tức & Cẩm Nang Trần Vách
          </h2>
          <p className="text-stone-400 text-sm sm:text-base max-w-2xl mx-auto">
            Cập nhật các xu hướng thiết kế mới nhất, hướng dẫn chọn vật liệu thạch cao Vĩnh Tường và nhựa giả gỗ Composite từ chuyên gia Trương Gia Phát.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer border ${
                activeCategory === cat
                  ? "bg-amber-500 text-stone-950 border-amber-500 shadow-md shadow-amber-500/10"
                  : "bg-stone-900/60 text-stone-300 border-stone-800 hover:border-stone-700 hover:text-stone-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="h-8 w-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            <span className="text-stone-400 text-xs font-mono">Đang tải dữ liệu từ Cloud SQL...</span>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16 bg-stone-950/40 rounded-2xl border border-stone-800/80 max-w-md mx-auto">
            <BookOpen className="h-10 w-10 text-stone-500 mx-auto mb-3" />
            <h3 className="text-stone-300 font-semibold text-sm">Chưa có bài viết</h3>
            <p className="text-stone-500 text-xs mt-1">
              Hiện tại chưa có bài viết nào thuộc danh mục này. Hãy đăng nhập mục quản trị để viết bài mới!
            </p>
          </div>
        ) : (
          /* Posts Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <article 
                key={post.id}
                className="group flex flex-col bg-stone-950/60 rounded-2xl border border-stone-850 overflow-hidden hover:border-amber-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/[0.02]"
              >
                {/* Image */}
                <div className="aspect-[16/10] overflow-hidden relative bg-stone-900">
                  <img 
                    src={post.imageUrl || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"} 
                    alt={post.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-stone-950/80 backdrop-blur-md border border-stone-800 text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                    {post.category}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-grow space-y-3">
                  <div className="flex items-center gap-3 text-[11px] text-stone-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-amber-500/70" />
                      {formatDate(post.createdAt)}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-stone-700" />
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3 text-amber-500/70" />
                      KTS Trương Gia Phát
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-stone-100 group-hover:text-amber-500 transition-colors line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-stone-400 text-xs sm:text-sm line-clamp-3 leading-relaxed flex-grow">
                    {post.excerpt || "Bấm vào để đọc chi tiết bài viết tư vấn hữu ích từ chuyên gia kỹ thuật thi công Trương Gia Phát."}
                  </p>

                  <div className="pt-3 border-t border-stone-900 flex items-center justify-between">
                    <button 
                      onClick={() => setSelectedPost(post)}
                      className="text-xs font-bold text-amber-500 group-hover:text-amber-400 transition-colors inline-flex items-center gap-1.5 hover:underline cursor-pointer"
                    >
                      <span>Xem Chi Tiết</span>
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Article Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div 
            className="bg-stone-900 border border-stone-800/80 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative my-8 animate-scale-up max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header/cover */}
            <div className="relative aspect-[21/9] bg-stone-950 shrink-0">
              <img 
                src={selectedPost.imageUrl || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"} 
                alt={selectedPost.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900 to-transparent" />
              <button 
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-stone-950/80 border border-stone-800 text-stone-300 hover:text-amber-500 hover:border-amber-500 transition-all cursor-pointer z-10"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-4 left-6 right-6">
                <span className="px-2.5 py-0.5 rounded bg-amber-500 text-stone-950 text-[9px] font-bold uppercase tracking-wider">
                  {selectedPost.category}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-stone-100 mt-2 line-clamp-2">
                  {selectedPost.title}
                </h2>
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-stone-300 text-sm sm:text-base leading-relaxed flex-grow">
              {/* Meta stats */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 border-b border-stone-800 pb-4">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-amber-500/70" />
                  {formatDate(selectedPost.createdAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4 text-amber-500/70" />
                  Người đăng: Trương Gia Phát
                </span>
                <span className="flex items-center gap-1.5">
                  <Tag className="h-4 w-4 text-amber-500/70" />
                  Danh mục: {selectedPost.category}
                </span>
              </div>

              {/* Excerpt */}
              {selectedPost.excerpt && (
                <p className="text-stone-200 font-medium italic border-l-2 border-amber-500 pl-4 text-xs sm:text-sm bg-stone-950/30 py-3 pr-3 rounded-r-lg">
                  {selectedPost.excerpt}
                </p>
              )}

              {/* Optional Walkthrough Video Embed */}
              {selectedPost.videoUrl && (
                <div className="space-y-2 bg-stone-950 p-4 rounded-xl border border-stone-800">
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    Video công trình thực tế đi kèm:
                  </span>
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-stone-800">
                    <iframe
                      src={selectedPost.videoUrl}
                      title={selectedPost.title}
                      className="absolute inset-0 w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* Styled content renderer */}
              <div className="space-y-4 text-stone-300 leading-relaxed whitespace-pre-wrap font-sans text-xs sm:text-sm">
                {selectedPost.content.split("\n\n").map((para, idx) => {
                  if (para.startsWith("# ")) {
                    return <h1 key={idx} className="text-lg sm:text-xl font-bold text-stone-100 mt-6 mb-2 border-b border-stone-800 pb-2">{para.replace("# ", "")}</h1>;
                  }
                  if (para.startsWith("## ")) {
                    return <h2 key={idx} className="text-base sm:text-lg font-bold text-stone-100 mt-5 mb-2">{para.replace("## ", "")}</h2>;
                  }
                  if (para.startsWith("### ")) {
                    return <h3 key={idx} className="text-sm sm:text-base font-bold text-stone-100 mt-4 mb-2">{para.replace("### ", "")}</h3>;
                  }
                  if (para.startsWith("- ") || para.startsWith("* ")) {
                    return (
                      <ul key={idx} className="list-disc pl-5 space-y-1.5 text-stone-300 my-2">
                        {para.split("\n").map((item, iIdx) => (
                          <li key={iIdx}>{item.replace(/^[-*]\s+/, "")}</li>
                        ))}
                      </ul>
                    );
                  }
                  if (para.match(/^\d+\.\s+/)) {
                    return (
                      <ol key={idx} className="list-decimal pl-5 space-y-1.5 text-stone-300 my-2">
                        {para.split("\n").map((item, iIdx) => (
                          <li key={iIdx}>{item.replace(/^\d+\.\s+/, "")}</li>
                        ))}
                      </ol>
                    );
                  }
                  return <p key={idx}>{para}</p>;
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-950 border-t border-stone-850 flex justify-between items-center shrink-0">
              <span className="text-[10px] text-stone-500 font-mono">Bảo lưu bản quyền © Trương Gia Phát</span>
              <button 
                onClick={() => setSelectedPost(null)}
                className="px-4 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold cursor-pointer"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
