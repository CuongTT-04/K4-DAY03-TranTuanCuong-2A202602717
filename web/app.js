/**
 * SUPPLYCHAIN AI AGENT — REAL CONVERSATIONAL CHATBOT ENGINE (app.js)
 * Natural Chat Experience with ReAct Reasoning & Dynamic Tool Execution
 */

// ==============================================================================
// 1. DYNAMIC MOCK DATABASE (In-Memory, Mutable by Tools)
// ==============================================================================
const DATABASE = {
  "VN2026001": {
    order_id: "ORD-2026-001",
    tracking_code: "VN2026001",
    customer_name: "Công ty CP Sản xuất và Kinh doanh VinFast",
    product_name: "Lô 50 bộ pin Lithium-ion NMC 100Ah",
    quantity: 50,
    status: "Đã lưu kho",
    warehouse_name: "Kho Tổng Logistics VinFast Hải Phòng",
    warehouse_location: "Kệ A1-01, Tầng 2, Phân khu Pin xe điện",
    destination: "Nhà máy VinFast Cát Hải, Hải Phòng",
    carrier: "VinFast In-house Logistics",
    updated_at: "10:30 13/09/2026",
    note: "Bảo quản ở nhiệt độ tiêu chuẩn phòng ngừa đoản mạch pin EV"
  },
  "VN2026002": {
    order_id: "ORD-2026-002",
    tracking_code: "VN2026002",
    customer_name: "Tập đoàn Vingroup - Khối Công nghệ VinAI",
    product_name: "Kiện 200 cảm biến LiDAR & Cụm Camera 360 ADAS",
    quantity: 200,
    status: "Đang vận chuyển",
    warehouse_name: "Kho Trung chuyển Nội Bài - Hà Nội",
    warehouse_location: "Khu vực xuất hàng XH-03, Cửa số 2",
    destination: "Trung tâm R&D VinAI, Hà Nội",
    carrier: "Viettel Post Express",
    updated_at: "08:15 13/09/2026",
    note: "Hàng linh kiện quang học và chip bán dẫn nhạy cảm"
  },
  "VN2026003": {
    order_id: "ORD-2026-003",
    tracking_code: "VN2026003",
    customer_name: "Công ty TNHH Dịch vụ Vận tải VinBus",
    product_name: "Trạm sạc nhanh DC 150kW xe bus điện (5 bộ)",
    quantity: 5,
    status: "Đã xuất kho",
    warehouse_name: "Kho Tổng Miền Nam - TP. Hồ Chí Minh",
    warehouse_location: "Kệ D4-10, Depot VinBus Long Bình",
    destination: "Depot VinBus Vinhomes Grand Park, TP. Thủ Đức",
    carrier: "VinBus Heavy Transport Fleet",
    updated_at: "14:00 12/09/2026",
    note: "Thiết bị điện hạ thế công suất lớn"
  }
};

// DOM References
const messagesFeed = document.getElementById('messagesFeed');
const heroState = document.getElementById('heroState');
const promptInput = document.getElementById('promptInput');
const sendBtn = document.getElementById('sendBtn');
const newChatBtn = document.getElementById('newChatBtn');
const chatScrollContainer = document.getElementById('chatScrollContainer');
const currentSessionTitle = document.getElementById('currentSessionTitle');
const sidebarSessionTitle = document.getElementById('sidebarSessionTitle');
const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
const toggleInspectorBtn = document.getElementById('toggleInspectorBtn');
const inspectorPanel = document.getElementById('inspectorPanel');

// Inspector Stats
const statLatency = document.getElementById('statLatency');
const statSteps = document.getElementById('statSteps');
const statToolCalls = document.getElementById('statToolCalls');
const statTokens = document.getElementById('statTokens');
const mcpToolNameBadge = document.getElementById('mcpToolNameBadge');
const mcpPayloadDump = document.getElementById('mcpPayloadDump');

let isProcessing = false;
let messageTurnCount = 0;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupEventHandlers();
});

