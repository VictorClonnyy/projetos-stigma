/*
 * Apickli Studio v4 — Core AI Feature Generation com referências, logs, validação e retry
 */

async function generateFeatureForEndpoint(i) {
  const key = getApiKey(); if (!key) return;
  const ep = swaggerEndpoints[i];
  ep.status = 'generating';

  const tokOk = document.getElementById('tokOk').value.trim();
  const tokNp = document.getElementById('tokNp').value.trim();
  const tokNq = document.getElementById('tokNq').value.trim();
  const ep400 = document.getElementById('ep400').value.trim() || 'API-ERROR-400';
  const epx = document.getElementById('epx').value.trim() || 'API-ERROR';

  const appOk = detectedApps.ok || document.getElementById('appOk').value.trim() || ep.featureName + '-app-ok';
  const appNp = detectedApps.nper || document.getElementById('appNp').value.trim() || ep.featureName + '-app-nper';
  const appNq = detectedApps.nq || document.getElementById('appNq').value.trim() || ep.featureName + '-app-nq';

  const suffixes = Object.keys(projectStructure?.bodyDefs || {});
  const bs = suffixes.length > 0 ? suffixes[0] : (ep.path.split('/').filter(p => p && !p.startsWith('{')).pop() || 'default');

  const reqFields = [];
  if (ep.bodySchema) { const f=[]; flatSchema(ep.bodySchema,'',f); f.filter(x=>x.required).forEach(x=>reqFields.push(x.path)); }

  generationStep?.(1, 6, `Preparando contexto do endpoint ${ep.method} ${ep.path}`);
  let projectCtx = '';
  if (projectStructure) {
    const stepFiles = Object.keys(projectStructure.stepDefs);
    const intStepFiles = stepFiles.filter(f => f.includes('integration'));
    const mainStep = intStepFiles.find(f => f.includes('addition')) || intStepFiles[0] || stepFiles[0];
    if (mainStep) projectCtx += `\n\n--- ADDITION_STEPS.JS DO ZIP ATUAL ---\n${projectStructure.stepDefs[mainStep].substring(0, 4000)}`;
    const featFiles = Object.keys(projectStructure.features).filter(f => f.includes('integration'));
    if (featFiles.length > 0) projectCtx += `\n\n--- FEATURE DO ZIP ATUAL (siga esse padrão) ---\n${projectStructure.features[featFiles[0]].substring(0, 4000)}`;
    if (projectStructure.integConfig) projectCtx += `\n\n--- CONFIG.JSON DO ZIP ATUAL ---\n${JSON.stringify(projectStructure.integConfig, null, 2).substring(0, 1000)}`;
    if (projectStructure.bodyDefs[bs]) projectCtx += `\n\n--- BODY DEFAULT (${bs}) DO ZIP ATUAL ---\n${projectStructure.bodyDefs[bs]}`;
    projectCtx += `\n\n--- ESTRUTURA DO ZIP ATUAL ---\n${projectStructure.paths.filter(p => !p.includes('node_modules') && !p.includes('/.git/')).slice(0,60).join('\n')}`;
  }

  generationStep?.(2, 6, 'Buscando referências locais mais parecidas...');
  let referenceCtx = '';
  let usedReferences = [];
  if (typeof buildReferenceContextForEndpoint === 'function') {
    const refs = buildReferenceContextForEndpoint(ep);
    referenceCtx = refs.context || '';
    usedReferences = refs.used || [];
    lastGenerationReferences = usedReferences;
    generationLog?.('📚 Referências escolhidas:\n' + describeUsedReferences(usedReferences));
    renderGenerationReferencePanel?.(usedReferences);
  }

  generationStep?.(3, 6, 'Aplicando memória local e regras manuais...');
  const learningCtx = typeof buildLearningContext === 'function' ? buildLearningContext() : '';

  const today = new Date().toLocaleDateString('pt-BR');
  const prompt = `Você é um gerador de features Apickli para APIs REST da Claro Brasil. Gere uma feature Gherkin COMPLETA e 100% funcional baseada no padrão EXATO dos exemplos reais fornecidos.

=== TAREFA ===
Gerar somente o arquivo .feature para o endpoint abaixo. Use os projetos de referência para copiar padrão, linguagem, ordem dos cenários, autenticação, errorCode e estilo.

=== ENDPOINT A GERAR ===
Método: ${ep.method}
Path: ${ep.path}
Summary: ${ep.op.summary || 'N/A'}
Feature Name: ${ep.featureName}
Body Suffix: ${bs}

=== APPS E TOKENS ===
App OK: ${appOk}  →  Token: ${tokOk || 'Basic TOKEN_OK'}
App NPER: ${appNp}  →  Token: ${tokNp || 'Basic TOKEN_NPER'}
App NQ: ${appNq}  →  Token: ${tokNq || 'Basic TOKEN_NQ'}

=== ERROR CODES ===
Prefixo 400: ${ep400}
Prefixo 401-429: ${epx}

=== PARÂMETROS DE HEADER ===
${ep.params.filter(p => p.in === 'header').map(p => `${p.name} (${p.required?'OBRIGATÓRIO':'opcional'}): ${p.description}`).join('\n') || 'nenhum header adicional'}

=== PARÂMETROS DE PATH ===
${ep.params.filter(p => p.in === 'path').map(p => `${p.name} (${p.required?'OBRIGATÓRIO':'opcional'})`).join('\n') || 'nenhum'}

=== CAMPOS OBRIGATÓRIOS NO BODY ===
${reqFields.length > 0 ? reqFields.join(', ') : 'nenhum'}
${projectCtx}
${referenceCtx}
${learningCtx}

=== REGRAS OBRIGATÓRIAS ===
1. Cabeçalho: ##Author: Apickli Studio  e  ##Data: ${today}
2. Tag @apiproxy antes de Feature
3. Feature: ${ep.featureName}
4. Background com descrição da API
5. @set-variables → Scenario: 0. Preparação das variáveis (generate body default ${bs} + set variable app_OK)
6. Scenario: 0.1 Obtém token via OAuth (POST /oauth2/v1/token)
7. Se houver campos obrigatórios no body: Scenario Outline com tabela de validação conforme padrão das referências
8. Se houver parâmetros de header obrigatórios: cenários validando cada header ausente
9. CT-200/201 - Sucesso
10. CT-401, CT-403, CT-405, CT-406, CT-415, CT-429
11. Use EXATAMENTE o padrão de indentação e tabelas dos projetos de referência mais similares
12. Para CT-403 use app NPER; para CT-429 use app NQ
13. errorCode: ${epx}-401, ${epx}-403, etc. | 400 usa ${ep400}-400, salvo se a memória/referência indicar outro padrão
14. Cenário "Cenario para evitar o 429" com "When I wait 5 seconds" ANTES dos cenários 401+
15. Não invente steps fora do padrão se houver exemplo equivalente nas referências.

Responda APENAS com o conteúdo da feature, sem explicações, sem markdown, sem backticks.`;

  try {
    generationStep?.(4, 6, 'Chamando OpenRouter...');
    const featureRaw = await callOpenRouter(prompt, { key, maxOutputTokens: 6000, temperature: 0.15 });
    let feature = cleanupFeature(featureRaw);
    let validation = validateGeneratedFeature(feature, ep);

    if (!validation.ok) {
      generationLog?.('⚠️ Validação encontrou problemas: ' + validation.messages.join(' | '));
      generationStep?.(5, 6, 'Pedindo autocorreção para a IA...');
      const repairPrompt = `${prompt}\n\nA resposta anterior teve estes problemas:\n${validation.messages.map(m => '- ' + m).join('\n')}\n\nResposta anterior:\n${feature}\n\nCorrija e retorne APENAS a feature completa.`;
      const repaired = await callOpenRouter(repairPrompt, { key, maxOutputTokens: 6500, temperature: 0.05 });
      const repairedFeature = cleanupFeature(repaired);
      const repairedValidation = validateGeneratedFeature(repairedFeature, ep);
      if (repairedValidation.ok || repairedFeature.length > feature.length) {
        feature = repairedFeature;
        validation = repairedValidation;
      }
    }

    lastGenerationValidation = validation;
    renderGenerationReferencePanel?.(usedReferences, validation);
    generationStep?.(6, 6, 'Montando steps.js e config.json locais...');
    ep.feature = feature;
    const bodyJson = projectStructure?.bodyDefs[bs]
      ? projectStructure.bodyDefs[bs]
      : JSON.stringify(buildExampleBody(ep.bodySchema) || {}, null, 2);
    ep.steps = generateStepsContent(bs, bodyJson);
    ep.config = generateConfigContent(appOk, tokOk, appNp, tokNp, appNq, tokNq);
    ep.status = 'done';
    ep.usedReferences = usedReferences;
    ep.validation = validation;
    generationLog?.('✅ Feature gerada para ' + ep.method + ' ' + ep.path + '.');
  } catch(e) {
    generationLog?.('❌ Erro ao gerar: ' + e.message);
    ep.feature = `# Erro ao gerar feature\n# ${e.message}\n# Verifique a chave da API OpenRouter.`;
    ep.status = 'pending';
    showToast('Erro: ' + e.message, 'error');
  }
}

function cleanupFeature(text) {
  return String(text || '')
    .replace(/```gherkin\n?/gi,'')
    .replace(/```feature\n?/gi,'')
    .replace(/```[a-z]*\n?/gi,'')
    .replace(/```/g,'')
    .trim();
}

function validateGeneratedFeature(feature, ep) {
  const messages = [];
  if (!feature || feature.length < 200) messages.push('conteúdo muito curto');
  if (!/^\s*Feature:/m.test(feature)) messages.push('não possui linha Feature:');
  if (!/Scenario:/m.test(feature)) messages.push('não possui Scenario:');
  if (!/\bGiven\b|\bWhen\b|\bThen\b/m.test(feature)) messages.push('não possui Given/When/Then');
  if (ep?.featureName && !feature.includes(ep.featureName)) messages.push('não contém o Feature Name esperado');
  if (ep?.method && !feature.toUpperCase().includes(ep.method)) messages.push('não menciona o método HTTP esperado');
  if (ep?.path && !feature.includes(ep.path.split('?')[0])) messages.push('não menciona o path esperado');
  return { ok: messages.length === 0, messages: messages.length ? messages : ['estrutura básica consistente'] };
}
