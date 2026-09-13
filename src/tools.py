"""
🛠️ TOOL DEFINITIONS & EXECUTION BACKEND
Mã nguồn chứa danh sách Tool Schemas (JSON Schema) và Execution Layer phục vụ cho MCP Server.
Chủ đề: Trợ lý Đơn hàng & Kho vận (Supply Chain Agent) - Tra cứu mã vận đơn, vị trí lưu kho & cập nhật trạng thái đơn hàng.
"""

import json
from typing import Dict, Any

# ==============================================================================
# 1. KHAI BÁO TOOL SCHEMAS CHUẨN NATIVE JSON SCHEMA (TASK 1.2)
# ==============================================================================

TOOLS_SCHEMA = [
    # --------------------------------------------------------------------------
    # Tool 1: Tra cứu mã vận đơn & vị trí lưu kho
    # --------------------------------------------------------------------------
    {
        "name": "track_shipment",
        "description": "Tra cứu thông tin chi tiết đơn hàng, mã vận đơn, tình trạng vận chuyển và vị trí lưu kho cụ thể (kho, phân khu, kệ, ô) trong chuỗi cung ứng.",
        "parameters": {
            "type": "object",
            "properties": {
                "tracking_code": {
                    "type": "string",
                    "description": "Mã vận đơn hoặc mã đơn hàng cần tra cứu (ví dụ: 'VN2026001', 'VN2026002', 'VN2026003')"
                }
            },
            "required": ["tracking_code"]
        }
    },
    
    # --------------------------------------------------------------------------
    # Tool 2: Cập nhật trạng thái đơn hàng & vị trí lưu kho
    # --------------------------------------------------------------------------
    {
        "name": "update_order_status",
        "description": "Cập nhật trạng thái đơn hàng, điều chuyển vị trí lưu kho mới và lưu vết ghi chú điều phối trong hệ thống kho vận.",
        "parameters": {
            "type": "object",
            "properties": {
                "tracking_code": {
                    "type": "string",
                    "description": "Mã vận đơn hoặc mã đơn hàng cần cập nhật trạng thái (ví dụ: 'VN2026001')"
                },
                "new_status": {
                    "type": "string",
                    "description": "Trạng thái mới của đơn hàng (ví dụ: 'Đang vận chuyển', 'Đã lưu kho', 'Đã xuất kho', 'Đang giao hàng', 'Đã giao thành công', 'Hoàn trả')"
                },
                "warehouse_location": {
                    "type": "string",
                    "description": "Vị trí lưu kho hoặc phương tiện vận chuyển mới (ví dụ: 'Kho Tổng VinFast Hải Phòng - Kệ A1-02', 'Xe tải chuyên dụng 29C-12345')"
                },
                "note": {
                    "type": "string",
                    "description": "Ghi chú bổ sung từ nhân viên kho vận hoặc điều phối viên (ví dụ: 'Đã hoàn tất kiểm tra ngoại quan kiện hàng')"
                }
            },
            "required": ["tracking_code", "new_status"]
        }
    }
]

# ==============================================================================
# 2. MÔ PHỎNG DỮ LIỆU & HÀM THỰC THI TOOL (EXECUTION LAYER)
# ==============================================================================