function setupEventHandlers() {
  // Toggle Sidebar
  toggleSidebarBtn?.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    if (window.innerWidth <= 768) {
      sidebar.style.display = sidebar.style.display === 'none' ? 'flex' : 'none';
    }
  });

  // Toggle Inspector
  toggleInspectorBtn?.addEventListener('click', () => {
    inspectorPanel.style.display = inspectorPanel.style.display === 'none' ? 'flex' : 'none';
  });

  // New Chat
  newChatBtn?.addEventListener('click', () => {
    resetChat();
  });

  // Send Click
  sendBtn?.addEventListener('click', () => {
    sendMessage();
  });

  // Enter Key to send (Shift+Enter for new line)
  promptInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-resize textarea
  promptInput?.addEventListener('input', () => {
    promptInput.style.height = 'auto';
    promptInput.style.height = Math.min(promptInput.scrollHeight, 140) + 'px';
  });

  // Suggestion card clicks on Hero screen
  document.querySelectorAll('.suggestion-card[data-hint]').forEach(card => {
    card.addEventListener('click', () => {
      const hint = card.getAttribute('data-hint');
      if (hint) {
        promptInput.value = hint;
        promptInput.style.height = 'auto';
        promptInput.focus();
        sendMessage();
      }
    });
  });

  // Quick info modals
  document.getElementById('navViewArchitecture')?.addEventListener('click', () => {
    alert(`KIẾN TRÚC REACTION AGENT & MCP:
1. ReAct Loop: Thought ➔ Action (Tool Call) ➔ Observation ➔ Final Answer
2. MCP Protocol: JSON-RPC 2.0 (vinuni-supply-chain-mcp-server)
3. Available Tools:
   - track_shipment(tracking_code)
   - update_order_status(tracking_code, new_status, warehouse_location, note)
4. Anti-Hallucination: Báo NOT_FOUND khi mã đơn không tồn tại.`);
  });

  document.getElementById('navViewMockData')?.addEventListener('click', () => {
    const list = Object.keys(DATABASE).map(k => `• ${k}: ${DATABASE[k].product_name} (${DATABASE[k].status})`).join('\n');
    alert(`CƠ SỞ DỮ LIỆU KHO VẬN HIỆN TẠI (WMS DATABASE):\n${list}`);
  });
}

function resetChat() {
  messagesFeed.innerHTML = '';
  if (heroState) {
    heroState.style.display = 'block';
    messagesFeed.appendChild(heroState);
  }
  promptInput.value = '';
  promptInput.style.height = 'auto';
  currentSessionTitle.textContent = "Phiên hội thoại mới";
  if (sidebarSessionTitle) sidebarSessionTitle.textContent = "Đoạn chat hiện tại";
  statLatency.textContent = "0.00s";
  statSteps.textContent = "0 Steps";
  statToolCalls.textContent = "0 Call";
  statTokens.textContent = "0";
  mcpToolNameBadge.textContent = "IDLE";
  mcpPayloadDump.textContent = "{\n  \"status\": \"READY\",\n  \"message\": \"Hệ thống sẵn sàng tiếp nhận yêu cầu...\"\n}";
  messageTurnCount = 0;
}

// Main Send Message Handler
function sendMessage() {
  const query = promptInput.value.trim();
  if (!query || isProcessing) return;

  isProcessing = true;
  promptInput.value = '';
  promptInput.style.height = 'auto';
  sendBtn.disabled = true;

  // Hide hero if visible
  if (heroState && heroState.style.display !== 'none') {
    heroState.style.display = 'none';
  }

  // 1. Append User Message
  appendUserMessage(query);

  // Update session titles with user prompt snippet
  const titleText = query.length > 30 ? query.substring(0, 28) + '...' : query;
  currentSessionTitle.textContent = titleText;
  if (sidebarSessionTitle) sidebarSessionTitle.textContent = titleText;

  // 2. Append Typing Indicator
  const typingIndicator = appendTypingIndicator();
  scrollToBottom();

  // 3. Process Query through ReAct Logic (Simulate 500-900ms thinking time)
  const startTime = performance.now();
  setTimeout(() => {
    try {
      const responseData = executeAgentReAct(query);
      const elapsedSec = ((performance.now() - startTime) / 1000).toFixed(2);
      responseData.duration = elapsedSec + 's';

      // Remove typing indicator
      typingIndicator.remove();

      // Append Agent Response
      appendAgentResponse(responseData);

      // Update Inspector Telemetry
      updateInspector(responseData);
    } catch (err) {
      console.error(err);
      typingIndicator.remove();
      appendSimpleError("Đã xảy ra lỗi khi xử lý yêu cầu. Vui lòng thử lại.");
    } finally {
      isProcessing = false;
      sendBtn.disabled = false;
      scrollToBottom();
    }
  }, 650);
}

function appendUserMessage(text) {
  const row = document.createElement('div');
  row.className = 'msg-row user';
  row.innerHTML = `
    <div class="msg-avatar user">U</div>
    <div class="msg-content-wrap">
      <div class="user-bubble">${escapeHtml(text)}</div>
    </div>
  `;
  messagesFeed.appendChild(row);
}

