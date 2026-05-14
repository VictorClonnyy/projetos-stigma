/*
 * Apickli Studio v3 — Init
 * Arquivo modular gerado a partir do HTML original.
 */

// ═══════════════════════════════════
// INIT
// ═══════════════════════════════════
function init() {
  if (typeof applyThemeFromStorage === 'function') applyThemeFromStorage();
  apiKey = localStorage.getItem(API_STORAGE_KEY) || LEGACY_API_STORAGE_KEYS.map(k => localStorage.getItem(k)).find(Boolean) || '';
  if (apiKey) localStorage.setItem(API_STORAGE_KEY, apiKey);
  refreshApiKeyUI();
  syncInlineApiKeyUI();
  const c = document.getElementById('chips');
  SCENS.forEach(s => {
    const d = document.createElement('span');
    d.className = 'chip' + (s.a ? ' auto' : '');
    d.textContent = s.l;
    d.onclick = () => togChip(s.c, d);
    c.appendChild(d);
  });
  loadState();
  if (typeof loadReferenceBase === 'function') loadReferenceBase();
}
