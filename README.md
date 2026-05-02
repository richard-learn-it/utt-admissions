<div align="center">
  <img src="https://img.icons8.com/isometric/150/000000/bot.png" alt="UTT Chatbot Logo" width="120" />

  <h1>🎓 UTT Admissions Chatbot</h1>

  <p>
    <em>Một giải pháp Trí Tuệ Nhân Tạo nguồn mở hỗ trợ Tư vấn Tuyển sinh thông minh, đa mô hình linh hoạt.</em>
  </p>

  <p>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-18.x-61dafb.svg?logo=react&style=for-the-badge" alt="React" /></a>
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-18.x-339933.svg?logo=node.js&style=for-the-badge" alt="Node" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.x-3178c6.svg?logo=typescript&style=for-the-badge" alt="TypeScript" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-3.x-38b2ac.svg?logo=tailwind-css&style=for-the-badge" alt="Tailwind CSS" /></a>
    <br/>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License: MIT" /></a>
    <a href="https://github.com/facebook/react/pulls"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge" alt="PRs Welcome" /></a>
  </p>
</div>

---

<details open>
  <summary><b>📖 BẢNG MỤC LỤC CHI TIẾT (Table of Contents)</b></summary>
  <br/>
  
- [🌟 Tầm nhìn & Mục tiêu](#-tầm-nhìn--mục-tiêu)
- [✨ Tính năng nổi bật](#-tính-năng-nổi-bật)
- [🏗 Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [📦 Công nghệ cốt lõi](#-công-nghệ-cốt-lõi)
- [🚀 Hướng dẫn cài đặt & Triển khai](#-hướng-dẫn-cài-đặt--triển-khai)
- [⚙️ Cấu hình Biến môi trường](#️-cấu-hình-biến-môi-trường)
- [📚 Tài liệu API (API References)](#-tài-liệu-api-api-references)
- [🛡 Cơ chế Bảo mật](#-cơ-chế-bảo-mật)
- [🤝 Đóng góp (Contributing)](#-đóng-góp-contributing)
- [📜 Giấy phép (License)](#-giấy-phép-license)
  
</details>

---

## 🌟 Tầm nhìn & Mục tiêu

**UTT Admissions Chatbot** được xây dựng nhằm giải quyết bài toán quá tải thông tin trong kỳ tuyển sinh đại học. Hệ thống tự động hóa quá trình tư vấn bằng cách sử dụng **Mô hình Ngôn ngữ Lớn (LLMs)** kết hợp công cụ **Tìm kiếm Web thời gian thực** để tránh hiện tượng ảo giác (hallucination), cung cấp cho thí sinh và phụ huynh dữ liệu chính xác, kịp thời nhất về điểm chuẩn, hồ sơ và các thắc mắc chuyên sâu. 

Được thiết kế theo tiêu chuẩn của một **dự án mã nguồn mở cộng đồng**, source code tách bạch hoàn chỉnh giữa Frontend và Backend, giúp các kỹ sư dễ dàng fork, tùy biến và mở rộng cho mọi trường Đại học / Tổ chức giáo dục khác.

---

## ✨ Tính năng nổi bật

<table>
  <tr>
    <td width="50%">
      <h3>💬 Lõi Hội Thoại AI Tiên Tiến</h3>
      <ul>
        <li><b>Streaming Response:</b> Hiệu ứng gõ chữ thời gian thực (giống ChatGPT) thông qua Server-Sent Events (SSE) tối ưu tốc độ.</li>
        <li><b>Multi-Provider Ready:</b> Cầu nối trực tiếp với <a href="https://openrouter.ai">OpenRouter</a>, cho phép chuyển đổi model linh hoạt (GPT-4o, Claude 3.5, Gemini 1.5) mà không cần viết lại mã nguồn.</li>
        <li><b>Markdown & Latex Rendering:</b> Xử lý hiển thị hoàn hảo bảng, in đậm, danh sách và công thức toán học từ AI.</li>
      </ul>
    </td>
    <td width="50%">
      <h3>🔍 Tích Hợp Web Search & Xử lý File</h3>
      <ul>
        <li><b>Zero-Hallucination:</b> Kết nối với <a href="https://serper.dev">Serper API</a> lấy top kết quả từ Google, cho phép Bot luôn biết thông tin tuyển sinh mới nhất của năm học.</li>
        <li><b>Image Vision Upload:</b> Cho phép thí sinh gửi trực tiếp ảnh (học bạ, bằng khen, chứng chỉ IELTS) để AI đọc, nhận diện và tư vấn xét tuyển thẳng.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <h3>🛡 Enterprise & Xếp Hạng Cộng Đồng</h3>
      <ul>
        <li><b>Rate Limiter Cơ Sở:</b> Chống lạm dụng API và Spam requests ngay từ ngõ vào của backend.</li>
        <li><b>Responsive Design 100%:</b> Giao diện UX/UI cực kỳ mượt mà, hỗ trợ Dark Mode chuẩn mực với Radix UI + Tailwind.</li>
        <li><b>Kiến trúc Mở rộng:</b> Dễ dàng map với các hệ thống PostgreSQL/Redis nếu dự án cộng đồng muốn triển khai ở quy mô Enterprise.</li>
      </ul>
    </td>
  </tr>
</table>

---

## 🏗 Kiến trúc hệ thống

Dự án áp dụng mô hình **Client-Server phân tách**, cho phép mở rộng Backend độc lập để handle hàng triệu requests.

```mermaid
graph TD;
    subgraph Người Dùng
    User([Người dùng]) --- UI[React/Vite Client]
    end

    subgraph Hệ thống UTT Chatbot
    UI <==>|REST / Stream (SSE)| API[Node.js / Express API]
    API -->|Images/Files| Storage[Multer / Local Temp]
    end

    subgraph Dịch vụ Bên ngoài (3rd Party Providers)
    API <==>|Prompt Engineering| OpenRouter((OpenRouter AI))
    API <==>|Real-time Query| Serper((Serper Google))
    end

    classDef default fill:#f9f9f9,stroke:#333,stroke-width:1px;
    classDef external fill:#e8f4f8,stroke:#0096d6,stroke-width:2px;
    class OpenRouter,Serper external;
```

---

## 📦 Công nghệ cốt lõi

<div align="center">
  <img src="https://skillicons.dev/icons?i=react,ts,vite,tailwind,nodejs,express" alt="Tech Stack" />
</div>
<br/>

- **Frontend (Client):** 
  - `React 18` + `Vite`: Phát triển và build tốc độ ánh sáng.
  - `Tailwind CSS` + `Radix UI Primitives`: Xây dựng layout bảo mật, accessible, full Dark/Light mode hỗ trợ bằng `next-themes`.
  - `Lucide React`: Thư viện icon vector sắc nét.
  - `React Markdown` / `Remark GFM`: Chuyển đổi cú pháp text phức tạp từ AI sang HTML.
  
- **Backend (Server):**
  - `Node.js` + `Express` + `TypeScript`: Nền tảng server tĩnh vững chắc, có hệ thống ép kiểu dữ liệu chặt chẽ.
  - `Multer`: Streaming/Parsing file uploads.
  - `CORS`, `Helmet`, `Express-Rate-Limit`: Nhóm khiên bảo vệ hệ thống khỏi tấn công thông thường.

---

## 🚀 Hướng dẫn cài đặt & Triển khai

### 1. Chuẩn bị tài nguyên
Cài đặt [Node.js](https://nodejs.org/en/) (phiên bản `>= 18.x`) và trình quản lý gói (`npm`, `yarn` hoặc `pnpm`).

### 2. Khởi tạo mã nguồn
Clone dự án từ nhánh chính:
```bash
git clone https://github.com/utt-community/utt-admissions-chat.git
cd utt-admissions-chat
```

### 3. Cài đặt Dependencies cho cả 2 môi trường
Bật terminal thứ nhất (dành cho Backend):
```bash
cd server
npm install
```
Bật terminal thứ hai (dành cho Frontend):
```bash
cd client
npm install
```

### 4. Khởi chạy Hệ thống trên Local

> **Lưu ý:** Hãy chắc chắn bạn đã cấu hình file `.env` theo hướng dẫn nằm ở phần [Cấu hình biến môi trường](#️-cấu-hình-biến-môi-trường) bên dưới.

**Chạy Server API:**
```bash
cd server
npm run dev
# Máy chủ sẽ lắng nghe tại: http://localhost:5000
```

**Chạy Client Interface:**
```bash
cd client
npm run dev
# Giao diện sẽ hiển thị tại: http://localhost:5173
```

---

## ⚙️ Cấu hình Biến môi trường

<details>
  <summary><b>Nhấn để xem chi tiết biến môi trường Backend <code>server/.env</code></b></summary>
  
  Bạn cần tạo một file tên là `.env` vào thư mục `/server` và cung cấp các giá trị sau:

  ```ini
  # === CONFIGURATION CƠ BẢN ===
  PORT=5000
  NODE_ENV=development
  
  # === CORS SECURITY ===
  CLIENT_URL=http://localhost:5173 
  
  # === EXTERNAL API KEYS ===
  # Lấy key tại: https://openrouter.ai/keys
  OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxx
  
  # Lấy key tại: https://serper.dev/
  SERPER_API_KEY=xxxxxxxxxxxxxxxxxxxxx
  ```
</details>

---

## 📚 Tài liệu API (API References)

Hệ thống cung cấp một số endpoint trọng điểm dành cho nhà phát triển muốn tích hợp bot UTT vào App Mobile hoặc hệ thống Web khác.

| Phương thức | Endpoint | Chức năng (Description) | Payload yêu cầu |
| --- | --- | --- | --- |
| `POST` | `/api/chat/stream` | Gửi tin nhắn lấy phản hồi AI theo dạng SSE Stream | `{ "message": "string", "history": [...] }` |
| `POST` | `/api/chat/upload` | Upload hình ảnh hồ sơ, học bạ để phân tích hệ thống | `FormData { "image": File }` |
| `GET` | `/api/system/health`| Ping kiểm tra trạng thái hoạt động của Server | _Không có_ |

_Ví dụ curl gọi luồng Chat:_
```bash
curl -X POST http://localhost:5000/api/chat/stream \
-H "Content-Type: application/json" \
-d '{"message": "Tuyển sinh ngành Công nghệ thông tin UTT 2024 có gì mới?"}'
```

---

## 🛡 Cơ chế Bảo mật

Là một dự án cộng đồng hướng đến public ra ngoài Internet, tính bảo mật được thiết lập rất chặc chẽ rải dọc hệ thống:

1. **Helmet Intergration:** Ẩn hoàn toàn các HTTP Header kỹ thuật (ngăn ngừa hacker biết server đang chạy Express).
2. **Strict CORS Policy:** Block toàn bộ các cross-origin requests không hợp lệ. Chỉ Frontend khai báo trong biến `CLIENT_URL` mới được giao tiếp với Backend.
3. **Smart Rate Limiting:** Giới hạn 100 requests / 15 phút trên mỗi Window IP. Khóa tài khoản nếu có dấu hiệu xả (brute-force) API.

---

## 🤝 Đóng góp (Contributing)

Dự án này là tài sản mã nguồn mở và chúng tôi luôn vui mừng đón nhận đóng góp từ các lập trình viên trên toàn thế giới. Để đóng góp:

1. **Fork** repository này về Github của bạn.
2. Thiết lập nhánh mới (`git checkout -b feature/AmazingFeature`).
3. Dọn dẹp code, thêm comment và test. Đóng gói commit (`git commit -m 'Add some AmazingFeature'`).
4. Gửi mã lên (`git push origin feature/AmazingFeature`).
5. Vào thanh Pull Requests, mở Pull Request (PR) và đợi reviewer phê duyệt!

_Hãy đọc file `CONTRIBUTING.md` để hiểu sâu về tiêu chuẩn Coding Convention đang áp dụng._

---

## 📜 Giấy phép (License)

Được phân phối dưới **MIT License**. Bạn được quyền tự do tái định dạng, thương mại hóa, và chỉnh sửa thay đổi. Xem tệp `LICENSE` để biết thêm toàn bộ chi tiết.

<hr/>
<div align="center">
  <p>Được thiết kế toàn cầu với ❤️ bởi Cộng đồng Phát Triển</p>
  <p>
    <a href="https://github.com/utt-community">Báo cáo Bug</a> · 
    <a href="https://github.com/utt-community">Yêu cầu Tính năng</a>
  </p>
</div>
