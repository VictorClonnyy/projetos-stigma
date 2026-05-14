/*
 * Apickli Studio v3 — Navigation
 * Arquivo modular gerado a partir do HTML original.
 */

// ═══════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════
function switchPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.getElementById('ntab-' + page).classList.add('active');
}