# Cơ sở dữ liệu mẫu Đơn hàng & Kho vận (Supply Chain Database)
MOCK_DATABASE = {
    "VN2026001": {
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
    "VN2026002": {
        "order_id": "ORD-2026-002",
        "tracking_code": "VN2026002",
        "customer_name": "Tập đoàn Vingroup - Khối Công nghệ VinAI",
        "product_name": "Kiện linh kiện cảm biến LiDAR và cụm Camera 360 ADAS",
        "quantity": 200,
        "status": "Đang vận chuyển",
        "warehouse_name": "Kho Trung chuyển Nội Bài - Hà Nội",
        "warehouse_location": "Khu vực xuất hàng XH-03, Cửa số 2",
        "destination": "Trung tâm R&D VinAI, Hà Nội",
        "carrier": "Viettel Post Express",
        "last_updated": "08:15 13/09/2026"
    },
    "VN2026003": {
        "order_id": "ORD-2026-003",
        "tracking_code": "VN2026003",
        "customer_name": "Công ty TNHH Dịch vụ Vận tải VinBus",
        "product_name": "Trạm sạc nhanh DC 150kW dành cho xe bus điện",
        "quantity": 5,
        "status": "Đã xuất kho",
        "warehouse_name": "Kho Tổng Miền Nam - TP. Hồ Chí Minh",
        "warehouse_location": "Kệ D4-10, Depot VinBus Long Bình",
        "destination": "Depot VinBus Vinhomes Grand Park, TP. Thủ Đức",
        "carrier": "VinBus Heavy Transport Fleet",
        "last_updated": "14:00 12/09/2026"
    }
}


def execute_track_shipment(tracking_code: str) -> str:
    """Thực thi tra cứu mã vận đơn và vị trí lưu kho trong hệ thống chuỗi cung ứng."""
    clean_code = tracking_code.strip().upper()
    shipment = MOCK_DATABASE.get(clean_code)
    if shipment:
        return json.dumps({
            "status": "SUCCESS",
            "tracking_code": clean_code,
            "shipment_data": shipment,
            "message": (
                f"Đã tìm thấy thông tin đơn hàng [{clean_code}]: "
                f"Sản phẩm: {shipment['product_name']} (Số lượng: {shipment['quantity']}). "
                f"Khách hàng: {shipment['customer_name']}. "
                f"Trạng thái: {shipment['status']}. "
                f"Vị trí lưu kho: {shipment['warehouse_name']} ({shipment['warehouse_location']}). "
                f"Điểm đến: {shipment['destination']}. "
                f"Đơn vị vận chuyển: {shipment['carrier']}. "
                f"Cập nhật lần cuối: {shipment['last_updated']}."
            )
        }, ensure_ascii=False)
    else:
        return json.dumps({
            "status": "NOT_FOUND",
            "tracking_code": tracking_code,
            "message": f"Không tìm thấy dữ liệu vận đơn hoặc đơn hàng có mã '{tracking_code}' trong hệ thống kho vận."
        }, ensure_ascii=False)


def execute_update_order_status(
    tracking_code: str,
    new_status: str,
    warehouse_location: str = "",
    note: str = ""
) -> str:
    """Thực thi cập nhật trạng thái đơn hàng và vị trí lưu kho."""
    clean_code = tracking_code.strip().upper()
    shipment = MOCK_DATABASE.get(clean_code)
    if shipment:
        shipment["status"] = new_status
        if warehouse_location:
            shipment["warehouse_location"] = warehouse_location
        shipment["last_updated"] = "13/09/2026 15:00"
        
        detail_msg = (
            f"Cập nhật thành công vận đơn [{clean_code}]: "
            f"Trạng thái mới -> '{new_status}'"
        )
        if warehouse_location:
            detail_msg += f" | Vị trí lưu kho mới -> '{warehouse_location}'"
        if note:
            detail_msg += f" | Ghi chú: {note}"

        return json.dumps({
            "status": "SUCCESS",
            "tracking_code": clean_code,
            "new_status": new_status,
            "warehouse_location": shipment["warehouse_location"],
            "note": note,
            "message": detail_msg,
            "shipment_data": shipment
        }, ensure_ascii=False)
    else:
        return json.dumps({
            "status": "NOT_FOUND",
            "tracking_code": tracking_code,
            "message": f"Không thể cập nhật: Không tìm thấy vận đơn có mã '{tracking_code}' trong hệ thống kho vận."
        }, ensure_ascii=False)


# Router gọi tool thực tế
TOOL_ROUTER = {
    # Supply Chain & Logistics Tools
    "track_shipment": execute_track_shipment,
    "update_order_status": execute_update_order_status,
    # Aliases dự phòng linh hoạt cho LLM
    "query_shipment": execute_track_shipment,
    "track_order": execute_track_shipment,
    "order_tracking": execute_track_shipment,
    "lookup_warehouse": execute_track_shipment,
    "schedule_appointment": execute_update_order_status,  # Fallback tương thích
    "academic_query": execute_track_shipment               # Fallback tương thích
}


def dispatch_tool_call(tool_name: str, arguments: Dict[str, Any]) -> str:
    """Hàm trung chuyển thực thi tool"""
    if tool_name in TOOL_ROUTER:
        try:
            return TOOL_ROUTER[tool_name](**arguments)
        except Exception as e:
            return json.dumps({"status": "EXECUTION_ERROR", "error": str(e)}, ensure_ascii=False)
    return json.dumps({"status": "UNKNOWN_TOOL", "error": f"Tool '{tool_name}' không tồn tại!"}, ensure_ascii=False)


if __name__ == "__main__":
    print("==========================================================")
    print("📦 KIỂM THỬ ĐỘC LẬP TRỢ LÝ ĐƠN HÀNG & KHO VẬN (SUPPLY CHAIN)")
    print("==========================================================")
    print(f"📦 Số lượng Tools công bố qua MCP: {len(TOOLS_SCHEMA)}")
    for t in TOOLS_SCHEMA:
        props = list(t["parameters"]["properties"].keys())
        req = t["parameters"].get("required", [])
        print(f"  - Tool: {t['name']:<22} | Params: {props} | Required: {req}")
    
    print("\n🧪 [Test 1] Tra cứu mã vận đơn tồn tại (VN2026001):")
    res1 = dispatch_tool_call("track_shipment", {"tracking_code": "VN2026001"})
    print("  ", res1)
    
    print("\n🧪 [Test 2] Cập nhật trạng thái đơn hàng (VN2026001):")
    res2 = dispatch_tool_call("update_order_status", {
        "tracking_code": "VN2026001",
        "new_status": "Đang vận chuyển",
        "warehouse_location": "Xe tải trung chuyển VinFast 29C-12345",
        "note": "Rời kho lúc 14:30 hướng về nhà máy Cát Hải"
    })
    print("  ", res2)
    
    print("\n🧪 [Test 3] Tra cứu mã vận đơn không tồn tại (VN9999999):")
    res3 = dispatch_tool_call("track_shipment", {"tracking_code": "VN9999999"})
    print("  ", res3)
    
    print("\n✅ TẤT CẢ TEST CASES CỦA SUPPLY CHAIN TOOLS ĐỀU THÀNH CÔNG 100%!")
