const API_BASE = 'http://localhost:3000';
let messages = [];
let isLoading = false;

function createChatWidget() {
  const widget = document.createElement('div');
  widget.innerHTML = `
    <button id="ppChatToggle" onclick="toggleChat()" style="
      position:fixed; bottom:24px; right:24px; z-index:9999;
      background:#1a1208; color:#EF9F27; border:none;
      padding:12px 20px; border-radius:24px; cursor:pointer;
      font-family:'Jost',sans-serif; font-size:14px;
      box-shadow:0 4px 20px rgba(0,0,0,0.3);">
      💬 Fragrance Consultant
    </button>

    <div id="ppChatWidget" style="
      display:none; position:fixed; bottom:80px; right:24px;
      z-index:9999; width:360px; height:520px;
      background:#fff; border-radius:16px;
      box-shadow:0 8px 40px rgba(0,0,0,0.2);
      flex-direction:column; overflow:hidden;
      font-family:'Jost',sans-serif;">

      <div style="background:#1a1208; padding:1rem 1.25rem; display:flex; align-items:center; gap:10px;">
        <div style="width:32px;height:32px;background:rgba(239,159,39,0.15);border:1px solid rgba(239,159,39,0.3);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#EF9F27;font-size:14px;">✦</div>
        <div>
          <p style="margin:0;color:#f5e6c8;font-size:15px;">Fragrance Consultant</p>
          <p style="margin:0;color:rgba(239,159,39,0.7);font-size:11px;letter-spacing:0.08em;">PRESTIGE PERFUMERY · AI</p>
        </div>
        <button onclick="toggleChat()" style="margin-left:auto;background:none;border:none;color:#f5e6c8;cursor:pointer;font-size:18px;">✕</button>
      </div>

      <div id="ppMessages" style="flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:10px;background:#faf9f7;"></div>

      <div style="padding:10px;border-top:1px solid #eee;display:flex;gap:8px;background:#fff;">
        <input id="ppInput" type="text"
          placeholder="Ask about any occasion..."
          onkeydown="if(event.key==='Enter') sendMessage()"
          style="flex:1;padding:9px 13px;border:1px solid #ddd;border-radius:20px;font-size:13px;outline:none;font-family:'Jost',sans-serif;" />
        <button onclick="sendMessage()" style="
          width:36px;height:36px;background:#1a1208;border:none;
          border-radius:50%;cursor:pointer;color:#EF9F27;font-size:16px;">➤</button>
      </div>
    </div>
  `;
  document.body.appendChild(widget);

  appendMessage('assistant', "Bonjour! I'm your personal fragrance consultant. Tell me the occasion or mood and I'll find your perfect scent. 🌸");
}

function toggleChat() {
  const widget = document.getElementById('ppChatWidget');
  widget.style.display = widget.style.display === 'none' ? 'flex' : 'none';
  if (widget.style.display === 'flex') {
    document.getElementById('ppInput').focus();
  }
}

function appendMessage(role, text) {
  const container = document.getElementById('ppMessages');
  const div = document.createElement('div');
  div.style.cssText = `display:flex;gap:8px;align-items:flex-end;${role === 'user' ? 'flex-direction:row-reverse;' : ''}`;

  const avatar = role === 'assistant'
    ? `<div style="width:26px;height:26px;background:#1a1208;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#EF9F27;font-size:11px;flex-shrink:0;">✦</div>`
    : '';

  const bubble = `<div style="
    padding:9px 13px;border-radius:16px;font-size:13px;line-height:1.55;max-width:80%;
    ${role === 'assistant'
      ? 'background:#fff;border:1px solid #eee;border-bottom-left-radius:4px;color:#222;'
      : 'background:#1a1208;color:#f5e6c8;border-bottom-right-radius:4px;'}
  ">${text}</div>`;

  div.innerHTML = role === 'assistant' ? avatar + bubble : bubble + avatar;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function showTyping() {
  const container = document.getElementById('ppMessages');
  const div = document.createElement('div');
  div.id = 'ppTyping';
  div.style.cssText = 'display:flex;gap:8px;align-items:flex-end;';
  div.innerHTML = `
    <div style="width:26px;height:26px;background:#1a1208;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#EF9F27;font-size:11px;">✦</div>
    <div style="padding:10px 14px;background:#fff;border:1px solid #eee;border-radius:16px;border-bottom-left-radius:4px;display:flex;gap:4px;">
      <span style="width:6px;height:6px;background:#aaa;border-radius:50%;animation:ppBounce 1.2s infinite;display:block;"></span>
      <span style="width:6px;height:6px;background:#aaa;border-radius:50%;animation:ppBounce 1.2s infinite 0.2s;display:block;"></span>
      <span style="width:6px;height:6px;background:#aaa;border-radius:50%;animation:ppBounce 1.2s infinite 0.4s;display:block;"></span>
    </div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById('ppTyping');
  if (t) t.remove();
}

async function sendMessage() {
  const input = document.getElementById('ppInput');
  const text = input.value.trim();
  if (!text || isLoading) return;

  isLoading = true;
  input.value = '';
  appendMessage('user', text);
  messages.push({ role: 'user', content: text });
  showTyping();

  try {
    const res = await fetch(`${API_BASE}/api/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages })
    });

    const data = await res.json();
    const reply = data.reply || 'Sorry, I had trouble responding.';
    messages.push({ role: 'assistant', content: reply });
    removeTyping();
    appendMessage('assistant', reply);
  } catch (err) {
    removeTyping();
    appendMessage('assistant', 'Connection issue. Please try again.');
  }

  isLoading = false;
}

document.addEventListener('DOMContentLoaded', createChatWidget);