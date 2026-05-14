/*
 * Apickli Studio — Memória local de aprendizado v4
 */

async function loadLearningMemory() {
  try {
    const rows = await idbGetAll(LEARNING_STORE);
    const mem = rows.find(r => r.id === 'memory');
    learningMemory = mem?.value || { corrections: [], rules: [] };
    learningMemory.corrections = learningMemory.corrections || [];
    learningMemory.rules = learningMemory.rules || [];
    renderLearningSummary();
  } catch(e) {
    learningMemory = { corrections: [], rules: [] };
  }
}

async function saveLearningMemory() {
  await idbPut(LEARNING_STORE, { id: 'memory', value: learningMemory, updatedAt: new Date().toISOString() });
  renderLearningSummary();
}

async function addLearningCorrection(correction) {
  learningMemory.corrections = learningMemory.corrections || [];
  learningMemory.rules = learningMemory.rules || [];
  const item = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, at: new Date().toISOString(), ...correction };
  learningMemory.corrections.unshift(item);
  learningMemory.corrections = learningMemory.corrections.slice(0, 300);
  if (correction.rule && !learningMemory.rules.some(r => normalizeRule(r.rule) === normalizeRule(correction.rule))) {
    learningMemory.rules.unshift({ id: item.id, rule: correction.rule, source: correction.source || 'analisador', at: item.at, enabled: true });
  }
  await saveLearningMemory();
}

function normalizeRule(v) { return String(v || '').trim().toLowerCase().replace(/\s+/g, ' '); }

async function addManualLearningRule() {
  const el = document.getElementById('manual-rule-input');
  const rule = el?.value.trim();
  if (!rule) { showToast('Escreva uma regra antes de salvar.', 'error'); return; }
  await addLearningCorrection({ type: 'manual-rule', summary: rule, rule, source: 'regra manual' });
  el.value = '';
  refLog('🧠 Regra manual salva: ' + rule);
  showToast('Regra salva na memória local.');
}

async function deleteLearningRule(id) {
  learningMemory.rules = (learningMemory.rules || []).filter(r => r.id !== id);
  await saveLearningMemory();
  refLog('🗑️ Regra removida da memória.');
}

async function toggleLearningRule(id, enabled) {
  const r = (learningMemory.rules || []).find(x => x.id === id);
  if (r) { r.enabled = enabled; await saveLearningMemory(); }
}

function buildLearningContext() {
  const rules = (learningMemory.rules || []).filter(r => r.enabled !== false).slice(0, 40).map((r, i) => `${i+1}. ${r.rule}`).join('\n');
  const corrections = (learningMemory.corrections || []).slice(0, 25).map((c, i) => `${i+1}. ${c.summary || c.rule || c.type || 'correção aceita'}`).join('\n');
  if (!rules && !corrections) return '';
  return `\n\n=== MEMÓRIA LOCAL DE APRENDIZADO ===\nRegras aceitas pelo usuário:\n${rules || 'nenhuma'}\n\nCorreções recentes aceitas:\n${corrections || 'nenhuma'}\n`;
}

function renderLearningSummary() {
  const el = document.getElementById('learning-summary');
  if (!el) return;
  const c = learningMemory.corrections?.length || 0;
  const r = learningMemory.rules?.length || 0;
  const enabled = (learningMemory.rules || []).filter(x => x.enabled !== false).length;
  const last = learningMemory.corrections?.[0]?.summary || learningMemory.rules?.[0]?.rule || 'Nenhum aprendizado salvo ainda.';
  el.innerHTML = `
    <div class="ref-kpi"><b>${r}</b><span>regras totais</span></div>
    <div class="ref-kpi"><b>${enabled}</b><span>regras ativas</span></div>
    <div class="ref-kpi"><b>${c}</b><span>correções aceitas</span></div>
    <div class="ref-kpi wide"><b>Último</b><span>${escapeHtml(last).slice(0,130)}</span></div>`;

  const list = document.getElementById('learning-rules-list');
  if (list) {
    const rules = (learningMemory.rules || []).slice(0, 20);
    list.innerHTML = rules.length ? rules.map(rule => `
      <div class="learning-rule ${rule.enabled === false ? 'off' : ''}">
        <input type="checkbox" ${rule.enabled === false ? '' : 'checked'} onchange="toggleLearningRule('${rule.id}', this.checked)">
        <span>${escapeHtml(rule.rule)}</span>
        <small>${escapeHtml(rule.source || '')}</small>
        <button class="btn btn-ghost btn-sm" onclick="deleteLearningRule('${rule.id}')">Remover</button>
      </div>`).join('') : '<div class="reference-meta" style="margin-top:10px;">Nenhuma regra criada ainda.</div>';
  }
}

function exportLearningMemory() {
  dl('apickli-learning-memory.json', JSON.stringify(learningMemory, null, 2));
}

async function clearLearningMemory() {
  if (!confirm('Limpar toda a memória de aprendizado local?')) return;
  learningMemory = { corrections: [], rules: [] };
  await saveLearningMemory();
  refLog('🧹 Memória de aprendizado limpa.');
}
