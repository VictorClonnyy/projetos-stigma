/*
 * Apickli Studio v3 — Chat
 * Arquivo modular gerado a partir do HTML original.
 */

// ═══════════════════════════════════
// CHAT
// ═══════════════════════════════════
function updateChatContextUI(sw) {
  const info = sw.info || {};
  const count = Object.keys(sw.paths || {}).length;
  document.getElementById('chat-context-info').innerHTML = `
    <div class="alert alert-success" style="font-size:12px;margin:0;">
      ✅ <b>${info.title || 'API'}</b> v${info.version || '?'}<br>${count} endpoints carregados
    </div>`;
}

async function loadChatSwagger(file) {
  if (!file) return;
  try {
    const text = await file.text();
    chatSwaggerContext = file.name.endsWith('.yaml') || file.name.endsWith('.yml') ? jsyaml.load(text) : JSON.parse(text);
    updateChatContextUI(chatSwaggerContext);
    document.getElementById('chat-sw-zone').classList.add('done');
    document.getElementById('chat-sw-zone').querySelector('.uz-label').textContent = '✅ ' + file.name;
    addChatMsg('system', '✅ Swagger "' + (chatSwaggerContext.info?.title||file.name) + '" carregado!');
  } catch(e) { alert('Erro: ' + e.message); }
}

function addChatMsg(role, text) {
  const div = document.createElement('div');
  div.className = 'msg ' + role;
  if (role === 'system') { div.innerHTML = text; }
  else {
    div.innerHTML = text
      .replace(/```([\s\S]*?)```/g, '<pre>$1</pre>')
      .replace(/`([^`\n]+)`/g, '<code>$1</code>')
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/\n/g, '<br>');
  }
  document.getElementById('chat-messages').appendChild(div);
  div.scrollIntoView({ behavior: 'smooth' });
  return div;
}

function sendQuick(q) { document.getElementById('chat-input').value = q; sendChat(); }
function clearChat() {
  chatHistory = [];
  document.getElementById('chat-messages').innerHTML = '<div class="msg system">💬 Conversa reiniciada</div>';
}

async function sendChat() {
  const key = getApiKey(); if (!key) return;
  const input = document.getElementById('chat-input');
  const msg = input.value.trim(); if (!msg) return;
  input.value = '';
  addChatMsg('user', msg);
  chatHistory.push({ role: 'user', content: msg });
  const typing = addChatMsg('ai', '<span class="pulse">●●●</span>');
  typing.classList.add('typing');
  document.getElementById('btn-send-chat').disabled = true;

  const sw = chatSwaggerContext || swaggerData;
  let systemPrompt = `Você é um especialista em APIs REST e automação Apickli para a Claro Brasil.\nResponda SEMPRE em português brasileiro.\nSeja claro, objetivo e técnico.\nPara código, use blocos com backticks triplos.`;
  if (sw) {
    const info = sw.info || {};
    const epList = [];
    Object.entries(sw.paths || {}).forEach(([path, methods]) => {
      Object.entries(methods).forEach(([method, op]) => {
        if (['get','post','put','delete','patch'].includes(method)) {
          const reqParams = (op.parameters || []).filter(p => p.required || p.in === 'path').map(p => p.name);
          epList.push(`  ${method.toUpperCase()} ${path}\n    Descrição: ${op.summary || op.description || ''}\n    Params obrigatórios: ${reqParams.join(', ') || 'nenhum'}`);
        }
      });
    });
    systemPrompt += `\n\n=== API: ${info.title || 'API'} v${info.version || '?'} ===\n${epList.join('\n\n')}\n\nSwagger completo (truncado):\n${JSON.stringify(sw).substring(0, 8000)}`;
  }
  if (projectStructure) {
    const featPaths = Object.keys(projectStructure.features);
    if (featPaths.length > 0) systemPrompt += `\n\n=== EXEMPLO DE FEATURE ===\n${projectStructure.features[featPaths[0]].substring(0, 2000)}`;
  }

  try {
    const reply = await callOpenRouterChat(systemPrompt, chatHistory, key);
    typing.classList.remove('typing');
    typing.innerHTML = reply.replace(/```([\s\S]*?)```/g, '<pre>$1</pre>').replace(/`([^`\n]+)`/g, '<code>$1</code>').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
    chatHistory.push({ role: 'assistant', content: reply });
  } catch(e) {
    typing.classList.remove('typing');
    typing.innerHTML = `❌ Erro: ${e.message}`;
  }
  document.getElementById('btn-send-chat').disabled = false;
}
