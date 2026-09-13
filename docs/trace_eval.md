# 📊 BÁO CÁO THU HOẠCH NGHIỆM THU BÀI LAB 3 (BƯỚC 3 — SUBMISSION ARTIFACT)

> **Họ và Tên Học viên:** Trần Tuấn Cường  
> **Mã Sinh Viên / Mã Học viên:** 2A202602717  
> **Chủ đề Lựa chọn:** Trợ lý Đơn hàng & Kho vận (Supply Chain Agent)

---

## 1. BẢNG CHẤM ĐIỂM AGENTIC FIT SCORING MATRIX (ĐÁNH GIÁ CHỦ ĐỀ)

| Tiêu chí Đánh giá | Mức độ (1 - 5) | Giải trình chi tiết lý do chọn điểm |
| :--- | :---: | :--- |
| **1. Multi-step Reasoning** | 4 / 5 | Agent cần thực hiện nhiều bước như tra cứu đơn → vận đơn → vị trí → tổng hợp kết quả. |
| **2. Tool Interaction** | 5 / 5 | Agent tương tác với nhiều Tool/API như Order, Shipment, Warehouse và Database/MCP. |
| **3. Dynamic Decision** | 4 / 5 | Bước xử lý tiếp theo có phụ thuộc vào trạng thái và kết quả của bước trước. Ví dụ: nếu là “Đang vận chuyển”, Agent chuyển sang Shipment Tool để tra cứu vị trí hiện tại. |
| **4. Long Horizon Goal** | 3 / 5 | Có thể duy trì mục tiêu qua nhiều lượt hỏi, nhưng phần lớn tác vụ không quá dài. |
| **TỔNG ĐIỂM AGENTIC FIT** | **16 / 20** | *Nếu tổng điểm > 12/20: Bài toán rất phù hợp triển khai Agentic System.* |

---

## 2. TRÍCH XUẤT KẾT QUẢ WATERFALL TRACE LOG (SAU KHI CHẠY TEST SUITE TRÊN API THẬT)

> ⚠️ **YÊU CẦU NGHIỆM THU:** Mở tệp `.env` điền `GEMINI_API_KEY` (hoặc `OPENAI_API_KEY`) để kết nối LLM thật trước khi thực thi `python src/app.py --all`. Bài nộp chỉ dùng Mock Offline Provider sẽ không đạt điểm nghiệm thực tế.

Dán 1 đoạn trích xuất log tiêu biểu từ file `docs/trace_waterfall.json` sinh ra từ phản hồi LLM API thật:

```json
[
  {
    "step": 1,
    "query": "Hãy tra cứu thông tin mã vận đơn VN2026001 và cho tôi biết hiện tại kiện hàng đang được lưu trữ ở vị trí kho nào?",
    "action_type": "TOOL_EXECUTION",
    "tool_name": "track_shipment",
    "arguments": {
      "tracking_code": "VN2026001"
    },
    "observation": {
      "status": "SUCCESS",
      "tracking_code": "VN2026001",
      "shipment_data": {
        "order_id": "ORD-2026-001",
        "tracking_code": "VN2026001",
        "customer_name": "Công ty CP Sản xuất và Kinh doanh VinFast",
        "product_name": "Lô 50 bộ pin Lithium-ion NMC dung lượng 100Ah",
        "quantity": 50,
        "status": "Đã lưu kho",
        "warehouse_name": "Kho Tổng Logistics VinFast Hải Phòng",
        "warehouse_location": "Kệ A1-01, Tầng 2, Phân khu Pin xe điện",
        "destination": "Nhà máy VinFast Cát Hải, Hải Phòng",
        "carrier": "VinFast In-house Logistics",
        "last_updated": "10:30 13/09/2026"
      },
      "message": "Đã tìm thấy thông tin đơn hàng [VN2026001]: Sản phẩm: Lô 50 bộ pin Lithium-ion NMC dung lượng 100Ah (Số lượng: 50). Khách hàng: Công ty CP Sản xuất và Kinh doanh VinFast. Trạng thái: Đã lưu kho. Vị trí lưu kho: Kho Tổng Logistics VinFast Hải Phòng (Kệ A1-01, Tầng 2, Phân khu Pin xe điện). Điểm đến: Nhà máy VinFast Cát Hải, Hải Phòng. Đơn vị vận chuyển: VinFast In-house Logistics. Cập nhật lần cuối: 10:30 13/09/2026."
    },
    "latency_ms": 2981.89
  },
  {
    "step": 2,
    "query": "Hãy tra cứu thông tin mã vận đơn VN2026001 và cho tôi biết hiện tại kiện hàng đang được lưu trữ ở vị trí kho nào?",
    "action_type": "FINAL_ANSWER",
    "thought": "Gemini phản hồi trực tiếp bằng văn bản (không cần gọi công cụ).",
    "output": "Thông tin chi tiết về mã vận đơn **VN2026001** đã được tra cứu thành công trên hệ thống VinGroup/VinFast Logistics:\n\n### 📦 **Thông tin kiện hàng & Vị trí lưu kho**\n* **Mã vận đơn:** `VN2026001` (Mã đơn hàng: `ORD-2026-001`)\n* **Sản phẩm:** Lô 50 bộ pin Lithium-ion NMC dung lượng 100Ah (Số lượng: 50)\n* **Khách hàng:** Công ty CP Sản xuất và Kinh doanh VinFast\n* **Trạng thái hiện tại:** **Đã lưu kho**\n* **Vị trí lưu kho chi tiết:** \n  * **Tên kho:** Kho Tổng Logistics VinFast Hải Phòng\n  * **Vị trí cụ thể:** Kệ A1-01, Tầng 2, Phân khu Pin xe điện\n* **Điểm đến:** Nhà máy VinFast Cát Hải, Hải Phòng\n* **Đơn vị vận chuyển:** VinFast In-house Logistics\n* **Cập nhật lần cuối:** 10:30 - 13/09/2026",
    "latency_ms": 4340.53
  }
]
```

