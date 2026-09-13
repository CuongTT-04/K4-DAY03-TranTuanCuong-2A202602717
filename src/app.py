"""
🚀 CORE AGENT APPLICATION (DAY 03: CHATBOT VS REACT AGENT)
Thực thi so sánh giữa Chatbot Baseline (Cấp 2) và ReAct Agent kết nối MCP Server (Cấp 3).
Chủ đề: Trợ lý Đơn hàng & Kho vận (Supply Chain Agent) - VinGroup / VinFast Logistics.
"""

import json
import os
import sys
import time
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from mcp_server import MCPAcademicServer, MCPSupplyChainServer
from prompts import (
    CHATBOT_BASELINE_PROMPT,
    REACT_AGENT_SYSTEM_PROMPT,
    MAX_ITERATIONS
)
from providers import get_llm_provider

load_dotenv()

def load_test_cases():
    """Tải danh sách 5 test cases từ config/test_cases.json hoặc config/test_cases.example.json"""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    config_path = os.path.join(base_dir, "config", "test_cases.json")
    if not os.path.exists(config_path):
        example_path = os.path.join(base_dir, "config", "test_cases.example.json")
        if os.path.exists(example_path):
            print("⚠️ [CONFIG NOTICE]: Chưa thấy file 'config/test_cases.json'. Đang dùng mẫu 'config/test_cases.example.json'.")
            config_path = example_path
        else:
            config_path = "test_cases.json"
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_waterfall_trace(trace_data: list):
    """Ghi vết log Waterfall Trace Log ra file docs/trace_waterfall.json"""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    docs_dir = os.path.join(base_dir, "docs")
    os.makedirs(docs_dir, exist_ok=True)
    trace_path = os.path.join(docs_dir, "trace_waterfall.json")
    with open(trace_path, "w", encoding="utf-8") as f:
        json.dump(trace_data, f, ensure_ascii=False, indent=2)
    print(f"📊 [OBSERVABILITY]: Đã lưu {len(trace_data)} sự kiện Waterfall Trace tại '{trace_path}'!")


def run_baseline_chatbot(user_query: str, provider):
    """Chạy Chatbot gốc (Cấp 2) không có công cụ gọi Tool"""
    print(f"\n💬 [CHATBOT BASELINE] Câu hỏi: {user_query}")
    response = provider.generate(user_query, system_prompt=CHATBOT_BASELINE_PROMPT)
    print(f"🤖 Chatbot phản hồi:\n{response}")
    return response


def run_react_agent(user_query: str, provider, mcp_server: MCPAcademicServer) -> list:
    """
    [REACT AGENT LOOP] Thực thi vòng lặp Thought -> Action -> Observation với MCP Server.
    Hỗ trợ Native Tool Calling và suy luận đa bước (Multi-step Reasoning).
    Trả về danh sách trace log của phiên thực thi.
    """
    print(f"\n🤖 [REACT AGENT] Câu hỏi: {user_query}")
    
    step = 0
    trace_logs = []
    tools_list = mcp_server.list_tools()
    
    # Ngữ cảnh ReAct Loop tích lũy chuỗi Thought -> Action -> Observation
    current_context = user_query
    last_observation = None

    while step < MAX_ITERATIONS:
        step += 1
        step_start_time = time.time()
        print(f"\n--- 🔄 Vòng lặp ReAct Loop (Step {step}/{MAX_ITERATIONS}) ---")
        
        # 1. THOUGHT & ACTION PROPOSAL: Gọi LLM với Native Tool Calling Specs
        llm_response = provider.generate_with_tools(
            current_context,
            tools_list,
            system_prompt=REACT_AGENT_SYSTEM_PROMPT
        )
        latency_ms = round((time.time() - step_start_time) * 1000, 2)
        
        thought = llm_response.get("thought", "Đang phân tích và suy luận yêu cầu...")
        print(f"🧠 [Thought]: {thought}")
        
        # TRƯỜNG HỢP 1: LLM quyết định trả lời bằng văn bản (Final Answer)
        if llm_response.get("type") == "text":
            final_content = llm_response.get("content", "").strip()
            print(f"🏁 [Final Answer]: {final_content}")
            trace_logs.append({
                "step": step,
                "query": user_query,
                "action_type": "FINAL_ANSWER",
                "thought": thought,
                "output": final_content,
                "latency_ms": latency_ms
            })
            break
            
        # TRƯỜNG HỢP 2: LLM đề xuất gọi Tool (Action)
        elif llm_response.get("type") == "tool_call":
            tool_name = llm_response.get("tool_name")
            arguments = llm_response.get("arguments", {})
            
            print(f"🛠️ [Action Proposed]: {tool_name}({json.dumps(arguments, ensure_ascii=False)})")
            
            # 2. ACTION EXECUTION: Thực thi Tool qua giao thức MCP Server
            mcp_result = mcp_server.call_tool(tool_name, arguments)
            obs_data = mcp_result.get("result", {})
            last_observation = obs_data
            
            obs_str = json.dumps(obs_data, ensure_ascii=False)
            print(f"👁️ [Observation từ MCP Server]: {obs_str}")
            
            # Ghi vết TOOL_EXECUTION vào Waterfall Trace Log
            trace_logs.append({
                "step": step,
                "query": user_query,
                "action_type": "TOOL_EXECUTION",
                "tool_name": tool_name,
                "arguments": arguments,
                "observation": obs_data,
                "latency_ms": latency_ms
            })
            
            # 3. NẠP OBSERVATION VÀO NGỮ CẢNH ĐỂ TIẾP TỤC VÒNG LẶP SUY LUẬN REACT
            current_context += (
                f"\n\n[Thought]: {thought}"
                f"\n[Action Proposed]: Gọi tool '{tool_name}' với tham số {json.dumps(arguments, ensure_ascii=False)}"
                f"\n[Observation từ MCP Server]: {obs_str}"
                f"\n[Yêu cầu ReAct]: Hãy phân tích kết quả Observation trên. Nếu cần thực hiện thêm bước khác, hãy tiếp tục đề xuất Action. "
                f"Nếu đã có đủ thông tin để trả lời, hãy đưa ra kết luận cuối cùng (Final Answer) đầy đủ cho người dùng."
            )

    # Nếu thoát vòng lặp mà chưa có bước FINAL_ANSWER, thực hiện tổng kết phản hồi cuối cùng
    if not any(log.get("action_type") == "FINAL_ANSWER" for log in trace_logs):
        step += 1
        synth_thought = "Tổng hợp kết quả từ các bước thực thi qua MCP Server để đưa ra phản hồi cuối cùng."
        if last_observation and "message" in last_observation:
            final_content = last_observation["message"]
        elif last_observation:
            final_content = f"Đã hoàn tất xử lý qua hệ thống kho vận MCP: {json.dumps(last_observation, ensure_ascii=False)}"
        else:
            final_content = "Đã hoàn thành phiên xử lý ReAct Agent."
            
        print(f"\n🧠 [Thought]: {synth_thought}")
        print(f"🏁 [Final Answer]: {final_content}")
        trace_logs.append({
            "step": step,
            "query": user_query,
            "action_type": "FINAL_ANSWER",
            "thought": synth_thought,
            "output": final_content,
            "latency_ms": 15.0
        })

    return trace_logs


