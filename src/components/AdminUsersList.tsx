import { useState, FormEvent } from "react";
import { Users, Search, Plus, Trash2, Mail, ShieldAlert, CheckCircle, AlertCircle, X, Check } from "lucide-react";

export default function AdminUsersList() {
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("Editor"); // "Administrator" | "Editor" | "Shop Manager"
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [users, setUsers] = useState([
    { id: 1, email: "noithattruonggiaphat@gmail.com", name: "Trương Gia Phát", provider: "system_author", role: "Owner", created: "2026-06-20" },
    { id: 2, email: "congbaotruong8@gmail.com", name: "Trương Công Bảo", provider: "google.com", role: "Administrator", created: "2026-06-25" },
    { id: 3, email: "kythuat.tgp@gmail.com", name: "Bộ Phận Kỹ Thuật TGP", provider: "google.com", role: "Editor", created: "2026-06-22" },
  ]);

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteUser = (id: number) => {
    if (id === 1 || id === 2) {
      alert("Không thể xóa tài khoản Quản trị viên tối cao!");
      return;
    }
    if (confirm("Bạn có chắc chắn muốn gỡ tư cách biên tập viên này không?")) {
      setUsers(users.filter(u => u.id !== id));
      setMsg({ text: "Đã gỡ quyền truy cập của thành viên.", type: "success" });
    }
  };

  const handleAddUser = (e: FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) {
      setMsg({ text: "Vui lòng nhập đầy đủ họ tên và email!", type: "error" });
      return;
    }

    // Check duplicate
    if (users.some(u => u.email.toLowerCase() === newEmail.toLowerCase())) {
      setMsg({ text: "Email này đã tồn tại trong hệ thống!", type: "error" });
      return;
    }

    const newUser = {
      id: Date.now(),
      email: newEmail,
      name: newName,
      provider: "google.com",
      role: newRole,
      created: new Date().toISOString().split("T")[0]
    };

    setUsers([...users, newUser]);
    setNewName("");
    setNewEmail("");
    setNewRole("Editor");
    setIsAdding(false);
    setMsg({ text: `Đã phân quyền thành công tài khoản mới với vai trò: ${newRole}`, type: "success" });
  };

  return (
    <div className="p-5 sm:p-6 bg-stone-900 border border-stone-850 rounded-2xl shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-stone-100 uppercase tracking-wider flex items-center gap-2">
            <Users className="h-4.5 w-4.5 text-amber-500" />
            <span>Quản Lý Thành Viên ({users.length})</span>
          </h3>
          <p className="text-xs text-stone-400">Danh sách quản trị viên, biên tập viên, quản lý cửa hàng có quyền truy cập hệ thống.</p>
        </div>
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setMsg(null);
          }}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 cursor-pointer transition-all self-start sm:self-auto"
        >
          {isAdding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span>{isAdding ? "Hủy bỏ" : "Cấp quyền thành viên"}</span>
        </button>
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

      {/* Creation form */}
      {isAdding && (
        <form onSubmit={handleAddUser} className="p-4 bg-stone-950 border border-stone-800 rounded-xl space-y-4 animate-fade-in">
          <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider">Cấp Tài Khoản Mới & Phân Quyền</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">Họ và Tên</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn A"
                required
                className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-100 text-xs focus:border-amber-500 focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">Địa chỉ Email</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="example@gmail.com"
                required
                className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-100 text-xs focus:border-amber-500 focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">Vai Trò Hệ Thống</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-300 text-xs focus:border-amber-500 focus:outline-none transition-all"
              >
                <option value="Editor">Biên tập viên (Editor)</option>
                <option value="Shop Manager">Quản lý cửa hàng (Shop Manager)</option>
                <option value="Administrator">Admin tối cao (Administrator)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2.5">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Xác nhận phân quyền</span>
            </button>
          </div>
        </form>
      )}

      {/* Control panel & search */}
      <div className="flex items-center bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 max-w-md">
        <Search className="h-4 w-4 text-stone-500 mr-2 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm theo email, họ tên..."
          className="bg-transparent text-stone-100 text-xs sm:text-sm focus:outline-none w-full"
        />
      </div>

      {/* Users table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-stone-800 text-stone-400 font-bold text-[10px] uppercase tracking-wider">
              <th className="pb-3 pr-4">Họ và Tên / Email</th>
              <th className="pb-3 px-4">Cách thức Đăng ký</th>
              <th className="pb-3 px-4">Phân quyền</th>
              <th className="pb-3 px-4">Ngày tham gia</th>
              <th className="pb-3 pl-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-850">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-stone-850/30 transition-colors">
                <td className="py-3.5 pr-4">
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-stone-200">{user.name}</h4>
                    <p className="text-[10px] text-stone-500 font-mono flex items-center gap-1">
                      <Mail className="h-3 w-3 shrink-0" />
                      {user.email}
                    </p>
                  </div>
                </td>
                <td className="py-3.5 px-4 font-semibold text-stone-400 font-mono">
                  {user.provider}
                </td>
                <td className="py-3.5 px-4">
                  <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                    user.role === "Owner"
                      ? "bg-red-500/10 text-red-400 border-red-500/20"
                      : user.role === "Administrator"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-stone-400 font-mono">
                  {new Date(user.created).toLocaleDateString("vi-VN")}
                </td>
                <td className="py-3.5 pl-4 text-right">
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-red-500/10 text-stone-400 hover:text-red-400 border border-stone-750 cursor-pointer transition-all"
                    title="Gỡ thành viên"
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
