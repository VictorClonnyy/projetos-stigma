/*
 * Apickli Studio v3 — Analisador
 * Arquivo modular gerado a partir do HTML original.
 */

// ═══════════════════════════════════
// ANALISADOR
// ═══════════════════════════════════
function stab2(t) {
  document.getElementById('tab2-fixed').style.display = t==='fixed'?'block':'none';
  document.getElementById('tab2-diff').style.display = t==='diff'?'block':'none';
  document.querySelectorAll('#page-analyzer .subtab').forEach((el,i) => {
    el.classList.toggle('sel', i===['fixed','diff'].indexOf(t));
    el.classList.toggle('purple', i===['fixed','diff'].indexOf(t));
  });
}

function copiarDoGerador() {
  const content = document.getElementById('tf').textContent;
  if (!content || content.startsWith('Importe') || content.startsWith('Preencha')) { alert('Gere uma feature no Gerador primeiro.'); return; }
  document.getElementById('originalFeature').value = content;
  showToast('Feature copiada do Gerador!');
}

function copiar2(t) { navigator.clipboard.writeText(document.getElementById('tab2-'+t).textContent).then(() => showToast('Copiado!')); }
function baixar2() { dl((document.getElementById('fn').value||'api')+'_corrigida.feature', document.getElementById('tab2-fixed').textContent); }
function toggleAllFixes(cb) { document.querySelectorAll('#issuesList input[type=checkbox]').forEach(c => c.checked = cb.checked); }