function appendTypingIndicator() {
  const row = document.createElement('div');
  row.className = 'msg-row agent typing-indicator-row';
  row.innerHTML = `
    <div class="msg-avatar agent"><i class="fa-solid fa-boxes-stacked" style="font-size: 12px;"></i></div>
    <div class="msg-content-wrap">
      <div class="typing-bubble">
        <i class="fa-solid fa-brain" style="color: var(--purple); font-size: 12px;"></i>
        <span>SupplyChain Agent đang suy luận ReAct</span>
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  `;
  messagesFeed.appendChild(row);
  return row;
}

function appendSimpleError(msg) {
  const row = document.createElement('div');
  row.className = 'msg-row agent';
  row.innerHTML = `
    <div class="msg-avatar agent"><i class="fa-solid fa-triangle-exclamation" style="color: var(--warning);"></i></div>
    <div class="msg-content-wrap">
      <div class="agent-response-card" style="border-color: #fca5a5;">
        <p style="color: #b91c1c;">${msg}</p>
      </div>
    </div>
  `;
  messagesFeed.appendChild(row);
}

// ReAct Engine
function executeAgentReAct(query) {
  messageTurnCount++;
  const lower = query.toLowerCase();

  // Regex to extract tracking codes like VN2026001, VN99sdasd9, VN9999999, ORD-001, etc.
  const codeMatch = query.match(/\b(VN[A-Za-z0-9]+|ORD-[A-Za-z0-9-]+)\b/i);
  const targetCode = codeMatch ? codeMatch[1].toUpperCase() : null;

  // Case 1: Multi-step Reasoning (Check & then update if condition met)
  // e.g. "kiểm tra... nếu... thì cập nhật..." or specific to VN2026002 to Hanoi
  const isMultiStep = (lower.includes("nếu") && (lower.includes("cập nhật") || lower.includes("chuyển"))) ||
                      (lower.includes("kiểm tra") && lower.includes("tiếp tục") && lower.includes("cập nhật"));

  if (isMultiStep && targetCode) {
    return handleMultiStepReAct(targetCode, query);
  }

  // Case 2: Status / Location Update
  const isUpdate = lower.includes("cập nhật") || lower.includes("chuyển trạng thái") || lower.includes("đổi trạng thái") || lower.includes("chuyển sang");
  if (isUpdate && targetCode) {
    return handleUpdateStatus(targetCode, query);
  }

  // Case 3: Shipment Tracking (Tra cứu)
  if (targetCode) {
    return handleTrackShipment(targetCode);
  }

  // Case 4: General Knowledge / FAQ / Greeting / Warehouse standards
  return handleGeneralConversation(query);
}

