/*
 * Apickli Studio — Logs e transparência da geração v4
 */

function generationLog(message, clear=false) {
  const el = document.getElementById('generation-log');
  if (!el) return;
  el.style.display = 'block';
  const line = `[${new Date().toLocaleTimeString('pt-BR')}] ${message}`;
  el.textContent = clear ? line : (el.textContent === 'Aguardando geração...' ? line : el.textContent + '\n' + line);
  el.scrollTop = el.scrollHeight;
}

function generationStep(step, total, message) {
  generationLog(`Etapa ${step}/${total} — ${message}`);
}

function describeUsedReferences(used) {
  if (!used || !used.length) return 'Nenhuma referência local encontrada. A geração usará apenas Swagger/campos atuais.';
  return used.map((u, i) => `${i+1}. ${u.name} — score ${u.score} — ${u.reason}`).join('\n');
}

function renderGenerationReferencePanel(used, validation = null) {
  const el = document.getElementById('generation-reference-panel');
  if (!el) return;
  el.style.display = 'block';
  const refsHtml = (used && used.length) ? used.map((u, i) => `
    <div class="gen-ref-item">
      <b>${i+1}. ${escapeHtml(u.name)}</b>
      <span class="score-pill">score ${u.score}</span>
      <span class="score-pill">qualidade ${u.qualityScore || 0}%</span>
      <p>${escapeHtml(u.reason)}</p>
    </div>`).join('') : '<div class="alert alert-warn" style="margin:0;">Nenhuma referência foi usada nesta geração. Adicione ZIPs resolvidos na Base de Referências.</div>';
  const valHtml = validation ? `<div class="validation-box ${validation.ok ? 'ok' : 'warn'}"><b>${validation.ok ? '✅ Validação básica aprovada' : '⚠️ Validação encontrou problemas'}</b><br>${escapeHtml(validation.messages.join(' | '))}</div>` : '';
  el.innerHTML = `<h4>📚 Referências usadas nesta geração</h4>${refsHtml}${valHtml}`;
}
