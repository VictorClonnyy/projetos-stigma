/*
 * Apickli Studio — Base de Referências v4
 * - IndexedDB automático
 * - espelhamento opcional em pasta local
 * - export/import da base de conhecimento
 * - controle de confiança por projeto
 */

function openReferenceDB() {
  if (referenceDb) return Promise.resolve(referenceDb);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(REFERENCE_DB_NAME, REFERENCE_DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(REFERENCE_STORE)) db.createObjectStore(REFERENCE_STORE, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(LEARNING_STORE)) db.createObjectStore(LEARNING_STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => { referenceDb = req.result; resolve(referenceDb); };
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(storeName, value) {
  const db = await openReferenceDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(value);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}
async function idbGetAll(storeName) {
  const db = await openReferenceDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
async function idbDelete(storeName, id) {
  const db = await openReferenceDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}
async function idbClear(storeName) {
  const db = await openReferenceDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).clear();
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function loadReferenceBase() {
  try {
    referenceBase = await idbGetAll(REFERENCE_STORE);
    referenceBase.forEach(normalizeReferenceRecord);
    await loadLearningMemory();
    renderReferenceBase();
    refLog(`✅ Base carregada: ${referenceBase.length} projeto(s) de referência.`);
  } catch (e) {
    console.warn(e);
    refLog('⚠️ Não foi possível carregar a base local: ' + e.message);
  }
}

function normalizeReferenceRecord(r) {
  r.status = r.status || 'active'; // active | trusted | legacy | ignored
  r.notes = r.notes || '';
  r.analysis = r.analysis || {};
  if (typeof r.analysis.qualityScore !== 'number') r.analysis.qualityScore = calculateReferenceQuality(r.analysis);
  return r;
}

function dropReferenceZips(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag');
  handleReferenceZipInput(e.dataTransfer.files);
}

async function handleReferenceZipInput(files) {
  const list = Array.from(files || []).filter(f => f.name.toLowerCase().endsWith('.zip'));
  if (!list.length) { showToast('Selecione arquivos .zip.', 'error'); return; }

  refLog(`⏳ Recebidos ${list.length} ZIP(s). Iniciando leitura inteligente...`, true);
  for (const file of list) {
    try {
      refLog(`⏳ Lendo ${file.name}...`);
      const analysis = await analyzeReferenceZip(file, (msg) => refLog('   ' + msg));
      const record = normalizeReferenceRecord({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        size: file.size,
        addedAt: new Date().toISOString(),
        status: 'active',
        analysis,
        blob: file
      });
      await idbPut(REFERENCE_STORE, record);
      referenceBase = referenceBase.filter(r => r.name !== file.name);
      referenceBase.push(record);
      refLog(`✅ ${file.name}: ${analysis.featureCount} feature(s), ${analysis.stepCount} step(s), ${analysis.configCount} config(s), qualidade ${analysis.qualityScore}%.`);
      if (analysis.patterns?.length) refLog(`   🧩 Padrões: ${analysis.patterns.slice(0,6).join(', ')}`);
      if (referenceFolderHandle) await saveZipToChosenFolder(file);
    } catch (e) {
      refLog(`❌ Erro em ${file.name}: ${e.message}`);
    }
  }
  renderReferenceBase();
  showToast(`${list.length} referência(s) processada(s).`);
}

async function chooseReferenceFolder() {
  if (!window.showDirectoryPicker) {
    document.getElementById('ref-folder-status').innerHTML = '⚠️ Seu navegador não permite escolher pasta local por JavaScript. Use Chrome/Edge ou mantenha o salvamento no IndexedDB.';
    return;
  }
  try {
    referenceFolderHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
    document.getElementById('ref-folder-status').innerHTML = `✅ Pasta local selecionada. Novos ZIPs serão gravados nela além do IndexedDB.`;
    refLog('📁 Pasta local selecionada para espelhar novos ZIPs.');
  } catch (e) {
    refLog('ℹ️ Seleção de pasta cancelada.');
  }
}

async function saveZipToChosenFolder(file) {
  if (!referenceFolderHandle) return;
  const safe = file.name.replace(/[\\/:*?"<>|]/g, '_');
  const fh = await referenceFolderHandle.getFileHandle(safe, { create: true });
  const writable = await fh.createWritable();
  await writable.write(file);
  await writable.close();
  refLog(`📁 ${safe} gravado na pasta local selecionada.`);
}

async function updateReferenceStatus(id, status) {
  const ref = referenceBase.find(r => r.id === id); if (!ref) return;
  ref.status = status;
  await idbPut(REFERENCE_STORE, ref);
  renderReferenceBase();
  refLog(`🏷️ ${ref.name} marcado como ${statusLabel(status)}.`);
}

async function updateReferenceNotes(id, value) {
  const ref = referenceBase.find(r => r.id === id); if (!ref) return;
  ref.notes = value || '';
  await idbPut(REFERENCE_STORE, ref);
}

async function removeReference(id) {
  await idbDelete(REFERENCE_STORE, id);
  referenceBase = referenceBase.filter(r => r.id !== id);
  renderReferenceBase();
  refLog('🗑️ Referência removida da base local.');
}

async function clearAllReferences() {
  if (!confirm('Remover todas as referências salvas no navegador?')) return;
  await idbClear(REFERENCE_STORE);
  referenceBase = [];
  renderReferenceBase();
  refLog('🧹 Base de referências limpa.', true);
}

function renderReferenceBase() {
  const list = document.getElementById('reference-list');
  const badge = document.getElementById('ref-count-badge');
  const summary = document.getElementById('ref-summary');
  if (!list || !badge || !summary) return;

  referenceBase.forEach(normalizeReferenceRecord);
  const totals = referenceBase.reduce((acc, r) => {
    acc.features += r.analysis?.featureCount || 0;
    acc.steps += r.analysis?.stepCount || 0;
    acc.configs += r.analysis?.configCount || 0;
    acc.bodies += r.analysis?.bodyCount || 0;
    acc.patterns += r.analysis?.patterns?.length || 0;
    acc.trusted += r.status === 'trusted' ? 1 : 0;
    acc.ignored += r.status === 'ignored' ? 1 : 0;
    return acc;
  }, { features:0, steps:0, configs:0, bodies:0, patterns:0, trusted:0, ignored:0 });

  badge.textContent = `(${referenceBase.length} projeto${referenceBase.length!==1?'s':''})`;
  summary.innerHTML = `
    <div class="ref-kpi"><b>${referenceBase.length}</b><span>projetos</span></div>
    <div class="ref-kpi"><b>${totals.features}</b><span>features</span></div>
    <div class="ref-kpi"><b>${totals.steps}</b><span>steps.js</span></div>
    <div class="ref-kpi"><b>${totals.configs}</b><span>configs</span></div>
    <div class="ref-kpi"><b>${totals.patterns}</b><span>padrões</span></div>
    <div class="ref-kpi"><b>${totals.trusted}</b><span>confiáveis</span></div>`;

  const filter = document.getElementById('ref-filter')?.value || 'all';
  const filtered = referenceBase.slice().reverse().filter(r => {
    if (filter === 'all') return true;
    if (filter === 'active') return r.status === 'active' || r.status === 'trusted';
    return r.status === filter;
  });

  if (!filtered.length) {
    list.innerHTML = '<div class="alert alert-info" style="margin:0;">Nenhum ZIP de referência neste filtro.</div>';
  } else {
    list.innerHTML = filtered.map(r => {
      const a = r.analysis || {};
      const tags = (a.patterns || []).slice(0,6).map(p => `<span class="ref-tag">${escapeHtml(p)}</span>`).join('');
      const quality = Number(a.qualityScore || 0);
      return `<div class="reference-card status-${r.status}">
        <div style="display:flex;gap:10px;align-items:flex-start;">
          <div style="font-size:24px;">${r.status === 'trusted' ? '⭐' : r.status === 'legacy' ? '🕰️' : r.status === 'ignored' ? '🚫' : '📦'}</div>
          <div style="flex:1;min-width:0;">
            <div class="reference-title">${escapeHtml(r.name)}</div>
            <div class="reference-meta">${formatBytes(r.size)} • ${new Date(r.addedAt).toLocaleString('pt-BR')} • ${a.fileCount||0} arquivos lidos • qualidade ${quality}%</div>
            <div class="quality-bar"><span style="width:${Math.min(100,quality)}%"></span></div>
            <div class="reference-meta">${a.featureCount||0} feature(s), ${a.stepCount||0} step(s), ${a.configCount||0} config(s), ${a.bodyCount||0} body pattern(s)</div>
            <div class="ref-tags">${tags}</div>
            <textarea class="form-control ref-note" rows="1" placeholder="Observações sobre esta referência..." onblur="updateReferenceNotes('${r.id}', this.value)">${escapeHtml(r.notes || '')}</textarea>
          </div>
          <div class="ref-actions">
            <select class="form-select form-select-sm" onchange="updateReferenceStatus('${r.id}', this.value)">
              ${['active','trusted','legacy','ignored'].map(s => `<option value="${s}" ${r.status===s?'selected':''}>${statusLabel(s)}</option>`).join('')}
            </select>
            <button class="btn btn-ghost btn-sm" onclick="previewReference('${r.id}')">Ver</button>
            <button class="btn btn-ghost btn-sm" onclick="removeReference('${r.id}')">Remover</button>
          </div>
        </div>
      </div>`;
    }).join('');
  }
  renderLearningSummary();
}

function statusLabel(status) {
  return ({ active:'Ativo', trusted:'Confiável', legacy:'Legado', ignored:'Ignorado' })[status] || status;
}

function previewReference(id) {
  const ref = referenceBase.find(r => r.id === id); if (!ref) return;
  const a = ref.analysis || {};
  const text = [
    `PROJETO: ${ref.name}`,
    `Status: ${statusLabel(ref.status)}`,
    `Qualidade: ${a.qualityScore || 0}%`,
    '',
    'PADRÕES DETECTADOS:',
    ...(a.patterns || ['nenhum']).map(p => `- ${p}`),
    '',
    'FEATURES EXEMPLO:',
    ...(a.features || []).slice(0,5).map(f => `- ${f.path} | ${f.featureName}`),
    '',
    'APPS:',
    (a.apps || []).join(', ') || 'nenhum'
  ].join('\n');
  refLog(text, true);
  switchPage('reference');
}

function exportReferenceManifest() {
  const manifest = referenceBase.map(({blob, ...r}) => r);
  dl('apickli-reference-manifest.json', JSON.stringify(manifest, null, 2));
}

function exportKnowledgeBase() {
  const payload = {
    version: KNOWLEDGE_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    references: referenceBase.map(({blob, ...r}) => r),
    learningMemory
  };
  dl('apickli-knowledge-base.json', JSON.stringify(payload, null, 2));
  refLog('💾 Base de conhecimento exportada. Observação: por segurança/tamanho, o JSON exporta análises e regras, não os ZIPs binários.');
}

async function importKnowledgeBase(file) {
  if (!file) return;
  try {
    const payload = JSON.parse(await file.text());
    const refs = Array.isArray(payload.references) ? payload.references : [];
    refLog(`📥 Importando ${refs.length} referência(s) e memória local...`, true);
    for (const r of refs) {
      normalizeReferenceRecord(r);
      r.id = r.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await idbPut(REFERENCE_STORE, r);
      referenceBase = referenceBase.filter(x => x.name !== r.name);
      referenceBase.push(r);
    }
    if (payload.learningMemory) {
      learningMemory = payload.learningMemory;
      await saveLearningMemory();
    }
    renderReferenceBase();
    refLog('✅ Base de conhecimento importada.');
  } catch(e) {
    showToast('Erro ao importar conhecimento: ' + e.message, 'error');
    refLog('❌ Erro ao importar: ' + e.message);
  }
}

function refLog(message, clear=false) {
  const el = document.getElementById('ref-log');
  if (!el) return;
  const line = `[${new Date().toLocaleTimeString('pt-BR')}] ${message}`;
  el.textContent = clear ? line : (el.textContent === 'Aguardando envio de referências...' ? line : el.textContent + '\n' + line);
  el.scrollTop = el.scrollHeight;
}