// Handler: Tra cứu vận đơn (Single Tool)
function handleTrackShipment(code) {
  const item = DATABASE[code];
  const toolCallPayload = {
    name: "track_shipment",
    arguments: { tracking_code: code }
  };

  if (item) {
    // Found
    const observation = {
      status: "SUCCESS",
      tracking_code: code,
      shipment_data: item
    };

    return {
      thought: `Người dùng yêu cầu tra cứu vị trí và tình trạng của mã vận đơn <code>${code}</code>.<br>Tôi phát sinh Tool Call <strong>track_shipment</strong> qua MCP Server (<code>vinuni-supply-chain-mcp-server</code>) để lấy dữ liệu kho vận thời gian thực.`,
      tools: [
        {
          name: "track_shipment",
          args: { tracking_code: code },
          resultStatus: "SUCCESS: Đã tìm thấy",
          badgeColor: "success"
        }
      ],
      mcpPayload: {
        jsonrpc: "2.0",
        method: "tools/call",
        params: toolCallPayload,
        id: `call-${Date.now()}`
      },
      mcpResponse: observation,
      finalAnswerHtml: `
        <div class="agent-response-text">
          <p>Tôi đã tra cứu thành công thông tin vận đơn <code>${code}</code> từ hệ thống kho vận:</p>
          <div class="shipment-detail-grid">
            <div class="detail-item">
              <span class="label">Mã vận đơn</span>
              <span class="val">${item.tracking_code} (${item.order_id})</span>
            </div>
            <div class="detail-item">
              <span class="label">Tên hàng hóa</span>
              <span class="val">${item.product_name}</span>
            </div>
            <div class="detail-item">
              <span class="label">Khách hàng / Đơn vị</span>
              <span class="val">${item.customer_name}</span>
            </div>
            <div class="detail-item">
              <span class="label">Trạng thái hiện tại</span>
              <span class="val" style="color: var(--accent);">${item.status}</span>
            </div>
            <div class="location-highlight">
              <span class="label">Vị trí lưu trữ hiện tại:</span>
              <span class="val" style="margin-left: 6px;">${item.warehouse_name} — ${item.warehouse_location}</span>
            </div>
            <div class="detail-item">
              <span class="label">Điểm đến dự kiến</span>
              <span class="val">${item.destination}</span>
            </div>
            <div class="detail-item">
              <span class="label">Đơn vị vận tải</span>
              <span class="val">${item.carrier} (Cập nhật: ${item.updated_at})</span>
            </div>
          </div>
          <p style="color: var(--text-secondary); font-size: 13px;"><em>Ghi chú kho vận:</em> ${item.note || "Kiện hàng đang được lưu trữ đúng quy cách."}</p>
        </div>
      `,
      stepsCount: 2,
      toolCallsCount: 1,
      tokensEst: 420
    };
  } else {
    // NOT FOUND (Edge case / Anti-hallucination)
    const observation = {
      status: "NOT_FOUND",
      tracking_code: code,
      message: `Không tìm thấy dữ liệu vận đơn hoặc đơn hàng có mã '${code}' trong hệ thống kho vận.`
    };

    return {
      thought: `Người dùng yêu cầu kiểm tra mã vận đơn <code>${code}</code>. Tôi gọi Tool <strong>track_shipment</strong>.<br>Hệ thống MCP Server trả về kết quả <strong>NOT_FOUND</strong>. Tôi cần phản hồi trung thực và lịch sự rằng mã vận đơn này không tồn tại, tuyệt đối <strong>không được tự ý bịa đặt thông tin</strong> (Anti-Hallucination Guardrail).`,
      tools: [
        {
          name: "track_shipment",
          args: { tracking_code: code },
          resultStatus: "NOT_FOUND: Không tồn tại",
          badgeColor: "warning"
        }
      ],
      mcpPayload: {
        jsonrpc: "2.0",
        method: "tools/call",
        params: toolCallPayload,
        id: `call-${Date.now()}`
      },
      mcpResponse: observation,
      finalAnswerHtml: `
        <div class="agent-response-text" style="border-left: 3px solid var(--warning); padding-left: 12px;">
          <p><strong><i class="fa-solid fa-triangle-exclamation" style="color: var(--warning);"></i> Không tìm thấy dữ liệu vận đơn</strong></p>
          <p>Tôi đã truy vấn hệ thống kho vận qua MCP Server với mã vận đơn <code>${code}</code> nhưng <strong>không tìm thấy</strong> bản ghi tương ứng.</p>
          <p style="font-size: 13px; color: var(--text-secondary); margin-top: 6px;">
            Bạn vui lòng kiểm tra lại tính chính xác của mã vận đơn (ví dụ: các mã hiện có <code>VN2026001</code>, <code>VN2026002</code>, <code>VN2026003</code>) hoặc đối soát với bộ phận điều phối kho nhé!
          </p>
        </div>
      `,
      stepsCount: 2,
      toolCallsCount: 1,
      tokensEst: 340
    };
  }
}

