import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import nodemailer from "nodemailer";
import { db } from "./src/db/index.ts";
import {
  posts,
  users,
  trials,
  products as productsTable,
  categories as categoriesTable,
  customers as customersTable,
  suppliers as suppliersTable,
  invoices as invoicesTable,
  staffTable,
  settingsTable,
  auditsTable,
  purchaseOrders as purchaseOrdersTable,
  cashbookTable,
  projectsTable,
  cashShiftsTable,
  systemLogsTable
} from "./src/db/schema.ts";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { getOrCreateUser } from "./src/db/users.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Ensure all trials have a password (update null or empty passwords to '123456' on startup)
  try {
    await db.execute(sql`UPDATE trials SET password = '123456' WHERE password IS NULL OR password = '' OR password = '(Trống)'`);
    console.log("[Server Startup] Synchronized empty SaaS trial passwords to default '123456' successfully.");
  } catch (err: any) {
    console.warn("[Server Startup Warning] Could not check or update empty SaaS trial passwords:", err);
  }

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
      const { message, history, storeContext, userRole, userName } = req.body;
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

      // Adaptive System Instructions based on User Role (Admin/Staff vs. Guest)
      let systemInstruction = "";
      const isAdmin = userRole === "OWNER" || userRole === "MANAGER" || userRole === "CASHIER";

      if (isAdmin) {
        systemInstruction = `Bạn là KiotX AI Co-Pilot — Trợ lý phân tích kinh doanh, dự báo doanh thu và quản trị tối ưu hóa cửa hàng thông minh dành riêng cho nhà quản trị ${userName || ""}.
Hãy luôn xưng hô lịch sự, thân thiện, khách quan, mang tính hỗ trợ cao và trả lời bằng tiếng Việt.
Cửa hàng bạn đang hỗ trợ: CÔNG TY TNHH THIẾT KẾ & THI CÔNG NỘI THẤT TRƯƠNG GIA PHÁT (MST: 3703472033).

Dưới đây là DỮ LIỆU HOẠT ĐỘNG THỰC TẾ trực tiếp từ cơ sở dữ liệu của cửa hàng ở phiên làm việc này. Hãy sử dụng dữ liệu thực tế này để phân tích và trả lời chính xác, trung thực các câu hỏi của người quản lý (về sản phẩm bán chạy, tồn kho, doanh thu hóa đơn, các khoản chi thu trong sổ quỹ, hay tiến độ các công trình/dự án thiết kế & thi công):
${storeContext || "(Chưa đồng bộ được dữ liệu thực tế cửa hàng)"}

Nhiệm vụ của bạn:
1. Khi người quản trị hỏi về các số liệu như: Sản phẩm bán chạy nhất, tồn kho, doanh thu hóa đơn, quỹ thu chi, danh sách dự án thi công... hãy đọc kỹ thông tin ở phần dữ liệu thực tế phía trên để báo cáo và phân tích chính xác cho họ. Tuyệt đối không tự bịa ra thông tin giả định.
2. Đưa ra các phân tích, cảnh báo và gợi ý kinh doanh thực tế (ví dụ: chỉ ra các sản phẩm sắp hết kho cần nhập thêm gấp, sản phẩm nào đang đóng góp doanh thu lớn, cảnh báo chi phí vận hành sổ quỹ nếu vượt mức an toàn, bám sát các dự án thi công còn chậm tiến độ hoặc chuẩn bị hoàn thành).
3. Đóng vai trò là một Co-Pilot phân tích quản trị cửa hàng xuất sắc, đưa ra giải pháp giúp cửa hàng tối ưu hóa doanh số và nâng cao biên lợi nhuận.
4. QUAN TRỌNG: Câu trả lời cần ngắn gọn, cô đọng, súc tích (khoảng 3 đến tối đa 5 câu), chia dòng rõ ràng và dễ đọc trên màn hình điện thoại di động! Dùng gạch đầu dòng (bullet points) khi báo cáo số liệu để cực kỳ trực quan.`;
      } else {
        systemInstruction = `Bạn là KTS Minh Khôi - Chuyên gia tư vấn và thi công trần thạch cao, nhựa giả gỗ trần vách tại CÔNG TY TNHH THIẾT KẾ & THI CÔNG NỘI THẤT TRƯƠNG GIA PHÁT (MST: 3703472033).
Hãy luôn trả lời bằng tiếng Việt lịch sự, thân thiện, chuyên nghiệp, truyền tải thông tin chính xác về doanh nghiệp.

Thông tin chính thức của công ty Trương Gia Phát:
- Tên công ty: CÔNG TY TNHH THIẾT KẾ & THI CÔNG NỘI THẤT TRƯƠNG GIA PHÁT
- Mã số thuế: 3703472033
- Trụ sở chính: số 11/DC1 Đường Bình Chuẩn 69, Tổ 35, Khu phố Bình Phước B, Phường An Phú, Thành phố Hồ Chí Minh, Việt Nam
- Tài khoản ngân hàng (STK): 7919399999 - MB BANK (Chủ tài khoản: CÔNG TY TNHH THIẾT KẾ & THI CÔNG NỘI THẤT TRƯƠNG GIA PHÁT)
- Email: noithattruonggiaphat@gmail.com
- Hotline & Zalo: 090.123.4567

Dữ liệu bổ sung trực tiếp từ cửa hàng:
${storeContext || ""}

Nhiệm vụ của bạn:
1. Giải đáp thắc mắc về thiết kế thi công trần thạch cao (trần giật cấp LED, trần phẳng, trần thả) và ốp vách trần nhựa giả gỗ (lam sóng Composite, tấm phẳng Nano vân gỗ sồi/óc chó, PVC giả đá cẩm thạch luxury), chống thấm ẩm mốc, cách âm, khung xương thạch cao Vĩnh Tường chịu lực thăng bằng tốt.
2. Nêu bật ưu điểm của Trương Gia Phát: Cam kết dùng khung xương Vĩnh Tường chính hãng (ALPHA, BASI) thăng bằng cực chuẩn, bảo hành 3 năm trần vách chống nứt mốc bong tróc, miễn phí 100% thiết kế bản vẽ phối cảnh 3D khi thi công thực tế trọn gói.
3. Khi khách muốn báo giá, hãy khuyến khích họ nhập thông số diện tích m2 vào 'Bảng dự toán chi phí tự động' trên website của chúng tôi để bóc tách sơ bộ trong tích tắc, hoặc gọi điện/nhắn Zalo trực tiếp qua hotline 090.123.4567 để nhận hồ sơ báo giá bóc tách hoàn toàn miễn phí.
4. Gợi ý khách trải nghiệm 'Trắc nghiệm phong cách' và 'Gợi ý sở thích vật liệu' trên website để tìm ra gu trần vách ưng ý nhất.
QUAN TRỌNG: Hãy trả lời cô đọng, súc tích (khoảng 3 đến tối đa 5 câu), chia dòng rõ ràng và dễ đọc trên màn hình điện thoại di động! Tránh viết các đoạn văn dài dằng dặc không xuống dòng.`;
      }

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

  // --- DATABASE-BACKED API ROUTES FOR TRUONG GIA PHAT POSTS ---

  // Auth User Sync on Login
  app.post("/api/auth/sync", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userUid = req.user?.uid;
      const userEmail = req.user?.email || "";
      if (!userUid) {
        return res.status(400).json({ error: "Missing user credentials" });
      }
      const dbUser = await getOrCreateUser(userUid, userEmail);
      return res.json({ success: true, user: dbUser });
    } catch (error: any) {
      console.error("Auth sync error:", error);
      return res.status(500).json({ error: error.message });
    }
  });

  // Fetch all published posts (Publicly available)
  app.get("/api/posts", async (req, res) => {
    try {
      const allPublished = await db.select()
        .from(posts)
        .where(eq(posts.isPublished, true))
        .orderBy(desc(posts.createdAt));
      return res.json(allPublished);
    } catch (error: any) {
      console.error("Fetch posts error:", error);
      return res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  // Fetch all posts (authenticated dashboard view)
  app.get("/api/posts/all", requireAuth, async (req: AuthRequest, res) => {
    try {
      const allPosts = await db.select()
        .from(posts)
        .orderBy(desc(posts.createdAt));
      return res.json(allPosts);
    } catch (error: any) {
      console.error("Fetch all posts error:", error);
      return res.status(500).json({ error: "Failed to fetch all posts" });
    }
  });

  // Create a new post (Admin only)
  app.post("/api/posts", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userUid = req.user?.uid;
      if (!userUid) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const dbUserResult = await db.select().from(users).where(eq(users.uid, userUid));
      if (dbUserResult.length === 0) {
        return res.status(404).json({ error: "User profile not found. Please sync account first." });
      }
      const dbUser = dbUserResult[0];

      const { title, content, excerpt, imageUrl, videoUrl, category, isPublished } = req.body;
      if (!title || !content) {
        return res.status(400).json({ error: "Tiêu đề và nội dung là bắt buộc" });
      }

      const newPost = await db.insert(posts)
        .values({
          title,
          content,
          excerpt: excerpt || "",
          imageUrl: imageUrl || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
          videoUrl: videoUrl || "",
          category: category || "Tin tức",
          authorId: dbUser.id,
          isPublished: isPublished !== undefined ? isPublished : true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return res.json(newPost[0]);
    } catch (error: any) {
      console.error("Create post error:", error);
      return res.status(500).json({ error: error.message || "Failed to create post" });
    }
  });

  // Update a post (Admin only)
  app.put("/api/posts/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userUid = req.user?.uid;
      if (!userUid) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ error: "Invalid post ID" });
      }

      const { title, content, excerpt, imageUrl, videoUrl, category, isPublished } = req.body;
      if (!title || !content) {
        return res.status(400).json({ error: "Tiêu đề và nội dung là bắt buộc" });
      }

      const updated = await db.update(posts)
        .set({
          title,
          content,
          excerpt: excerpt || "",
          imageUrl: imageUrl || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
          videoUrl: videoUrl || "",
          category: category || "Tin tức",
          isPublished: isPublished !== undefined ? isPublished : true,
          updatedAt: new Date(),
        })
        .where(eq(posts.id, postId))
        .returning();

      if (updated.length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }

      return res.json(updated[0]);
    } catch (error: any) {
      console.error("Update post error:", error);
      return res.status(500).json({ error: error.message || "Failed to update post" });
    }
  });

  // Delete a post (Admin only)
  app.delete("/api/posts/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userUid = req.user?.uid;
      if (!userUid) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ error: "Invalid post ID" });
      }

      const deleted = await db.delete(posts)
        .where(eq(posts.id, postId))
        .returning();

      if (deleted.length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }

      return res.json({ success: true, deleted: deleted[0] });
    } catch (error: any) {
      console.error("Delete post error:", error);
      return res.status(500).json({ error: error.message || "Failed to delete post" });
    }
  });

  // --- KIOTX POSTGRESQL MULTI-TENANT BACKEND SYNC ENDPOINTS ---

  // 1. Fetch all SaaS trials
  app.get("/api/trials", async (req, res) => {
    try {
      const allTrials = await db.select().from(trials);
      return res.json(allTrials);
    } catch (error: any) {
      console.error("Fetch trials error:", error);
      return res.status(500).json({ error: "Failed to fetch SaaS trials" });
    }
  });

  // 2. Create or update a SaaS trial registration
  app.post("/api/trials", async (req, res) => {
    try {
      const trialData = req.body;
      if (!trialData.id || !trialData.shopName) {
        return res.status(400).json({ error: "Thiếu ID dùng thử hoặc tên cửa hàng" });
      }
      const newTrial = await db.insert(trials)
        .values({
          id: trialData.id,
          shopName: trialData.shopName,
          ownerName: trialData.ownerName || "",
          phone: trialData.phone || "",
          email: trialData.email || "",
          password: trialData.password || "",
          address: trialData.address || "",
          notes: trialData.notes || "",
          createdAt: trialData.createdAt || new Date().toISOString(),
          expireDate: trialData.expireDate || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
          status: trialData.status || "TRIAL_ACTIVE",
        })
        .onConflictDoUpdate({
          target: trials.id,
          set: {
            shopName: trialData.shopName,
            ownerName: trialData.ownerName || "",
            phone: trialData.phone || "",
            email: trialData.email || "",
            password: trialData.password || "",
            address: trialData.address || "",
            notes: trialData.notes || "",
            expireDate: trialData.expireDate,
            status: trialData.status || "TRIAL_ACTIVE",
          }
        })
        .returning();
      return res.json(newTrial[0]);
    } catch (error: any) {
      console.error("Create trial error:", error);
      return res.status(500).json({ error: error.message || "Failed to create SaaS trial" });
    }
  });

  // 2c. Force Server-side Delete SaaS trial registration (Super Admin only)
  app.delete("/api/trials/force-delete/:id", async (req, res) => {
    try {
      const id = req.params.id;
      // Extract admin email from multiple sources for maximum compatibility
      const adminEmail = (req.query.adminEmail as string) || (req.headers["x-admin-email"] as string) || (req.body && req.body.adminEmail);

      if (!adminEmail || adminEmail.toLowerCase() !== "congbaotruong8@gmail.com") {
        console.warn(`[Force Delete Denied] Unauthorized access attempt by ${adminEmail || "Anonymous"} to delete trial ID: ${id}`);
        return res.status(403).json({ error: "Hành động bị từ chối: Chỉ Super Admin (congbaotruong8@gmail.com) mới có quyền xóa cưỡng bức!" });
      }

      console.log(`[Force Delete Server] Bắt đầu xóa cưỡng bức triệt để Trial ID: ${id} từ admin: ${adminEmail}`);

      // List of all tenant tables for raw SQL execution
      const tablesRaw = [
        "products", "categories", "customers", "suppliers", "invoices", 
        "staff", "settings", "audits", "purchase_orders", "cashbook", 
        "projects", "cash_shifts", "system_logs"
      ];

      // Layer 1: Raw SQL hard deletions
      for (const tName of tablesRaw) {
        try {
          // Hard parameterized raw SQL delete
          await db.execute(sql`DELETE FROM ${sql.raw(tName)} WHERE trial_id = ${id}`);
          console.log(`[Force Delete Server] [Layer 1 SQL] Đã xóa cứng dữ liệu từ bảng: ${tName}`);
        } catch (tableErr: any) {
          console.warn(`[Force Delete Server Warning] Không thể xóa SQL bảng ${tName} cho trial ${id}:`, tableErr.message || tableErr);
        }
      }

      // Layer 2: Drizzle ORM cascades (redundant double-lock safety)
      const tablesToDelete = [
        { name: "products", action: () => db.delete(productsTable).where(eq(productsTable.trialId, id)) },
        { name: "categories", action: () => db.delete(categoriesTable).where(eq(categoriesTable.trialId, id)) },
        { name: "customers", action: () => db.delete(customersTable).where(eq(customersTable.trialId, id)) },
        { name: "suppliers", action: () => db.delete(suppliersTable).where(eq(suppliersTable.trialId, id)) },
        { name: "invoices", action: () => db.delete(invoicesTable).where(eq(invoicesTable.trialId, id)) },
        { name: "staff", action: () => db.delete(staffTable).where(eq(staffTable.trialId, id)) },
        { name: "settings", action: () => db.delete(settingsTable).where(eq(settingsTable.trialId, id)) },
        { name: "audits", action: () => db.delete(auditsTable).where(eq(auditsTable.trialId, id)) },
        { name: "purchase_orders", action: () => db.delete(purchaseOrdersTable).where(eq(purchaseOrdersTable.trialId, id)) },
        { name: "cashbook", action: () => db.delete(cashbookTable).where(eq(cashbookTable.trialId, id)) },
        { name: "projects", action: () => db.delete(projectsTable).where(eq(projectsTable.trialId, id)) },
        { name: "cash_shifts", action: () => db.delete(cashShiftsTable).where(eq(cashShiftsTable.trialId, id)) },
        { name: "system_logs", action: () => db.delete(systemLogsTable).where(eq(systemLogsTable.trialId, id)) }
      ];

      for (const table of tablesToDelete) {
        try {
          await table.action();
          console.log(`[Force Delete Server] [Layer 2 ORM] Đã xóa dữ liệu từ bảng: ${table.name}`);
        } catch (tableErr: any) {
          console.warn(`[Force Delete Server Warning] Không thể xóa ORM bảng ${table.name} cho trial ${id}:`, tableErr.message || tableErr);
        }
      }

      // Parent Deletion: SQL + ORM
      try {
        await db.execute(sql`DELETE FROM trials WHERE id = ${id}`);
        console.log(`[Force Delete Server] [Layer 1 SQL] Đã xóa cứng bản ghi cha trong trials: ${id}`);
      } catch (trialErr: any) {
        console.error(`[Force Delete Server Error] Lỗi SQL xóa bản ghi cha trong trials:`, trialErr);
      }

      try {
        await db.delete(trials).where(eq(trials.id, id));
        console.log(`[Force Delete Server] [Layer 2 ORM] Đã xóa bản ghi cha trong trials: ${id}`);
      } catch (trialErr: any) {
        console.error(`[Force Delete Server Error] Lỗi ORM xóa bản ghi cha trong trials:`, trialErr);
      }

      // Read API Key from firebase-applet-config.json for authorized REST DELETE
      let firebaseApiKey = "";
      try {
        const configPath = path.join(process.cwd(), "firebase-applet-config.json");
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
          firebaseApiKey = config.apiKey || "";
        }
      } catch (e) {
        console.warn("[Force Delete Server Warning] Không thể đọc firebase API key:", e);
      }

      // Also delete the Firestore document via REST API to bypass security rules with API Key
      let firestoreStatus = 0;
      try {
        const queryParam = firebaseApiKey ? `?key=${firebaseApiKey}` : "";
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/sublime-zodiac-02t1j/databases/ai-studio-trnggiaphtthicng-743d1a97-2f9f-42a7-90e8-d59824245d9d/documents/kiot_trials/${id}${queryParam}`;
        console.log(`[Force Delete Server] Gửi REST DELETE tới Firestore: ${firestoreUrl}`);
        const fRes = await fetch(firestoreUrl, { method: "DELETE" });
        firestoreStatus = fRes.status;
        console.log(`[Force Delete Server] Firestore document deletion status for ${id}:`, fRes.status);
      } catch (fErr: any) {
        console.error(`[Force Delete Server Warning] Không thể xóa Firestore doc ${id}:`, fErr.message || fErr);
      }

      return res.json({ 
        success: true, 
        message: "Successfully forced server-side cascade delete on PostgreSQL and Firestore",
        postgresDeleted: true,
        firestoreDeleted: firestoreStatus === 200 || firestoreStatus === 204 || firestoreStatus === 404
      });
    } catch (error: any) {
      console.error("[Force Delete Server Fatal Error]:", error);
      return res.status(500).json({ error: error.message || "Failed to force delete SaaS trial" });
    }
  });

  // 2b. Delete a SaaS trial registration
  app.delete("/api/trials/:id", async (req, res) => {
    try {
      const id = req.params.id;
      
      // Cascade delete all tenant records safely using individual try-catches to bypass foreign key or table existence issues
      const tablesToDelete = [
        { name: "products", action: () => db.delete(productsTable).where(eq(productsTable.trialId, id)) },
        { name: "categories", action: () => db.delete(categoriesTable).where(eq(categoriesTable.trialId, id)) },
        { name: "customers", action: () => db.delete(customersTable).where(eq(customersTable.trialId, id)) },
        { name: "suppliers", action: () => db.delete(suppliersTable).where(eq(suppliersTable.trialId, id)) },
        { name: "invoices", action: () => db.delete(invoicesTable).where(eq(invoicesTable.trialId, id)) },
        { name: "staff", action: () => db.delete(staffTable).where(eq(staffTable.trialId, id)) },
        { name: "settings", action: () => db.delete(settingsTable).where(eq(settingsTable.trialId, id)) },
        { name: "audits", action: () => db.delete(auditsTable).where(eq(auditsTable.trialId, id)) },
        { name: "purchase_orders", action: () => db.delete(purchaseOrdersTable).where(eq(purchaseOrdersTable.trialId, id)) },
        { name: "cashbook", action: () => db.delete(cashbookTable).where(eq(cashbookTable.trialId, id)) },
        { name: "projects", action: () => db.delete(projectsTable).where(eq(projectsTable.trialId, id)) },
        { name: "cash_shifts", action: () => db.delete(cashShiftsTable).where(eq(cashShiftsTable.trialId, id)) },
        { name: "system_logs", action: () => db.delete(systemLogsTable).where(eq(systemLogsTable.trialId, id)) }
      ];

      for (const table of tablesToDelete) {
        try {
          await table.action();
        } catch (tableErr) {
          console.warn(`[Cascade Delete Warning] Could not delete from ${table.name} for trial ${id}:`, tableErr);
        }
      }
      
      // Delete the actual trial parent record
      await db.delete(trials).where(eq(trials.id, id));

      // Also delete the Firestore document via REST API to ensure no synchronization loops recreate it
      try {
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/sublime-zodiac-02t1j/databases/ai-studio-trnggiaphtthicng-743d1a97-2f9f-42a7-90e8-d59824245d9d/documents/kiot_trials/${id}`;
        console.log(`[Server Delete] Sending REST DELETE to Firestore: ${firestoreUrl}`);
        const fRes = await fetch(firestoreUrl, { method: "DELETE" });
        console.log(`[Server Delete] Firestore document deletion status for ${id}:`, fRes.status);
      } catch (fErr) {
        console.error(`[Server Delete Warning] Could not delete Firestore doc ${id}:`, fErr);
      }
      
      return res.json({ success: true });
    } catch (error: any) {
      console.error("Delete trial error:", error);
      return res.status(500).json({ error: error.message || "Failed to delete SaaS trial" });
    }
  });

  // 3. Load entire store business data from PostgreSQL
  app.get("/api/kiot/load/:trialId", async (req, res) => {
    try {
      const trialId = req.params.trialId;
      
      const productsList = await db.select().from(productsTable).where(eq(productsTable.trialId, trialId));
      const categoriesList = await db.select().from(categoriesTable).where(eq(categoriesTable.trialId, trialId));
      const customersList = await db.select().from(customersTable).where(eq(customersTable.trialId, trialId));
      const suppliersList = await db.select().from(suppliersTable).where(eq(suppliersTable.trialId, trialId));
      const invoicesList = await db.select().from(invoicesTable).where(eq(invoicesTable.trialId, trialId));
      const staffList = await db.select().from(staffTable).where(eq(staffTable.trialId, trialId));
      const settingsList = await db.select().from(settingsTable).where(eq(settingsTable.trialId, trialId));
      const auditsList = await db.select().from(auditsTable).where(eq(auditsTable.trialId, trialId));
      const purchaseOrdersList = await db.select().from(purchaseOrdersTable).where(eq(purchaseOrdersTable.trialId, trialId));
      const cashbookList = await db.select().from(cashbookTable).where(eq(cashbookTable.trialId, trialId));
      const projectsList = await db.select().from(projectsTable).where(eq(projectsTable.trialId, trialId));
      const cashShiftsList = await db.select().from(cashShiftsTable).where(eq(cashShiftsTable.trialId, trialId));
      const systemLogsList = await db.select().from(systemLogsTable).where(eq(systemLogsTable.trialId, trialId));

      return res.json({
        products: productsList,
        categories: categoriesList,
        customers: customersList,
        suppliers: suppliersList,
        invoices: invoicesList,
        staff: staffList,
        settings: settingsList[0] || null,
        audits: auditsList,
        purchaseOrders: purchaseOrdersList,
        cashbook: cashbookList,
        projects: projectsList,
        cashShifts: cashShiftsList,
        systemLogs: systemLogsList,
      });
    } catch (error: any) {
      console.error("Load kiot data error:", error);
      return res.status(500).json({ error: error.message || "Failed to load kiot data from PostgreSQL" });
    }
  });

  // 4. Synchronize entire store business data state to PostgreSQL
  app.post("/api/kiot/sync/:trialId", async (req, res) => {
    try {
      const trialId = req.params.trialId;
      const {
        products,
        categories,
        customers,
        suppliers,
        invoices,
        staff,
        settings,
        audits,
        purchaseOrders,
        cashbook,
        projects,
        cashShifts,
        systemLogs
      } = req.body;

      // Helper to safely replace data for this specific tenant / trial
      const syncTable = async (tableObj: any, dataList: any[]) => {
        // First delete old records of this tenant
        await db.delete(tableObj).where(eq(tableObj.trialId, trialId));
        if (dataList && dataList.length > 0) {
          // Map data list to have correct trialId
          const mappedList = dataList.map((item: any) => {
            const copy = { ...item, trialId: trialId };
            // Ensure any arrays are stored correctly as jsonb
            return copy;
          });
          // Perform batch insert
          await db.insert(tableObj).values(mappedList);
        }
      };

      if (products !== undefined) await syncTable(productsTable, products);
      if (categories !== undefined) await syncTable(categoriesTable, categories);
      if (customers !== undefined) await syncTable(customersTable, customers);
      if (suppliers !== undefined) await syncTable(suppliersTable, suppliers);
      if (invoices !== undefined) await syncTable(invoicesTable, invoices);
      if (staff !== undefined) await syncTable(staffTable, staff);
      if (audits !== undefined) await syncTable(auditsTable, audits);
      if (purchaseOrders !== undefined) await syncTable(purchaseOrdersTable, purchaseOrders);
      if (cashbook !== undefined) await syncTable(cashbookTable, cashbook);
      if (projects !== undefined) await syncTable(projectsTable, projects);
      if (cashShifts !== undefined) await syncTable(cashShiftsTable, cashShifts);
      if (systemLogs !== undefined) await syncTable(systemLogsTable, systemLogs);

      if (settings !== undefined && settings !== null) {
        await db.delete(settingsTable).where(eq(settingsTable.trialId, trialId));
        await db.insert(settingsTable).values({
          trialId: trialId,
          shopName: settings.shopName || "KiotX Store",
          address: settings.address || "Chưa cập nhật",
          phone: settings.phone || "0900000000",
          logoUrl: settings.logoUrl || "",
          taxRate: (settings.taxRate !== undefined && settings.taxRate !== null) ? Number(settings.taxRate) : 0,
          currency: settings.currency || "VND",
          zaloNumber: settings.zaloNumber || settings.phone || "0900000000",
          seoTitle: settings.seoTitle || settings.shopName || "KiotX Store",
          seoKeywords: settings.seoKeywords || "kiotx, shop",
          reportDeletePassword: settings.reportDeletePassword || null,
          bankName: settings.bankName || null,
          bankAccount: settings.bankAccount || null,
          bankOwner: settings.bankOwner || null,
          eInvoiceEnabled: settings.eInvoiceEnabled || false,
          eInvoiceProvider: settings.eInvoiceProvider || null,
          eInvoiceTaxCode: settings.eInvoiceTaxCode || null,
          eInvoiceApiUrl: settings.eInvoiceApiUrl || null,
          eInvoiceUsername: settings.eInvoiceUsername || null,
          eInvoicePassword: settings.eInvoicePassword || null,
          eInvoicePattern: settings.eInvoicePattern || null,
          eInvoiceSerial: settings.eInvoiceSerial || null,
        });
      }

      return res.json({ success: true, timestamp: new Date().toISOString() });
    } catch (error: any) {
      console.error("Sync Kiot data error:", error);
      return res.status(500).json({ error: error.message || "Failed to synchronize kiot data to PostgreSQL" });
    }
  });

  // 5. Send Email Confirmation for Invoice
  app.post("/api/kiot/email-invoice", async (req, res) => {
    try {
      const { invoice, customerEmail, shopSetting } = req.body;
      if (!invoice || !customerEmail) {
        return res.status(400).json({ error: "Missing invoice or customerEmail in request body." });
      }

      const trialId = invoice.trialId || "default";

      // Try to resolve shop settings
      let settings = shopSetting;
      if (!settings) {
        try {
          const settingsList = await db.select().from(settingsTable).where(eq(settingsTable.trialId, trialId));
          settings = settingsList[0];
        } catch (e) {
          console.error("Failed to fetch settings from db for email:", e);
        }
      }

      const shopName = settings?.shopName || "KiotX Store";
      const shopPhone = settings?.phone || "Chưa cập nhật";
      const shopAddress = settings?.address || "Chưa cập nhật";

      const invoiceCode = invoice.invoiceCode;
      const formattedDate = new Date(invoice.date).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
      const cashierName = invoice.cashierName || "Hệ thống";
      const customerName = invoice.customerName || "Khách hàng";

      const paymentMethodMap: Record<string, string> = {
        "CASH": "Tiền mặt",
        "BANK_TRANSFER": "Chuyển khoản",
        "CREDIT_CARD": "Thẻ tín dụng",
        "DEBT": "Ghi nợ"
      };
      const paymentMethodName = paymentMethodMap[invoice.paymentMethod] || invoice.paymentMethod;

      // Currency Formatter Helper
      const formatCurrencyVND = (value: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
      };

      // Generate invoice lines
      let itemsHtml = "";
      if (invoice.items && invoice.items.length > 0) {
        itemsHtml = invoice.items.map((item: any) => {
          const discountText = item.discount > 0 ? `<br><span style="font-size: 11px; color: #dc2626;">Giảm: -${formatCurrencyVND(item.discount)}</span>` : "";
          return `
            <tr>
              <td style="padding: 12px 10px; font-size: 14px; border-bottom: 1px solid #e5e7eb; color: #374151;">
                <strong>${item.productName}</strong><br>
                <span style="font-size: 11px; color: #6b7280;">Mã: ${item.productCode}</span>
                ${discountText}
              </td>
              <td style="padding: 12px 10px; font-size: 14px; border-bottom: 1px solid #e5e7eb; color: #374151; text-align: center;">${item.quantity}</td>
              <td style="padding: 12px 10px; font-size: 14px; border-bottom: 1px solid #e5e7eb; color: #374151; text-align: right;">${formatCurrencyVND(item.unitPrice)}</td>
              <td style="padding: 12px 10px; font-size: 14px; border-bottom: 1px solid #e5e7eb; color: #111827; text-align: right; font-weight: 600;">${formatCurrencyVND(item.total)}</td>
            </tr>
          `;
        }).join("");
      }

      const totalOriginalStr = formatCurrencyVND(invoice.totalOriginal);
      const totalPayableStr = formatCurrencyVND(invoice.totalPayable);

      const discountHtml = invoice.discountAmount > 0 
        ? `<tr>
            <td style="padding: 6px 10px; color: #4b5563;">Giảm giá hóa đơn:</td>
            <td style="padding: 6px 10px; text-align: right; color: #dc2626; font-weight: 500;">-${formatCurrencyVND(invoice.discountAmount)}</td>
          </tr>` 
        : "";

      const taxHtml = invoice.taxAmount > 0 
        ? `<tr>
            <td style="padding: 6px 10px; color: #4b5563;">Thuế VAT (${invoice.taxRate || 0}%):</td>
            <td style="padding: 6px 10px; text-align: right; color: #4b5563;">${formatCurrencyVND(invoice.taxAmount)}</td>
          </tr>` 
        : "";

      const eInvoiceHtml = invoice.eInvoiceStatus === "ISSUED" 
        ? `
          <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 16px; border-radius: 8px; margin-bottom: 24px; font-size: 13px; color: #065f46;">
            <strong style="font-size: 14px; display: block; margin-bottom: 6px;">🧾 Thông tin Hóa đơn điện tử (HĐĐT)</strong>
            <p style="margin: 4px 0;">• Mã cơ quan thuế: <strong style="font-family: monospace; font-size: 14px;">${invoice.eInvoiceCode}</strong></p>
            <p style="margin: 4px 0;">• Tra cứu trực tuyến tại: <a href="${invoice.eInvoiceUrl}" target="_blank" style="color: #047857; font-weight: bold; text-decoration: underline;">Liên kết tra cứu HĐĐT chính thức</a></p>
          </div>
        ` 
        : "";

      // Main HTML content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Xác nhận hóa đơn mua hàng #${invoiceCode}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
            
            <!-- Header Banner -->
            <div style="background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
              <h2 style="margin: 0; font-size: 20px; font-weight: 500; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px;">Cửa hàng</h2>
              <h1 style="margin: 4px 0 0 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">${shopName}</h1>
              <p style="margin: 12px 0 0 0; font-size: 14px; opacity: 0.85; background: rgba(255,255,255,0.15); display: inline-block; padding: 6px 16px; border-radius: 20px;">Cảm ơn quý khách đã mua sắm!</p>
            </div>
            
            <div style="padding: 24px;">
              <!-- Intro message -->
              <p style="font-size: 15px; color: #4b5563; margin-top: 0; margin-bottom: 24px;">Xin chào <strong>${customerName}</strong>, chúng tôi xin gửi thông tin chi tiết hóa đơn của đơn hàng vừa hoàn tất giao dịch tại <strong>${shopName}</strong>.</p>
              
              <!-- E-Invoice Box (if present) -->
              ${eInvoiceHtml}
              
              <!-- Invoice Meta Info Grid -->
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #f3f4f6;">
                <tr>
                  <td style="padding: 12px; width: 50%; border-right: 1px solid #f3f4f6; vertical-align: top;">
                    <span style="color: #6b7280; display: block; text-transform: uppercase; font-size: 10px; font-weight: bold; letter-spacing: 0.5px;">Mã hóa đơn</span>
                    <strong style="font-size: 15px; color: #111827; font-family: monospace;">#${invoiceCode}</strong>
                  </td>
                  <td style="padding: 12px; width: 50%; vertical-align: top; text-align: right;">
                    <span style="color: #6b7280; display: block; text-transform: uppercase; font-size: 10px; font-weight: bold; letter-spacing: 0.5px;">Thời gian mua</span>
                    <strong style="font-size: 13px; color: #111827;">${formattedDate}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px; border-top: 1px solid #f3f4f6; border-right: 1px solid #f3f4f6; vertical-align: top;">
                    <span style="color: #6b7280; display: block; text-transform: uppercase; font-size: 10px; font-weight: bold; letter-spacing: 0.5px;">Thu ngân</span>
                    <span style="font-size: 13px; color: #111827; font-weight: 500;">${cashierName}</span>
                  </td>
                  <td style="padding: 12px; border-top: 1px solid #f3f4f6; vertical-align: top; text-align: right;">
                    <span style="color: #6b7280; display: block; text-transform: uppercase; font-size: 10px; font-weight: bold; letter-spacing: 0.5px;">Phương thức</span>
                    <span style="font-size: 13px; color: #111827; font-weight: 500; background-color: #eef2ff; color: #4338ca; padding: 2px 8px; border-radius: 4px; display: inline-block;">${paymentMethodName}</span>
                  </td>
                </tr>
              </table>
              
              <!-- Items Table -->
              <h3 style="font-size: 16px; margin: 0 0 12px 0; color: #111827; font-weight: 700; border-bottom: 2px solid #f3f4f6; padding-bottom: 8px;">Danh sách sản phẩm</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <thead>
                  <tr style="text-transform: uppercase; font-size: 11px; font-weight: bold; letter-spacing: 0.5px; color: #6b7280;">
                    <th style="padding: 8px 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Sản phẩm</th>
                    <th style="padding: 8px 10px; text-align: center; border-bottom: 2px solid #e5e7eb; width: 40px;">SL</th>
                    <th style="padding: 8px 10px; text-align: right; border-bottom: 2px solid #e5e7eb; width: 100px;">Đơn giá</th>
                    <th style="padding: 8px 10px; text-align: right; border-bottom: 2px solid #e5e7eb; width: 110px;">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              
              <!-- Totals -->
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 12px;">
                <tr>
                  <td style="padding: 6px 10px; color: #4b5563;">Tổng tiền hàng gốc:</td>
                  <td style="padding: 6px 10px; text-align: right; color: #4b5563;">${totalOriginalStr}</td>
                </tr>
                ${discountHtml}
                ${taxHtml}
                <tr style="border-top: 2px solid #e5e7eb; font-size: 16px;">
                  <td style="padding: 16px 10px 6px 10px; font-weight: bold; color: #111827;">Khách cần trả:</td>
                  <td style="padding: 16px 10px 6px 10px; text-align: right; font-weight: 800; color: #4f46e5; font-size: 20px;">${totalPayableStr}</td>
                </tr>
              </table>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
              <p style="margin: 0 0 6px 0;"><strong>${shopName}</strong></p>
              <p style="margin: 4px 0;">📍 Địa chỉ: ${shopAddress}</p>
              <p style="margin: 4px 0;">📞 Hotline: ${shopPhone}</p>
              <div style="margin-top: 16px; border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 11px; color: #9ca3af;">
                Thư điện tử được tạo tự động bởi hệ thống KiotX. Vui lòng không trả lời thư này.<br>
                © ${new Date().getFullYear()} KiotX. All rights reserved.
              </div>
            </div>
            
          </div>
        </body>
        </html>
      `;

      let sentResult: any = {};
      let isMock = true;

      // Check for custom SMTP configuration
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          const host = process.env.SMTP_HOST || "smtp.gmail.com";
          const port = Number(process.env.SMTP_PORT) || 587;
          
          const transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });

          const info = await transporter.sendMail({
            from: `"${shopName}" <${process.env.SMTP_USER}>`,
            to: customerEmail,
            subject: `[${shopName}] Xác nhận hóa đơn mua hàng #${invoiceCode}`,
            html: htmlContent,
          });

          sentResult = {
            messageId: info.messageId,
            response: info.response,
            recipient: customerEmail,
            isDemo: false
          };
          isMock = false;
          console.log(`Real SMTP Email sent successfully to ${customerEmail}. Message ID: ${info.messageId}`);
        } catch (mailErr: any) {
          console.error("Failed to send email using real SMTP settings. Falling back to demo mode:", mailErr);
        }
      }

      // If SMTP is not configured or fails, fallback to Ethereal Test Account (dynamic SMTP for demonstration)
      if (isMock) {
        try {
          console.log("No SMTP credentials or real SMTP failed. Generating Ethereal test mail...");
          const testAccount = await nodemailer.createTestAccount();
          const etherealTransporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass
            }
          });

          const info = await etherealTransporter.sendMail({
            from: `"${shopName}" <no-reply@kiotx.com>`,
            to: customerEmail,
            subject: `[THỬ NGHIỆM - ${shopName}] Xác nhận hóa đơn mua hàng #${invoiceCode}`,
            html: htmlContent,
          });

          const previewUrl = nodemailer.getTestMessageUrl(info);
          sentResult = {
            messageId: info.messageId,
            previewUrl,
            recipient: customerEmail,
            isDemo: true,
            demoUser: testAccount.user
          };
          console.log(`Demo Ethereal email sent to ${customerEmail}. Preview URL: ${previewUrl}`);
        } catch (etherealErr: any) {
          console.error("Ethereal simulation failed. Logging content to console:", etherealErr);
          sentResult = {
            recipient: customerEmail,
            isDemo: true,
            consoleLogged: true
          };
        }
      }

      return res.json({
        success: true,
        sentResult,
        invoiceCode
      });

    } catch (error: any) {
      console.error("Send invoice email error:", error);
      return res.status(500).json({ error: error.message || "Failed to process and send invoice email" });
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