if __name__ == "__main__":
    print("==========================================================")
    print("📦 VINUNI AI COURSE - DAY 03 LAB: CHATBOT VS REACT AGENT")
    print("🏢 CHỦ ĐỀ: TRỢ LÝ ĐƠN HÀNG & KHO VẬN (SUPPLY CHAIN AGENT)")
    print("==========================================================")
    
    provider = get_llm_provider()
    mcp_server = MCPSupplyChainServer()
    
    print(f"🔌 LLM Provider: {provider.__class__.__name__} ({getattr(provider, 'model_name', 'default')})")
    print(f"🌐 MCP Server: {mcp_server.server_name}\n")
    
    tests = load_test_cases()
    print(f"✅ Đã tải thành công {len(tests)} Test Cases thử nghiệm.\n")
    
    if "--interactive" in sys.argv:
        print("🎮 [INTERACTIVE MODE] Trò chuyện trực tiếp với ReAct Agent:")
        print("💡 Gợi ý câu hỏi thử nghiệm:")
        print("   - Câu hỏi chung: 'Quy trình kiểm soát chất lượng khi nhập kho hàng hóa?'")
        print("   - Tra cứu vận đơn: 'Hãy tra cứu thông tin mã vận đơn VN2026001'")
        print("   - Cập nhật đơn: 'Cập nhật trạng thái VN2026001 sang Đang vận chuyển'")
        print("   - Gõ 'exit' hoặc 'quit' để kết thúc phiên trò chuyện.\n")
        while True:
            try:
                user_input = input("👤 Điều phối viên hỏi: ").strip()
                if not user_input or user_input.lower() in ["exit", "quit"]:
                    print("👋 Tạm biệt! Kết thúc phiên trò chuyện.")
                    break
                logs = run_react_agent(user_input, provider, mcp_server)
                save_waterfall_trace(logs)
            except (KeyboardInterrupt, EOFError):
                print("\n👋 Đã thoát phiên tương tác.")
                break
    elif "--all" in sys.argv:
        print("🚀 [TEST SUITE MODE] Kiểm tra 5 Test Cases nghiệm thu:")
        completed_count = 0
        todo_count = 0
        all_traces = []
        
        for tc in tests:
            print(f"\n==================================================")
            print(f"🧪 [{tc['id']}] Loại test: {tc['type']} (Độ phức tạp: {tc['complexity']})")
            print(f"📌 Kỳ vọng: {tc['expected_behavior']}")
            
            if tc["question"].strip().startswith("TODO"):
                print(f"⏸️ [CHƯA KÍCH HOẠT - ĐANG LÀ TODO]:")
                print(f"   {tc['question']}")
                todo_count += 1
            else:
                logs = run_react_agent(tc["question"], provider, mcp_server)
                all_traces.extend(logs)
                completed_count += 1
                
        print(f"\n==================================================")
        print(f"📊 [KẾT QUẢ TEST SUITE]: Đã thực thi {completed_count}/{len(tests)} Test Cases | {todo_count} Test Cases đang chờ điền câu hỏi (TODO)")
        if all_traces:
            save_waterfall_trace(all_traces)
        print(f"💡 Để trò chuyện trực tiếp từng câu: Chạy 'python src/app.py --interactive'")
    else:
        # Chế độ mặc định khi chỉ gõ 'python src/app.py'
        print("ℹ️ HƯỚNG DẪN SỬ DỤNG CHƯƠNG TRÌNH:")
        print("  1. Chat trực tiếp liên tục:   python src/app.py --interactive")
        print("  2. Chạy toàn bộ Test Cases:    python src/app.py --all\n")
        
        sample_query = tests[1]["question"]
        print(f"--- 🏁 DEMO CHẠY THỬ 1 TEST CASE MẪU (TC02: Tra cứu vận đơn & vị trí kho) ---")
        logs = run_react_agent(sample_query, provider, mcp_server)
        save_waterfall_trace(logs)
        print("\n💡 Hãy thử ngay lệnh: python src/app.py --interactive để chat trực tiếp!")
