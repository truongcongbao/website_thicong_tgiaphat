import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini safely
  let ai: GoogleGenAI | null = null;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      console.log("Gemini SDK initialized successfully server-side.");
    } catch (e) {
      console.error("Error initializing Gemini SDK:", e);
    }
  } else {
    console.warn("GEMINI_API_KEY not found. Server is running in fallback chat mode.");
  }

  // API Route for AI Chatbot
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      if (!ai) {
        // High quality Vietnamese simulated consultant fallback in case API key is not ready
        const fallbacks = [
          "Xin chào! Tôi là kiến trúc sư Minh Khôi đến từ Công ty TNHH Thiết Kế & Thi Công Nội Thất Trương Gia Phát (MST: 3703472033). Rất vui được trò chuyện cùng bạn. Bạn đang cần thi công trần thạch cao hay vách nhựa Composite/PVC vân đá cẩm thạch?",
          "Để tối ưu chi phí và nâng tầm sang trọng, combo trần thạch cao chống ẩm giật cấp kết hợp hệ thống đèn LED âm rãnh hắt sáng đang là xu hướng bán chạy nhất tại Trương Gia Phát!",
          "Trương Gia Phát sở hữu nguồn vật liệu nhựa giả gỗ Composite sọc lam sóng và vách PVC vân đá cẩm thạch chất lượng cao. Thi công bền bỉ chống ẩm mốc 100%, bảo hành 3 năm và hỗ trợ chu đáo.",
          "Bạn có thể dùng ngay công cụ 'Dự toán chi phí thông minh' hoặc tham khảo mục 'Gợi ý sở thích vật liệu' trên website này để khám phá phương án tối ưu nhất nhé!"
        ];
        const randomAnswer = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        return res.json({ text: randomAnswer + " (Phản hồi từ KTS Trương Gia Phát - Hãy cấu hình GEMINI_API_KEY để bật AI thông minh)" });
      }

      // Format messages for the new @google/genai format
      const contents = [];
      if (Array.isArray(history)) {
        for (const item of history) {
          contents.push({
            role: item.role === "user" ? "user" : "model",
            parts: [{ text: item.text }]
          });
        }
      }
      contents.push({
        role: "user",
        parts: [{ text: message }]
      });

      const systemInstruction = `Bạn là KTS Minh Khôi - Chuyên gia tư vấn và thi công trần thạch cao, nhựa giả gỗ trần vách tại CÔNG TY TNHH THIẾT KẾ & THI CÔNG NỘI THẤT TRƯƠNG GIA PHÁT (MST: 3703472033).
Hãy luôn trả lời bằng tiếng Việt lịch sự, thân thiện, chuyên nghiệp, truyền tải thông tin chính xác về doanh nghiệp.

Thông tin chính thức của công ty Trương Gia Phát:
- Tên công ty: CÔNG TY TNHH THIẾT KẾ & THI CÔNG NỘI THẤT TRƯƠNG GIA PHÁT
- Mã số thuế: 3703472033
- Trụ sở chính: số 11/DC1 Đường Bình Chuẩn 69, Tổ 35, Khu phố Bình Phước B, Phường An Phú, Thành phố Hồ Chí Minh, Việt Nam
- Tài khoản ngân hàng (STK): 7919399999 - MB BANK (Chủ tài khoản: CÔNG TY TNHH THIẾT KẾ & THI CÔNG NỘI THẤT TRƯƠNG GIA PHÁT)
- Email: noithattruonggiaphat@gmail.com
- Hotline & Zalo: 090.123.4567

Nhiệm vụ của bạn:
1. Giải đáp thắc mắc về thiết kế thi công trần thạch cao (trần giật cấp LED, trần phẳng, trần thả) và ốp vách trần nhựa giả gỗ (lam sóng Composite, tấm phẳng Nano vân gỗ sồi/óc chó, PVC giả đá cẩm thạch luxury), chống thấm ẩm mốc, cách âm, khung xương thạch cao Vĩnh Tường chịu lực thăng bằng tốt.
2. Nêu bật ưu điểm của Trương Gia Phát: Cam kết dùng khung xương Vĩnh Tường chính hãng (ALPHA, BASI) thăng bằng cực chuẩn, bảo hành 3 năm trần vách chống nứt mốc bong tróc, miễn phí 100% thiết kế bản vẽ phối cảnh 3D khi thi công thực tế trọn gói.
3. Khi khách muốn báo giá, hãy khuyến khích họ nhập thông số diện tích m2 vào 'Bảng dự toán chi phí tự động' trên website của chúng tôi để bóc tách sơ bộ trong tích tắc, hoặc gọi điện/nhắn Zalo trực tiếp qua hotline 090.123.4567 để nhận hồ sơ báo giá bóc tách hoàn toàn miễn phí.
4. Gợi ý khách trải nghiệm 'Trắc nghiệm phong cách' và 'Gợi ý sở thích vật liệu' trên website để tìm ra gu trần vách ưng ý nhất.
QUAN TRỌNG: Hãy trả lời cô đọng, súc tích (khoảng 3 đến tối đa 5 câu), chia dòng rõ ràng và dễ đọc trên màn hình điện thoại di động! Tránh viết các đoạn văn dài dằng dặc không xuống dòng.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      const replyText = response.text || "Cảm ơn bạn đã liên hệ. Tôi đang kiểm tra lại thông tin bản vẽ. Bạn vui lòng nhắn trực tiếp qua nút Zalo hoặc gọi SĐT 090.123.4567 để tôi hỗ trợ tức thì nhé!";
      return res.json({ text: replyText });

    } catch (err) {
      console.error("Gemini server error:", err);
      return res.json({ text: "Chào bạn! Tôi là KTS Minh Khôi. Hệ thống AI đang bận một chút, bạn vui lòng nhắn tin qua Zalo (090.123.4567) hoặc bấm nút Gọi điện để tôi trực tiếp tư vấn và gửi các mẫu thiết kế 3D mới nhất nhé!" });
    }
  });

  // Serve static files in development & production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
