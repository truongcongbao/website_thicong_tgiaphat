# 🖥️ Hướng Dẫn Biên Dịch & Chạy Ứng Dụng KiotX Trên Máy Tính (Windows / macOS)

Tài liệu này hướng dẫn bạn cách đóng gói mã nguồn **KiotX** hiện tại thành một ứng dụng máy tính (.EXE cho Windows và .DMG/.APP cho macOS) sử dụng nền tảng **Electron** và **Electron Builder**.

---

## 🏗️ Kiến Trúc Ứng Dụng KiotX Desktop

Ứng dụng chạy trên cơ chế **Hybrid Desktop Client**:
1. **Chế độ Cloud (Khuyên dùng):** Ứng dụng tải trực tiếp phiên bản KiotX đã phát hành trên hệ thống đám mây Cloud Run. Chế độ này giúp bạn đồng bộ dữ liệu PostgreSQL tức thì, in ấn hóa đơn nhanh chóng, không sợ mất dữ liệu và giảm dung lượng cài đặt máy tính xuống mức tối thiểu.
2. **Chế độ Local (Dự phòng):** Nếu máy chủ Cloud gặp sự cố hoặc mất mạng, bạn có thể chuyển hướng sang cổng `http://localhost:3000` chạy cục bộ trên máy cá nhân.

---

## 📥 Bước 1: Tải mã nguồn về máy tính cá nhân

1. Trên giao diện **Google AI Studio Build** của bạn.
2. Mở góc trên cùng bên phải, nhấp vào nút **Settings (Cài đặt) / Export** hoặc nhấp vào biểu tượng **Tải xuống dưới dạng ZIP (Download as ZIP)**.
3. Giải nén thư mục dự án KiotX vừa tải về vào một thư mục trên máy tính của bạn (Ví dụ: `C:\KiotX` hoặc `~/KiotX`).

---

## 💻 Bước 2: Cài đặt công cụ môi trường

Đảm bảo máy tính của bạn đã cài đặt các công cụ sau:
1. **Node.js (Phiên bản LTS khuyên dùng 18 hoặc 20+):**
   - Tải về tại: [https://nodejs.org](https://nodejs.org)
2. **Trình biên dịch dòng lệnh:**
   - Mở Terminal (trên macOS) hoặc Command Prompt / PowerShell (trên Windows).

---

## ⚙️ Bước 3: Cài đặt Thư viện & Chạy thử nghiệm

Mở cửa sổ dòng lệnh tại thư mục KiotX đã giải nén và thực hiện các lệnh sau:

### 1. Cài đặt các thư viện liên kết (Dependencies)
```bash
npm install
```

### 2. Chạy thử nghiệm ứng dụng dạng Desktop (Development Mode)
```bash
# Chạy ứng dụng web local (Cổng 3000)
npm run dev

# Mở một cửa sổ Terminal mới, chạy giao diện Desktop Electron
npm run electron:start
```
*Lúc này, một cửa sổ Desktop KiotX chuyên nghiệp sẽ hiện ra trên màn hình máy tính của bạn!*

---

## 📦 Bước 4: Đóng gói thành File cài đặt (.EXE hoặc .DMG)

Khi ứng dụng đã sẵn sàng và hoạt động mượt mà, hãy đóng gói nó thành tệp cài đặt độc lập để phân phối hoặc cài đặt trực tiếp lên các máy tính bán hàng khác:

### Đóng gói ứng dụng:
```bash
npm run electron:pack
```

### Kết quả sau khi biên dịch:
Sau khi quá trình biên dịch hoàn tất, một thư mục mới mang tên `dist-desktop` sẽ được tạo ra tại thư mục gốc:
* **Trên Windows (.EXE):** Bạn sẽ nhận được file cài đặt cài nhanh `KiotX Setup 0.0.0.exe` hoặc bản chạy ngay không cần cài đặt `KiotX Portable 0.0.0.exe` trong thư mục `dist-desktop/`.
* **Trên macOS (.DMG):** Bạn sẽ nhận được file cài đặt đĩa ảnh `KiotX-0.0.0.dmg` hỗ trợ cả chip Apple Silicon (M1/M2/M3) và chip Intel x64.

---

## 🎨 Tùy chỉnh Logo/Icon cho Ứng dụng Desktop

Để ứng dụng của bạn có biểu tượng thương hiệu (Icon) riêng trên thanh Taskbar hoặc Dock:
1. Tạo một ảnh biểu tượng có kích thước tối thiểu `512x512` pixel.
2. Chuyển đổi định dạng ảnh thành:
   - Tệp `.ico` dành cho Windows.
   - Tệp `.icns` dành cho macOS.
3. Lưu các tệp icon này vào thư mục `electron/icons/icon.ico` và `electron/icons/icon.icns`.
4. Cấu hình lại file `electron-builder.json` để chỉ định đường dẫn icon:
   ```json
   "win": {
     "icon": "electron/icons/icon.ico"
   },
   "mac": {
     "icon": "electron/icons/icon.icns"
   }
   ```

---

## 🔒 Khắc phục sự cố thường gặp (Troubleshooting)

### 1. Lỗi màn hình trắng hoặc không load được dữ liệu
* **Nguyên nhân:** Máy tính của bạn đang bị ngắt kết nối Internet hoặc tường lửa chặn ứng dụng kết nối tới máy chủ Cloud KiotX.
* **Cách xử lý:** Kiểm tra lại WiFi, hoặc nhấp vào nút **"Dùng Local (Cổng 3000)"** trên màn hình thông báo mất kết nối để chạy offline.

### 2. Lỗi bảo mật trên macOS khi mở ứng dụng ("App is damaged" hoặc "Developer cannot be verified")
* **Nguyên nhân:** Do ứng dụng tự build chưa được đăng ký chứng chỉ nhà phát triển (Code Sign) với Apple.
* **Cách xử lý:** 
  1. Mở ứng dụng **Terminal** trên macOS.
  2. Gõ lệnh sau để mở khóa ứng dụng:
     ```bash
     sudo xattr -rd com.apple.quarantine /Applications/KiotX.app
     ```
  3. Nhập mật khẩu máy Mac của bạn và nhấn Enter. Giờ đây bạn có thể mở ứng dụng bình thường!

---

Chúc bạn có những trải nghiệm bán hàng tuyệt vời và chuyên nghiệp cùng **KiotX Desktop App**! 🚀
