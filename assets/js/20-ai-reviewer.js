/*
 * Apickli Studio — Analisador com IA usando referências e memória v4
 */

async function analisarOutputComIA() {
  const key = getApiKey(); if (!key) return;
  const output = document.getElementById('testOutput').value.trim();
  originalFeatureContent = document.getElementById('originalFeature').value.trim();
  const statusDiv = document.getElementById('analysisStatus');
  if (!output) { alert('Cole o output do npm test.'); return; }
  if (!originalFeatureContent) { alert('Cole a feature original.'); return; }

  pendingAIReviewLearning = null;
  document.getElementById('btn-save-ai-learning')?.style && (document.getElementById('btn-save-ai-learning').style.display = 'none');
  statusDiv.textContent = '✨ IA analisando falhas, referências e memória local...';
  const currentEp = selectedGenEpIndex >= 0 ? swaggerEndpoints[selectedGenEpIndex] : swaggerEndpoints[0];
  const refs = currentEp ? buildReferenceContextForEndpoint(currentEp) : { context:'', used:[] };
  const prompt = `Você é um revisor especialista em testes Apickli/Cucumber.

Analise o output do npm test, a feature original, as referências locais de projetos já resolvidos e a memória de aprendizado. Sugira uma versão corrigida da feature.

Responda EXATAMENTE neste formato:
=== RESUMO ===
- bullets curtos explicando problemas

=== REFERÊNCIAS USADAS ===
- nome do projeto e por que foi usado

=== MUDANÇAS SUGERIDAS ===
- mudança 1
- mudança 2

=== FEATURE CORRIGIDA ===
<conteúdo completo da feature corrigida, sem markdown>

=== REGRA DE APRENDIZADO ===
<uma regra curta que deve ser lembrada para próximas gerações, ou "nenhuma">


=== OUTPUT DO TESTE ===
${output.substring(0, 14000)}

=== FEATURE ORIGINAL ===
${originalFeatureContent.substring(0, 22000)}

${refs.context}
${buildLearningContext()}`;

  try {
    const response = await callOpenRouter(prompt, { key, maxOutputTokens: 8000, temperature: 0.1 });
    const parsed = parseAIReviewResponse(response);
    const fixed = parsed.feature || originalFeatureContent;
    document.getElementById('tab2-fixed').textContent = fixed;
    const diffObj = summarizeDiff(originalFeatureContent, fixed);
    const meta = [
      '=== RESUMO DA IA ===', parsed.summary || 'Sem resumo.',
      '', '=== REFERÊNCIAS SELECIONADAS LOCALMENTE ===', describeUsedReferences(refs.used),
      '', '=== REFERÊNCIAS CITADAS PELA IA ===', parsed.refs || 'Sem referências citadas.',
      '', '=== MUDANÇAS SUGERIDAS PELA IA ===', parsed.changes || 'Sem mudanças listadas.',
      '', `=== DIFF (${diffObj.added} linhas adicionadas, ${diffObj.removed} linhas removidas) ===`, diffObj.text
    ].join('\n');
    document.getElementById('tab2-diff').textContent = meta;
    document.getElementById('analysisResults').style.display = 'block';
    document.getElementById('issuesList').innerHTML = `<div class="issue-card escape"><div class="scenario-name">✨ Revisão com IA concluída</div><div class="error-detail">Veja a aba Mudanças para o resumo, referências usadas e diff. Salve o aprendizado se a correção fizer sentido.</div></div>`;
    document.getElementById('summaryBar').innerHTML = `<span class="summary-item escape">✨ IA aplicada</span><span class="summary-item notreq">+${diffObj.added} / -${diffObj.removed}</span>`;
    document.getElementById('fixesCount').textContent = 'Revisão com IA';
    statusDiv.innerHTML = '✅ Revisão com IA concluída.';
    stab2('fixed');

    if (parsed.rule && parsed.rule.toLowerCase() !== 'nenhuma') {
      pendingAIReviewLearning = {
        type: 'ai-review',
        summary: (parsed.changes || parsed.summary || 'Correção sugerida via IA').slice(0, 240),
        rule: parsed.rule.slice(0, 350),
        source: 'analisador com IA',
        references: refs.used.map(u => u.name)
      };
      const btn = document.getElementById('btn-save-ai-learning');
      if (btn) btn.style.display = 'block';
    }
  } catch(e) {
    statusDiv.textContent = '❌ Erro na análise com IA: ' + e.message;
    showToast('Erro na análise com IA: ' + e.message, 'error');
  }
}

async function acceptAIReviewLearning() {
  if (!pendingAIReviewLearning) { showToast('Nenhum aprendizado pendente.', 'error'); return; }
  await addLearningCorrection(pendingAIReviewLearning);
  pendingAIReviewLearning = null;
  const btn = document.getElementById('btn-save-ai-learning');
  if (btn) btn.style.display = 'none';
  showToast('Aprendizado salvo para próximas gerações.');
}

function parseAIReviewResponse(text) {
  const pick = (name, nextNames=[]) => {
    const start = text.indexOf(`=== ${name} ===`);
    if (start < 0) return '';
    const from = start + `=== ${name} ===`.length;
    let end = text.length;
    for (const n of nextNames) {
      const idx = text.indexOf(`=== ${n} ===`, from);
      if (idx >= 0 && idx < end) end = idx;
    }
    return text.substring(from, end).trim();
  };
  return {
    summary: pick('RESUMO', ['REFERÊNCIAS USADAS','MUDANÇAS SUGERIDAS','FEATURE CORRIGIDA','REGRA DE APRENDIZADO']),
    refs: pick('REFERÊNCIAS USADAS', ['MUDANÇAS SUGERIDAS','FEATURE CORRIGIDA','REGRA DE APRENDIZADO']),
    changes: pick('MUDANÇAS SUGERIDAS', ['FEATURE CORRIGIDA','REGRA DE APRENDIZADO']),
    feature: pick('FEATURE CORRIGIDA', ['REGRA DE APRENDIZADO']).replace(/```[a-z]*\n?/g,'').replace(/```/g,'').trim(),
    rule: pick('REGRA DE APRENDIZADO', [])
  };
}
