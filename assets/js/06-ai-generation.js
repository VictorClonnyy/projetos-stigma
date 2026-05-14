/*
 * Apickli Studio v3 — Gerar Com Ia — Todos Os Endpoints
 * Arquivo modular gerado a partir do HTML original.
 */

// ═══════════════════════════════════
// GERAR COM IA — todos os endpoints
// ═══════════════════════════════════
async function gerarComIA() {
  const key = getApiKey(); if (!key) return;
  if (!swaggerEndpoints.length) { showToast('Carregue um Swagger primeiro.', 'error'); return; }

  const btn = document.getElementById('btn-gen-ia');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Gerando...';
  document.getElementById('gen-ep-progress-wrap').style.display = 'block';
  document.getElementById('btn-gen-dl-all').style.display = 'none';

  if (typeof generationLog === 'function') generationLog(`🚀 Iniciando geração. Base local: ${referenceBase?.length || 0} referência(s).`, true);

  // Determine endpoints to generate
  const toGenerate = selectedGenEpIndex >= 0
    ? [selectedGenEpIndex]
    : swaggerEndpoints.map((_,i)=>i);

  let done = 0;
  for (const i of toGenerate) {
    const ep = swaggerEndpoints[i];
    document.getElementById('gen-ep-progress-label').textContent = `Gerando ${ep.method} ${ep.path}...`;
    if (typeof generationLog === 'function') generationLog(`⏳ Preparando ${ep.method} ${ep.path}...`);
    await generateFeatureForEndpoint(i);
    done++;
    const pct = Math.round(done / toGenerate.length * 100);
    document.getElementById('gen-ep-progress-fill').style.width = pct + '%';
    document.getElementById('gen-ep-progress-label').textContent = `${done}/${toGenerate.length} geradas`;

    // Show first result in preview
    if (done === 1 && ep.feature) {
      document.getElementById('tf').textContent = ep.feature;
      document.getElementById('ts').textContent = ep.steps || '';
      document.getElementById('tc').textContent = ep.config || '';
      document.getElementById('originalFeature').value = ep.feature;
    }
    renderGenEndpointSelector();
  }

  const allDone = swaggerEndpoints.every(e => e.status === 'done');
  if (allDone && swaggerEndpoints.length > 1) document.getElementById('btn-gen-dl-all').style.display = 'inline-flex';

  // If multiple endpoints, show last selected in preview
  if (selectedGenEpIndex >= 0 && swaggerEndpoints[selectedGenEpIndex].feature) {
    const ep = swaggerEndpoints[selectedGenEpIndex];
    document.getElementById('tf').textContent = ep.feature;
    document.getElementById('ts').textContent = ep.steps || '';
    document.getElementById('tc').textContent = ep.config || '';
  }

  btn.disabled = false;
  btn.innerHTML = selectedGenEpIndex >= 0 ? '✨ GERAR COM IA' : '✨ GERAR TODOS COM IA';
  showToast(`${done} feature(s) gerada(s) com sucesso!`);
}

async function downloadAllGenFeatures() {
  const zip = new JSZip();
  const featFolder = zip.folder('tests/integration/features');
  const stepsFolder = zip.folder('tests/integration/features/step_definitions');
  swaggerEndpoints.filter(e => e.status === 'done').forEach((ep, idx) => {
    featFolder.file(ep.featureName + '.feature', ep.feature);
    if (idx === 0 && ep.steps) stepsFolder.file('addition_steps.js', ep.steps);
  });
  const firstDone = swaggerEndpoints.find(e => e.status === 'done');
  if (firstDone?.config) zip.file('tests/integration/config.json', firstDone.config);
  const blob = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'apickli-features-' + new Date().toISOString().slice(0,10) + '.zip'; a.click();
}