function analisarOutput() {
  const output = document.getElementById('testOutput').value.trim();
  originalFeatureContent = document.getElementById('originalFeature').value.trim();
  const statusDiv = document.getElementById('analysisStatus');
  if (!output) { alert('Cole o output do npm test.'); return; }
  if (!originalFeatureContent) { alert('Cole a feature original.'); return; }
  statusDiv.textContent = '🔍 Analisando...';
  issues = [];

  if (!output.includes('Failures:')) {
    const match = output.match(/(\d+)\s+scenarios?\s*\((\d+)\s+passed/);
    statusDiv.innerHTML = match ? `✅ <b>Todos os ${match[1]} cenários passaram!</b>` : '✅ Nenhuma falha detectada!';
    document.getElementById('analysisResults').style.display = 'none';
    return;
  }

  const failText = output.substring(output.indexOf('Failures:'));
  const blocks = failText.split(/\n\s*\d+\)\s+Scenario:/);
  for (let i = 1; i < blocks.length; i++) {
    const block = 'Scenario:' + blocks[i];
    const sM = block.match(/Scenario:\s*(.+?)(?:\s+-\s+tests|\n)/);
    const stM = block.match(/Step:\s*(.+?)(?:\s+-\s+tests|\n)/);
    const exM = block.match(/expected:\s*(.+?)(?:\s*\n)/);
    const acM = block.match(/actual:\s*(.+?)(?:\s*\n)/);
    const scM = block.match(/statusCode:\s*['"]?(\d+)/);
    if (!sM) continue;

    const sName = sM[1].trim();
    const stepDesc = stM?.[1]?.trim() || '';
    const expected = exM?.[1]?.trim() || '';
    const actual = acM?.[1]?.trim() || '';
    const statusCode = scM?.[1] || '';
    const fieldM = sName.match(/\s+-\s+([\w.]+)\s+-\s+COD/);
    const fieldName = fieldM?.[1]?.trim() || '';
    const isOutline = !!fieldName && sName.includes('COD 400');
    const isMessage = stepDesc.includes('.message should be') && !stepDesc.includes('detailedMessage');
    const isDetail = stepDesc.includes('detailedMessage should be');

    const issue = { scenarioName: sName, stepDesc, expected, actual, statusCode, fieldName, isOutline, isMessage, isDetail, suggestions: [] };
    const norm = s => s.replace(/\\\\/g,'\\').replace(/\\\[/g,'[').replace(/\\\]/g,']').trim();

    if (norm(expected) === norm(actual) && expected !== actual) {
      issue.type = 'escape_issue';
      if (isOutline) issue.suggestions.push({ type:'use_wildcard', priority:'best', description:`🟣 <b>Escaping!</b> Use <code>(.*)</code> na tabela`, action:'replace_in_table', field:fieldName, msgType:isMessage?'message':'detail', oldValue:expected, newValue:'(.*)' });
      else issue.suggestions.push({ priority:'best', description:`🟣 <b>Escaping no step!</b> Substituir por <code>(.*)</code>`, action:'replace_step_value', stepText:stepDesc, oldValue:expected, newValue:'(.*)' });
    } else if (isOutline && statusCode === '404' && expected === '400') {
      issue.type = 'not_required';
      issue.suggestions.push({ priority:'danger', description:`🔴 <b>${fieldName}</b> não é obrigatório — remover da tabela.`, action:'remove_row_from_table', field:fieldName });
    } else {
      issue.type = 'wrong_value';
      if (isOutline) {
        if (isMessage) issue.suggestions.push({ priority:'best', description:`✅ Corrigir message: <code>${expected}</code> → <code>${actual}</code>`, action:'replace_in_table', field:fieldName, msgType:'message', oldValue:expected, newValue:actual });
        else if (isDetail) issue.suggestions.push({ priority:'best', description:`✅ Corrigir detailedMessage: <code>${expected}</code> → <code>${actual}</code>`, action:'replace_in_table', field:fieldName, msgType:'detail', oldValue:expected, newValue:actual });
      } else {
        if (actual) issue.suggestions.push({ priority:'best', description:`✅ Corrigir: <code>${expected}</code> → <code>${actual}</code>`, action:'replace_step_value', stepText:stepDesc, oldValue:expected, newValue:actual });
      }
    }
    issues.push(issue);
  }

  renderIssues();
  statusDiv.innerHTML = `<b>${issues.length}</b> falha(s) encontrada(s)`;
  document.getElementById('analysisResults').style.display = 'block';
}

function renderIssues() {
  const list = document.getElementById('issuesList');
  list.innerHTML = '';
  let fail=0, esc=0, notreq=0;
  issues.forEach(i => { if(i.type==='escape_issue') esc++; else if(i.type==='not_required') notreq++; else fail++; });
  const sb = document.getElementById('summaryBar');
  sb.innerHTML = '';
  if(fail) sb.innerHTML += `<span class="summary-item fail">❌ ${fail} valor(es) errado(s)</span>`;
  if(esc) sb.innerHTML += `<span class="summary-item escape">🟣 ${esc} problema(s) de escaping</span>`;
  if(notreq) sb.innerHTML += `<span class="summary-item notreq">🔴 ${notreq} campo(s) não obrigatório(s)</span>`;
  document.getElementById('fixesCount').textContent = `${issues.length} problema(s)`;
  issues.forEach((issue, idx) => {
    const card = document.createElement('div');
    card.className = 'issue-card' + (issue.type==='escape_issue'?' escape':'') + (issue.type==='not_required'?' not-req':'');
    let html = `<div class="scenario-name">📌 ${issue.scenarioName}</div>`;
    if(issue.stepDesc) html += `<div class="error-detail" style="font-size:11px;color:var(--muted)">Step: ${issue.stepDesc}</div>`;
    if(issue.expected || issue.actual) html += `<div class="error-detail">Expected: <b style="color:var(--red)">${issue.expected}</b><br>Actual: <b style="color:var(--green)">${issue.actual}</b></div>`;
    issue.suggestions.forEach((s, si) => {
      html += `<div class="suggestion ${s.priority}"><input type="checkbox" id="fix_${idx}_${si}" checked style="margin-right:6px;accent-color:var(--green);"> ${s.description}</div>`;
    });
    card.innerHTML = html;
    list.appendChild(card);
  });
}

async function aplicarCorrecoes() {
  let lines = originalFeatureContent.split('\n');
  let log = [];
  issues.forEach((issue, idx) => {
    issue.suggestions.forEach((s, si) => {
      const cb = document.getElementById(`fix_${idx}_${si}`);
      if (!cb?.checked) return;
      if (s.action === 'remove_row_from_table') {
        lines = lines.filter(line => { const n=line.replace(/\s+/g,' ').trim(); return !n.includes(`| ${s.field} |`) && !n.includes(`| ${s.field}|`); });
        log.push(`- Removido campo '${s.field}' da tabela`);
      } else if (s.action === 'replace_in_table') {
        lines = lines.map(line => {
          if (!line.trim().startsWith('|')) return line;
          const cells = line.split('|').map(c => c.trim());
          if (cells[2] !== s.field) return line;
          const ci = s.msgType === 'message' ? 4 : 5;
          if (cells[ci] === s.oldValue) {
            cells[ci] = s.newValue;
            log.push(`✅ ${s.field} ${s.msgType}: '${s.oldValue}' → '${s.newValue}'`);
            return cells.join(' | ').replace(/^ \| /, '    | ');
          }
          return line;
        });
      } else if (s.action === 'replace_step_value') {
        const sn = s.stepText.toLowerCase();
        lines = lines.map(line => {
          if (line.trim().toLowerCase().includes(sn.substring(0,30)) && line.includes(s.oldValue)) {
            log.push(`✅ Step corrigido: '${s.oldValue}' → '${s.newValue}'`);
            return line.replace(s.oldValue, s.newValue);
          }
          return line;
        });
      }
    });
  });
  document.getElementById('tab2-fixed').textContent = lines.join('\n');
  document.getElementById('tab2-diff').textContent = log.length ? log.join('\n') : 'Nenhuma alteração aplicada.';
  if (log.length && typeof addLearningCorrection === 'function') {
    await addLearningCorrection({
      type: 'heuristic-analyzer',
      summary: log.slice(0, 5).join(' | '),
      rule: 'Reutilizar correções aceitas no Analisador quando ocorrerem falhas semelhantes de status, message ou detailedMessage.',
      source: 'analisador heurístico'
    });
  }
  stab2('fixed');
}