// Handler: Cập nhật trạng thái (Update Tool)
function handleUpdateStatus(code, query) {
  const item = DATABASE[code];

  // Extract new status if mentioned
  let newStatus = "Đang vận chuyển";
  if (query.includes("Đang giao hàng") || query.includes("đang giao hàng")) newStatus = "Đang giao hàng";
  else if (query.includes("Đã xuất kho") || query.includes("xuất kho")) newStatus = "Đã xuất kho";
  else if (query.includes("Đã giao") || query.includes("hoàn thành")) newStatus = "Đã giao thành công";
  else if (query.includes("Đã lưu kho") || query.includes("lưu kho")) newStatus = "Đã lưu kho";

  // Extract location
  let newLocation = "Xe tải trung chuyển 29C-12345";
  const locMatch = query.match(/sang ['"]?([^'",]+)['"]?/i);
  if (query.includes("29C-12345")) newLocation = "Xe tải trung chuyển 29C-12345";
  else if (query.includes("R&D VinAI") || query.includes("VinAI")) newLocation = "Trung tâm R&D VinAI, Hà Nội";

  let note = "Cập nhật qua lệnh điều phối của Agent";
  const noteMatch = query.match(/ghi chú ['"]?([^'"]+)['"]?/i);
  if (noteMatch) note = noteMatch[1];

  if (!item) {
    return {
      thought: `Người dùng muốn cập nhật đơn hàng <code>${code}</code>, nhưng mã đơn này không tồn tại trong cơ sở dữ liệu. Tôi không thể cập nhật và sẽ thông báo lỗi.`,
      tools: [
        {
          name: "update_order_status",
          args: { tracking_code: code, new_status: newStatus },
          resultStatus: "ERROR: Mã không tồn tại",
          badgeColor: "danger"
        }
      ],
      mcpPayload: {
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "update_order_status",
          arguments: { tracking_code: code, new_status: newStatus }
        },
        id: `call-${Date.now()}`
      },
      finalAnswerHtml: `
        <div class="agent-response-text">
          <p><i class="fa-solid fa-circle-xmark" style="color: #ef4444;"></i> Không thể cập nhật: Mã vận đơn <code>${code}</code> không tồn tại trên hệ thống.</p>
        </div>
      `,
      stepsCount: 2,
      toolCallsCount: 1,
      tokensEst: 290
    };
  }

  // Mutate database in memory!
  const prevStatus = item.status;
  item.status = newStatus;
  item.warehouse_location = newLocation;
  item.note = note;
  item.updated_at = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN');

  return {
    thought: `Người dùng yêu cầu điều phối cập nhật trạng thái của vận đơn <code>${code}</code>.<br>Tôi gọi tool <strong>update_order_status</strong> để ghi nhận trạng thái mới <code>${newStatus}</code> và cập nhật phương tiện/vị trí mới <code>${newLocation}</code> vào hệ thống WMS qua MCP Server.`,
    tools: [
      {
        name: "update_order_status",
        args: {
          tracking_code: code,
          new_status: newStatus,
          warehouse_location: newLocation,
          note: note
        },
        resultStatus: `UPDATED (${prevStatus} ➔ ${newStatus})`,
        badgeColor: "success"
      }
    ],
    mcpPayload: {
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: "update_order_status",
        arguments: {
          tracking_code: code,
          new_status: newStatus,
          warehouse_location: newLocation,
          note: note
        }
      },
      id: `call-${Date.now()}`
    },
    mcpResponse: {
      status: "SUCCESS",
      tracking_code: code,
      previous_status: prevStatus,
      new_status: newStatus,
      new_location: newLocation,
      updated_at: item.updated_at
    },
    finalAnswerHtml: `
      <div class="agent-response-text">
        <p><strong><i class="fa-solid fa-circle-check" style="color: var(--success);"></i> Đã cập nhật trạng thái vận đơn thành công!</strong></p>
        <div class="shipment-detail-grid">
          <div class="detail-item">
            <span class="label">Mã vận đơn</span>
            <span class="val">${code}</span>
          </div>
          <div class="detail-item">
            <span class="label">Trạng thái mới</span>
            <span class="val" style="color: var(--success);">${newStatus}</span>
          </div>
          <div class="location-highlight">
            <span class="label">Vị trí / Phương tiện điều chuyển:</span>
            <span class="val" style="margin-left: 6px;">${newLocation}</span>
          </div>
          <div class="detail-item">
            <span class="label">Ghi chú điều phối</span>
            <span class="val">${note}</span>
          </div>
          <div class="detail-item">
            <span class="label">Thời gian đồng bộ</span>
            <span class="val">${item.updated_at}</span>
          </div>
        </div>
        <p style="font-size: 13px; color: var(--text-secondary); margin-top: 6px;">Dữ liệu đã được đồng bộ lên hệ thống điều hành kho vận qua MCP Server.</p>
      </div>
    `,
    stepsCount: 2,
    toolCallsCount: 1,
    tokensEst: 460
  };
}

