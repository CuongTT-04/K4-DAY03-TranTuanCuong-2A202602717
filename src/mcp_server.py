"""
🔌 MODEL CONTEXT PROTOCOL (MCP) SERVER MODULE
Mô phỏng kiến trúc MCP Server (Client-Server Architecture) cung cấp công cụ chuẩn hóa.
"""

import json
import sys
from typing import Dict, Any, List
from tools import TOOLS_SCHEMA, dispatch_tool_call

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

class MCPAcademicServer:
    """
    Giả lập MCP Server tuân thủ chuẩn giao thức Model Context Protocol
    """
    def __init__(self, server_name: str = "vinuni-supply-chain-mcp-server"):
        self.server_name = server_name
        self.version = "2026.1.0"
        
    def list_tools(self) -> List[Dict[str, Any]]:
        """Trả về danh sách các Tools chuẩn giao thức MCP"""
        return TOOLS_SCHEMA
        
    def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """
        [TASK 2.1] HỌC VIÊN HOÀN THIỆN HÀM THỰC THI TOOL TRÊN MCP SERVER
        Thực thi request gọi Tool theo chuẩn MCP JSON-RPC
        """
        # 1. Gọi hàm dispatch_tool_call để lấy chuỗi JSON kết quả từ Tool Router
        raw_result = dispatch_tool_call(tool_name, arguments)
        
        # 2. Chuyển đổi chuỗi JSON kết quả thành Python Dictionary
        try:
            content = json.loads(raw_result)
        except Exception:
            content = {"status": "PARSE_ERROR", "raw_output": raw_result}

        # 3. Đóng gói phản hồi và trả về Dict theo đúng chuẩn giao thức MCP JSON-RPC 2.0
        return {
            "jsonrpc": "2.0",
            "server": self.server_name,
            "tool": tool_name,
            "result": content
        }


# Alias phục vụ đề tài Trợ lý Đơn hàng & Kho vận
MCPSupplyChainServer = MCPAcademicServer

if __name__ == "__main__":
    print("==========================================================")
    print("🔌 KIỂM THỬ ĐỘC LẬP MCP SERVER (vinuni-supply-chain-mcp-server)")
    print("==========================================================")
    
    server = MCPAcademicServer()
    tools = server.list_tools()
    print(f"✅ Khởi tạo thành công MCP Server: {server.server_name} (Version: {server.version})")
    print(f"📦 Số lượng Tools công bố qua MCP: {len(tools)}")
    
    # Kiểm tra trạng thái TODO 1.2 (Tool Schema)
    action_tool = next((t for t in tools if t.get("name") in ["update_order_status", "schedule_appointment"]), tools[0] if tools else None)
    if action_tool and not action_tool.get("parameters", {}).get("properties"):
        print(f"⏳ [TODO 1.2]: Tool '{action_tool.get('name')}' chưa được định nghĩa properties trong 'src/tools.py'.")
    else:
        tool_name_display = action_tool.get("name") if action_tool else "update_order_status"
        print(f"✅ [TODO 1.2]: Tool '{tool_name_display}' đã có schema đầy đủ.")

    # Kiểm tra trạng thái TODO 2.1 (call_tool)
    test_tool_name = "track_shipment" if any(t.get("name") == "track_shipment" for t in tools) else "academic_query"
    test_payload = {"tracking_code": "VN2026001"} if test_tool_name == "track_shipment" else {"student_id": "SV2026001"}
    test_result = server.call_tool(test_tool_name, test_payload)
    if not test_result:
        print("⏳ [TODO 2.1]: Hàm call_tool() đang trả về rỗng. Học viên hãy hoàn thiện TODO 2.1 trong 'src/mcp_server.py'!")
    else:
        print(f"✅ [TODO 2.1]: Test dispatch tool '{test_tool_name}' thành công:")
        print(f"   Phản hồi JSON-RPC: {json.dumps(test_result, ensure_ascii=False)}")
