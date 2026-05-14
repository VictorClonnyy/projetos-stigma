/*
 * Apickli Studio v3 — State
 * Arquivo modular gerado a partir do HTML original.
 */

// ═══════════════════════════════════
// STATE
// ═══════════════════════════════════
function saveState() {
  const d = {};
  ['fn','bs','ep','vb','v405','ep400','epx','bg','appOk','tokOk','appNp','tokNp','appNq','tokNq','bdef','sch'].forEach(k => { d[k] = document.getElementById(k)?.value || ''; });
  d.mf = Array.from(mfields.entries());
  try { localStorage.setItem('apickli_gen_v10', JSON.stringify(d)); } catch(e) {}
}
function loadState() {
  try {
    const s = localStorage.getItem('apickli_gen_v10');
    if (!s) return;
    const d = JSON.parse(s);
    ['fn','bs','ep','vb','v405','ep400','epx','bg','appOk','tokOk','appNp','tokNp','appNq','tokNq','bdef','sch'].forEach(k => {
      const el = document.getElementById(k); if (el && d[k]) el.value = d[k];
    });
    if (d.mf) {
      d.mf.forEach(([k,v]) => mfields.set(k,v));
      if (d.sch) { try { analisar(); } catch(e) {} }
    }
  } catch(e) {}
  updateGenIAButton();
}