### 🔹 Trích đoạn 2: Test Case TC04 — Chuỗi suy luận ReAct đa bước (Multi-step Reasoning)
Kiểm tra tình trạng vận đơn `VN2026002` qua `track_shipment` (Step 1), nhận Observation đang vận chuyển đến Hà Nội $\rightarrow$ tự động kích hoạt Action tiếp theo gọi `update_order_status` chuyển trạng thái sang "Đang giao hàng" (Step 2) $\rightarrow$ tổng hợp Final Answer (Step 3):

```json
[
  {
    "step": 1,
    "action_type": "TOOL_EXECUTION",
    "tool_name": "track_shipment",
    "arguments": {
      "tracking_code": "VN2026002"
    },
    "observation": {
      "status": "SUCCESS",
      "tracking_code": "VN2026002",
      "shipment_data": {
        "order_id": "ORD-2026-002",
        "product_name": "Kiện linh kiện cảm biến LiDAR và cụm Camera 360 ADAS",
        "status": "Đang vận chuyển",
        "warehouse_location": "Khu vực xuất hàng XH-03, Cửa số 2",
        "destination": "Trung tâm R&D VinAI, Hà Nội"
      }
    },
    "latency_ms": 2564.48
  },
  {
    "step": 2,
    "action_type": "TOOL_EXECUTION",
    "tool_name": "update_order_status",
    "arguments": {
      "tracking_code": "VN2026002",
      "new_status": "Đang giao hàng",
      "warehouse_location": "Xe giao hàng Viettel Post Express - Hướng về Trung tâm R&D VinAI, Hà Nội",
      "note": "Chuẩn bị bàn giao cho Trung tâm R&D VinAI"
    },
    "observation": {
      "status": "SUCCESS",
      "tracking_code": "VN2026002",
      "new_status": "Đang giao hàng",
      "message": "Cập nhật thành công vận đơn [VN2026002]: Trạng thái mới -> 'Đang giao hàng' | Vị trí lưu kho mới -> 'Xe giao hàng Viettel Post Express - Hướng về Trung tâm R&D VinAI, Hà Nội' | Ghi chú: Chuẩn bị bàn giao cho Trung tâm R&D VinAI"
    },
    "latency_ms": 5069.85
  },
  {
    "step": 3,
    "action_type": "FINAL_ANSWER",
    "thought": "Gemini phản hồi trực tiếp bằng văn bản (không cần gọi công cụ).",
    "output": "Báo cáo kết quả: Kiện hàng VN2026002 (200 linh kiện LiDAR & Camera 360 ADAS) đã được kiểm tra và cập nhật trạng thái mới sang 'Đang giao hàng' trên xe giao hàng Viettel Post Express hướng về Trung tâm R&D VinAI tại Hà Nội.",
    "latency_ms": 8883.98
  }
]
```

---

## 3. TỔNG KẾT KẾT QUẢ NGHIỆM THU & NỘP BÀI

- [x] Đã điền API Key thật trong `.env` và xác nhận Agent chạy mượt mà trên LLM API thật (Gemini/OpenAI).
- **Tổng số Test Cases đã chạy thành công:** 5 / 5 test cases.
- **Số lượt gọi Tool qua MCP Server chính xác:** 5 lượt gọi Tool chuẩn xác (`track_shipment` và `update_order_status` qua giao thức MCP JSON-RPC).
- **Kết quả đẩy Repo nộp bài:** [x] Đã Commit và Push mã nguồn thành công lên GitHub cá nhân.

---

> ✅ **HOÀN TẤT NỘP BÀI:** Sao chép đường link GitHub Repository cá nhân của bạn và dán vào ô nộp bài trên hệ thống LMS VLearn để hoàn tất Bài Lab 3!
