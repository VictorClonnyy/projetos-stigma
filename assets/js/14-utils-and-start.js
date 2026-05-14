/*
 * Apickli Studio v3 — Utils
 * Arquivo modular gerado a partir do HTML original.
 */

// ═══════════════════════════════════
// UTILS
// ═══════════════════════════════════
function showToast(msg, type='success') {
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;font-family:var(--sans);box-shadow:0 4px 16px rgba(0,0,0,0.15);transition:opacity 0.3s;${type==='error'?'background:#fee2e2;color:#991b1b;border:1px solid #fecaca;':'background:#f0fdf4;color:#166534;border:1px solid #bbf7d0;'}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; setTimeout(()=>t.remove(),300); }, 2500);
}


function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatBytes(bytes) {
  const n = Number(bytes || 0);
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1024 / 1024).toFixed(1) + ' MB';
}

const settingsModal = document.getElementById('modal-settings');
if (settingsModal) {
  settingsModal.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeSettings();
  });
}

init();