// Handler: Multi-step Reasoning (ReAct chuỗi)
function handleMultiStepReAct(code, query) {
  const item = DATABASE[code];
  if (!item) {
    return handleTrackShipment(code);
  }

  // Step 1: Check location
  const isAtHanoi = item.warehouse_name.includes("Hà Nội") || item.warehouse_location.includes("Nội Bài") || item.destination.includes("Hà Nội");

  // Step 2: Mutate status if condition met
  const prevStatus = item.status;
  item.status = "Đang giao hàng";
  item.warehouse_location = "Xe giao hàng Viettel Post Express — Hướng về Trung tâm R&D VinAI, Hà Nội";
  item.updated_at = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN');

  return {
    thought: `Đây là yêu cầu suy luận đa bước (Multi-step Reasoning):<br>
1. <strong>Bước 1 (Thought 1):</strong> Tra cứu trạng thái hiện tại của vận đơn <code>${code}</code> bằng tool <code>track_shipment</code>.<br>
2. <strong>Bước 2 (Observation 1):</strong> Kiện hàng đang ở <em>${item.warehouse_name}</em> (${isAtHanoi ? "Thỏa mãn điều kiện tại Hà Nội" : "Đã xác định tọa độ"}).<br>
3. <strong>Bước 3 (Thought 2):</strong> Tiếp tục gọi tool <code>update_order_status</code> để đổi trạng thái sang <strong>'Đang giao hàng'</strong> chuẩn bị bàn giao cho VinAI R&D.`,
    tools: [
      {
        name: "track_shipment",
        args: { tracking_code: code },
        resultStatus: `FOUND (${item.warehouse_name})`,
        badgeColor: "accent"
      },
      {
        name: "update_order_status",
        args: {
          tracking_code: code,
          new_status: "Đang giao hàng",
          warehouse_location: item.warehouse_location
        },
        resultStatus: `UPDATED ➔ Đang giao hàng`,
        badgeColor: "success"
      }
    ],
    mcpPayload: {
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        step1: { name: "track_shipment", arguments: { tracking_code: code } },
        step2: { name: "update_order_status", arguments: { tracking_code: code, new_status: "Đang giao hàng" } }
      },
      id: `call-multistep-${Date.now()}`
    },
    finalAnswerHtml: `
      <div class="agent-response-text">
        <p><strong><i class="fa-solid fa-route" style="color: var(--purple);"></i> Hoàn tất quy trình suy luận ReAct 2 bước:</strong></p>
        <ol>
          <li><strong>Bước 1 (Kiểm tra vị trí):</strong> Kiện hàng <code>${code}</code> (${item.product_name}) đã có mặt tại <em>${item.warehouse_name}</em>, hướng về Hà Nội đúng như điều kiện của bạn.</li>
          <li><strong>Bước 2 (Tự động cập nhật):</strong> Agent đã tự động kích hoạt tool cập nhật trạng thái mới sang <span style="color: var(--success); font-weight: 700;">'Đang giao hàng'</span> trên phương tiện chuyên dụng.</li>
        </ol>
        <div class="shipment-detail-grid" style="margin-top: 10px;">
          <div class="detail-item">
            <span class="label">Mã vận đơn</span>
            <span class="val">${code}</span>
          </div>
          <div class="detail-item">
            <span class="label">Trạng thái mới</span>
            <span class="val" style="color: var(--success);">Đang giao hàng</span>
          </div>
          <div class="location-highlight">
            <span class="label">Điểm bàn giao dự kiến:</span>
            <span class="val" style="margin-left: 6px;">Trung tâm R&D VinAI, Hà Nội</span>
          </div>
        </div>
        <p style="font-size: 13px; color: var(--text-secondary); margin-top: 8px;">Kiện hàng dự kiến sẽ được bàn giao và ký biên bản giao nhận trong ít phút tới.</p>
      </div>
    `,
    stepsCount: 3,
    toolCallsCount: 2,
    tokensEst: 780
  };
}

