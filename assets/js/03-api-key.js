/*
 * Apickli Studio v4 — Configurações, API Key e Tema
 */

function openSettings() {
  const modal = document.getElementById('modal-settings');
  if (!modal) return;
  modal.style.display = 'flex';
  const keyInput = document.getElementById('modal-key-input');
  const status = document.getElementById('modal-key-status');
  const darkToggle = document.getElementById('dark-mode-toggle');
  if (keyInput) keyInput.value = apiKey || '';
  if (status) {
    status.style.color = apiKey ? 'var(--green)' : 'var(--muted)';
    status.textContent = apiKey ? '✅ Chave OpenRouter carregada.' : 'Nenhuma chave salva.';
  }
  if (darkToggle) darkToggle.checked = document.body.classList.contains('dark-mode');
}
function closeSettings() { document.getElementById('modal-settings').style.display = 'none'; }

// Compatibilidade com chamadas antigas
function openModal() { openSettings(); }
function closeModal() { closeSettings(); }

function toggleKeyVis(id, btn) {
  const inp = document.getElementById(id);
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  if (btn) btn.textContent = inp.type === 'password' ? 'Mostrar' : 'Ocultar';
}

function saveSettings() { saveApiKey(); }

async function saveApiKey() {
  const val = (document.getElementById('modal-key-input')?.value || '').trim();
  const status = document.getElementById('modal-key-status');
  if (!val) {
    if (status) { status.style.color='var(--orange)'; status.textContent = '⚠️ Insira uma chave ou remova a chave salva.'; }
    return;
  }
  apiKey = val;
  localStorage.setItem(API_STORAGE_KEY, apiKey);
  refreshApiKeyUI();
  updateGenIAButton();
  if (status) {
    status.style.color = val.startsWith('sk-or-') ? 'var(--green)' : 'var(--orange)';
    status.textContent = val.startsWith('sk-or-') ? '✅ Configurações salvas.' : '⚠️ Formato incomum, mas foi salvo.';
  }
  showToast('Configurações salvas.');
}

function clearApiKey() {
  apiKey = '';
  localStorage.removeItem(API_STORAGE_KEY);
  refreshApiKeyUI();
  updateGenIAButton();
  const input = document.getElementById('modal-key-input');
  const status = document.getElementById('modal-key-status');
  if (input) input.value = '';
  if (status) {
    status.style.color = 'var(--muted)';
    status.textContent = 'Chave removida.';
  }
}

function syncInlineApiKeyUI() {
  // Mantido por compatibilidade. A chave agora fica apenas em Configurações.
}

function refreshApiKeyUI() {
  const dot = document.getElementById('apikey-dot');
  const label = document.getElementById('apikey-label');
  if (!dot || !label) return;
  if (apiKey) { dot.className = 'dot ok'; label.textContent = 'OpenRouter: ••••' + apiKey.slice(-6); }
  else { dot.className = 'dot'; label.textContent = 'Sem chave API'; }
}
function getApiKey() { if (!apiKey) { openSettings(); return null; } return apiKey; }

function applyThemeFromStorage() {
  const theme = localStorage.getItem(THEME_STORAGE_KEY) || 'light';
  document.body.classList.toggle('dark-mode', theme === 'dark');
  const toggle = document.getElementById('dark-mode-toggle');
  if (toggle) toggle.checked = theme === 'dark';
}
function toggleDarkMode(enabled) {
  localStorage.setItem(THEME_STORAGE_KEY, enabled ? 'dark' : 'light');
  applyThemeFromStorage();
}
