import { useState } from "react";
import { PROJECTS } from "../data";
import { Project } from "../types";
import { Search, MapPin, Minimize, Coins, ExternalLink, Calendar, HelpCircle, X } from "lucide-react";

export default function ProjectShowcase() {
  const [filter, setFilter] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const categories = [
    { id: "all", label: "Tất Cả Dự Án" },
    { id: "tran-thach-cao", label: "Trần Thạch Cao" },
    { id: "vach-nhua-composite", label: "Ốp Vách Gỗ Nhựa" },
    { id: "vach-pvc-vanda", label: "Vách PVC Giả Đá" },
    { id: "tron-goi", label: "Thi Công Trọn Gói" },
  ];

  const filteredProjects = filter === "all"
    ? PROJECTS
    : PROJECTS.filter((p) => p.category === filter || p.style.toLowerCase().includes(filter));

  return (
    <section id="projects" className="py-20 bg-stone-900 border-t border-stone-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center space-y-4 mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full">
            Thư Viện Thực Tế
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif text-stone-100">
            Dự Án Thiết Kế & Thi Công Hoàn Thiện
          </h2>
          <p className="text-stone-400 max-w-xl mx-auto text-sm sm:text-base">
            Hình ảnh thực tế từ các công trình trọn gói chìa khóa trao tay được đội ngũ kiến trúc sư và thợ lành nghề Trương Gia Phát hoàn thiện tỉ mỉ.
          </p>
        </div>

        {/* Filter Scrollbar (Mobile Friendly) */}
        <div className="flex items-center justify-start md:justify-center overflow-x-auto pb-6 scrollbar-hide gap-3 -mx-4 px-4 sm:mx-0 sm:px-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={`px-5 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
                filter === cat.id
                  ? "bg-amber-500 border-amber-500 text-stone-950 shadow-lg shadow-amber-500/10"
                  : "bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => setSelectedProject(project)}
              className="group rounded-2xl bg-stone-950 border border-stone-800/80 overflow-hidden shadow-xl hover:border-stone-700 hover:shadow-2xl transition-all duration-300 flex flex-col h-full cursor-pointer"
            >
              {/* Image Frame */}
              <div className="h-64 w-full overflow-hidden relative">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-750"
                  referrerPolicy="no-referrer"
                />
                {/* Style badge */}
                <span className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-wider bg-stone-950/80 backdrop-blur-md border border-stone-800 text-amber-500 px-3 py-1 rounded-full shadow">
                  {project.style}
                </span>
              </div>

              {/* Text Body */}
              <div className="p-5 flex flex-col justify-between grow">
                <div className="space-y-2">
                  <h3 className="text-stone-100 font-serif font-semibold text-lg leading-snug group-hover:text-amber-500 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-stone-400 text-xs line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>
                </div>

                {/* Spec footer */}
                <div className="flex justify-between items-center pt-4 border-t border-stone-900 mt-4 text-[11px] text-stone-400">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-amber-500" />
                    <span>{project.location.split(",")[0]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{project.area} m²</span>
                    <span className="h-3 w-[1px] bg-stone-800" />
                    <span className="font-mono font-bold text-amber-500">{project.budget}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Detail Overlay */}
        {selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-3xl rounded-2xl bg-stone-900 border border-stone-800 overflow-hidden shadow-2xl">
              {/* Close Button */}
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-stone-950/60 text-stone-300 hover:text-stone-100 border border-stone-800 hover:bg-stone-900 cursor-pointer"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="grid md:grid-cols-2">
                {/* Left: Image */}
                <div className="h-64 md:h-full min-h-[300px]">
                  <img
                    src={selectedProject.image}
                    alt={selectedProject.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Right: Info */}
                <div className="p-6 sm:p-8 space-y-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500">
                        Phong Cách: {selectedProject.style}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-100">
                        {selectedProject.title}
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-y border-stone-800 py-3 text-xs text-stone-300">
                      <div>
                        <span className="block text-stone-500 text-[10px] uppercase">Vị Trí</span>
                        <span className="font-semibold">{selectedProject.location}</span>
                      </div>
                      <div>
                        <span className="block text-stone-500 text-[10px] uppercase">Diện Tích</span>
                        <span className="font-semibold font-mono">{selectedProject.area} m²</span>
                      </div>
                      <div>
                        <span className="block text-stone-500 text-[10px] uppercase">Ngân Sách</span>
                        <span className="font-semibold font-mono text-amber-500">{selectedProject.budget}</span>
                      </div>
                      <div>
                        <span className="block text-stone-500 text-[10px] uppercase">Hoàn Thiện</span>
                        <span className="font-semibold">Bàn giao trọn gói</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="block text-stone-400 text-xs font-semibold">Chi Tiết Công Trình:</span>
                      <p className="text-stone-300 text-xs leading-relaxed">
                        {selectedProject.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <a
                      href="https://zalo.me/0901234567"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-center text-xs tracking-wider uppercase inline-flex items-center justify-center gap-2 transition-all shadow-md"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Nhận Hồ Sơ Bản Vẽ & Báo Giá Qua Zalo</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