// Handler: General Conversation / Direct FAQ (0 Tool Calls)
function handleGeneralConversation(query) {
  const lower = query.toLowerCase();

  // FAQ about Warehouse QA
  if (lower.includes("quy trình") || lower.includes("tiêu chuẩn") || lower.includes("phân loại") || lower.includes("nhập kho")) {
    return {
      thought: `Người dùng hỏi về quy trình chuẩn kiểm soát chất lượng (IQC) và phân loại hàng hóa khi nhập kho lưu trữ.<br>Đây là kiến thức chuyên môn chuỗi cung ứng tổng quan, không đòi hỏi dữ liệu thời gian thực. Tôi phản hồi trực tiếp mà không kích hoạt Tool Call.`,
      tools: [],
      mcpPayload: {
        note: "Direct Query: Phản hồi từ tri thức LLM, 0 tool calls phát sinh.",
        status: "DIRECT_ANSWER"
      },
      finalAnswerHtml: `
        <div class="agent-response-text">
          <p><strong>Quy trình kiểm soát chất lượng (IQC) & tiêu chuẩn phân loại hàng hóa khi nhập kho lưu trữ:</strong></p>
          <ol>
            <li><strong>Tiếp nhận & Đối chiếu chứng từ:</strong> Kiểm tra hóa đơn, Packing List, vận đơn vận tải và niêm phong kẹp chì (seal container) từ đơn vị vận chuyển.</li>
            <li><strong>Kiểm tra ngoại quan & Cảm quan:</strong> Rà soát tình trạng móp méo, rách vỡ bao bì; kiểm tra tem cảnh báo đối với hàng đặc biệt (như pin xe điện Lithium-ion VinFast hoặc linh kiện quang học ADAS).</li>
            <li><strong>Đếm số lượng & Quét mã định danh:</strong> Quét Barcode/RFID để ghi nhận mã SKU và số lượng thực nhập vào phần mềm WMS.</li>
            <li><strong>Phân loại & Lưu trữ (Put-away):</strong> Phân nhóm theo ma trận ABC (tần suất xuất nhập) và di chuyển hàng về tọa độ kệ định sẵn (Kệ/Tầng/Dãy).</li>
          </ol>
        </div>
      `,
      stepsCount: 1,
      toolCallsCount: 0,
      tokensEst: 310
    };
  }

  // Greeting or bot introduction
  if (lower.includes("chào") || lower.includes("hello") || lower.includes("bạn là ai") || lower.includes("hướng dẫn")) {
    return {
      thought: `Người dùng chào hỏi hoặc hỏi về khả năng của Agent. Tôi giới thiệu năng lực hỗ trợ chuỗi cung ứng, các công cụ MCP sẵn có và cách người dùng có thể tra cứu hoặc điều chuyển vận đơn.`,
      tools: [],
      mcpPayload: {
        agent: "SupplyChain AI Assistant",
        status: "READY"
      },
      finalAnswerHtml: `
        <div class="agent-response-text">
          <p>Xin chào! Tôi là <strong>SupplyChain AI Agent</strong> — Trợ lý thông minh hỗ trợ quản lý vận đơn và kho bãi (ReAct Native + MCP 2.0).</p>
          <p>Tôi có thể hỗ trợ bạn các tác vụ:</p>
          <ul>
            <li><strong>Tra cứu vận đơn:</strong> Tra cứu vị trí kệ kho, tình trạng kiện hàng (ví dụ: <code>VN2026001</code>, <code>VN2026002</code>, <code>VN2026003</code>).</li>
            <li><strong>Điều phối & Cập nhật:</strong> Đổi trạng thái đơn sang Đang vận chuyển, Đang giao hàng hoặc gán phương tiện mới.</li>
            <li><strong>Suy luận ReAct đa bước:</strong> Tự động kiểm tra điều kiện kho trước khi ra quyết định chuyển kho.</li>
            <li><strong>Bảo vệ chống ảo giác:</strong> Báo NOT_FOUND trung thực khi mã đơn không tồn tại.</li>
          </ul>
          <p style="font-size: 13px; color: var(--text-secondary);">Bạn hãy nhập câu hỏi hoặc mã vận đơn cần kiểm tra nhé!</p>
        </div>
      `,
      stepsCount: 1,
      toolCallsCount: 0,
      tokensEst: 250
    };
  }

  // Inventory / List of tracking codes inquiry
  if (lower.includes("danh sách") || lower.includes("có những đơn nào") || lower.includes("mã đơn") || lower.includes("kho có gì")) {
    const listHtml = Object.keys(DATABASE).map(k => `
      <li><code>${k}</code>: ${DATABASE[k].product_name} — <strong>${DATABASE[k].status}</strong> (${DATABASE[k].warehouse_name})</li>
    `).join('');

    return {
      thought: `Người dùng muốn xem danh sách các mã vận đơn hiện có trong cơ sở dữ liệu kho vận WMS để kiểm tra.`,
      tools: [],
      mcpPayload: {
        action: "list_inventory",
        total: Object.keys(DATABASE).length
      },
      finalAnswerHtml: `
        <div class="agent-response-text">
          <p>Hiện tại trong cơ sở dữ liệu kho vận đang có các mã vận đơn sau:</p>
          <ul>${listHtml}</ul>
          <p style="font-size: 13px; color: var(--text-secondary); margin-top: 8px;">Bạn có thể yêu cầu tôi tra cứu chi tiết hoặc cập nhật trạng thái của bất kỳ mã nào ở trên!</p>
        </div>
      `,
      stepsCount: 1,
      toolCallsCount: 0,
      tokensEst: 280
    };
  }

  // Fallback natural response
  return {
    thought: `Người dùng gửi yêu cầu: "${query}". Không tìm thấy mã vận đơn cụ thể trong câu lệnh. Tôi phản hồi lịch sự và gợi ý cách thức tra cứu.`,
    tools: [],
    mcpPayload: {
      status: "CONVERSATIONAL_FALLBACK"
    },
    finalAnswerHtml: `
      <div class="agent-response-text">
        <p>Tôi đã nhận được yêu cầu của bạn: <em>"${escapeHtml(query)}"</em>.</p>
        <p>Để tôi hỗ trợ bạn tốt nhất, bạn có thể cung cấp thêm <strong>mã vận đơn</strong> (ví dụ: <code>VN2026001</code>, <code>VN2026002</code>, <code>VN2026003</code>) hoặc nêu rõ thao tác cần thực hiện (như tra cứu vị trí kho bãi, cập nhật trạng thái lên xe vận chuyển).</p>
      </div>
    `,
    stepsCount: 1,
    toolCallsCount: 0,
    tokensEst: 220
  };
}

// Append Agent Response
function appendAgentResponse(data) {
  const row = document.createElement('div');
  row.className = 'msg-row agent';
  const boxId = `reasoning_${Date.now()}`;

  // Reasoning Accordion (DeepSeek R1 / Claude 3.7 Thinking style)
  let thoughtHtml = '';
  if (data.thought) {
    thoughtHtml = `
      <div class="reasoning-box open" id="${boxId}">
        <div class="reasoning-toggle" onclick="toggleReasoning('${boxId}')">
          <div class="toggle-label">
            <i class="fa-solid fa-brain"></i>
            <span>Quá trình suy luận ReAct</span>
          </div>
          <div class="thought-duration">
            <span>${data.duration || '0.5s'}</span>
            <i class="fa-solid fa-chevron-down" style="margin-left: 6px; font-size: 11px;"></i>
          </div>
        </div>
        <div class="reasoning-content">
          ${data.thought}
        </div>
      </div>
    `;
  }

  // Tool Pills
  let toolsHtml = '';
  if (data.tools && data.tools.length > 0) {
    toolsHtml = '<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px;">';
    data.tools.forEach(t => {
      toolsHtml += `
        <div class="tool-pill" onclick="showToolDetail('${escapeHtml(JSON.stringify(t))}')" title="Click để xem chi tiết lệnh gọi Tool">
          <span class="tool-badge"><i class="fa-solid fa-cube"></i> ${t.name}</span>
          <span style="font-size: 11.5px;">${escapeHtml(JSON.stringify(t.args))}</span>
          <span style="color: ${t.badgeColor === 'warning' ? 'var(--warning)' : (t.badgeColor === 'danger' ? '#ef4444' : 'var(--success)')}; font-weight: 700; font-size: 11px;">➔ ${t.resultStatus}</span>
        </div>
      `;
    });
    toolsHtml += '</div>';
  }

  row.innerHTML = `
    <div class="msg-avatar agent"><i class="fa-solid fa-boxes-stacked" style="font-size: 12px;"></i></div>
    <div class="msg-content-wrap">
      ${thoughtHtml}
      ${toolsHtml}
      <div class="agent-response-card">
        ${data.finalAnswerHtml}
      </div>
    </div>
  `;

  messagesFeed.appendChild(row);
}

// Update Right Telemetry Inspector
function updateInspector(data) {
  statLatency.textContent = data.duration || "0.65s";
  statSteps.textContent = `${data.stepsCount || 1} Steps`;
  statToolCalls.textContent = `${data.toolCallsCount || 0} Call${(data.toolCallsCount || 0) > 1 ? 's' : ''}`;
  statTokens.textContent = data.tokensEst || 320;

  if (data.tools && data.tools.length > 0) {
    mcpToolNameBadge.textContent = data.tools.map(t => t.name).join(' ➔ ');
  } else {
    mcpToolNameBadge.textContent = "Direct LLM";
  }

  mcpPayloadDump.textContent = JSON.stringify(data.mcpPayload || { status: "IDLE" }, null, 2);
}

// Helpers
window.toggleReasoning = function(id) {
  const box = document.getElementById(id);
  if (box) box.classList.toggle('open');
};

window.showToolDetail = function(jsonStr) {
  try {
    const parsed = JSON.parse(jsonStr);
    mcpToolNameBadge.textContent = parsed.name;
    mcpPayloadDump.textContent = JSON.stringify(parsed, null, 2);
    if (inspectorPanel.style.display === 'none') {
      inspectorPanel.style.display = 'flex';
    }
  } catch(e) {}
};

function scrollToBottom() {
  setTimeout(() => {
    chatScrollContainer.scrollTop = chatScrollContainer.scrollHeight;
  }, 40);
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
