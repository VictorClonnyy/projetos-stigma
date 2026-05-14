/*
 * Apickli Studio — Analisador inteligente de ZIPs de referência v4
 */

async function analyzeReferenceZip(file, onProgress = null) {
  const zip = await JSZip.loadAsync(file);
  const paths = Object.keys(zip.files).filter(p => !zip.files[p].dir && !p.includes('node_modules') && !p.includes('/.git/'));
  const analysis = {
    fileCount: paths.length,
    featureCount: 0,
    stepCount: 0,
    configCount: 0,
    bodyCount: 0,
    paths: paths.slice(0, 180),
    features: [],
    steps: [],
    configs: [],
    bodies: [],
    apps: [],
    methods: [],
    statusCodes: [],
    errorPrefixes: [],
    patterns: [],
    qualityScore: 0
  };

  onProgress?.(`📂 ${paths.length} arquivo(s) encontrados.`);
  for (const path of paths) {
    if (!/\.(feature|js|json|yaml|yml|md)$/i.test(path)) continue;
    let content = '';
    try { content = await zip.files[path].async('string'); } catch(e) { continue; }

    if (path.endsWith('.feature')) {
      analysis.featureCount++;
      const f = extractFeatureReference(path, content);
      analysis.features.push(f);
      f.methods.forEach(m => { if (!analysis.methods.includes(m)) analysis.methods.push(m); });
      f.statusCodes.forEach(c => { if (!analysis.statusCodes.includes(c)) analysis.statusCodes.push(c); });
      f.errorPrefixes.forEach(p => { if (!analysis.errorPrefixes.includes(p)) analysis.errorPrefixes.push(p); });
    } else if (path.endsWith('.js') && /(step|addition|definition)/i.test(path)) {
      analysis.stepCount++;
      analysis.steps.push({ path, snippet: smartSnippet(content, ['When ', 'Then ', 'Given ', 'generate body default']) });
      const bodyMatches = [...content.matchAll(/generate body default\s+([\w-]+)/gi)].map(m => m[1]);
      bodyMatches.forEach(b => analysis.bodies.push({ suffix: b, path }));
    } else if (path.endsWith('.json') && /config/i.test(path)) {
      analysis.configCount++;
      analysis.configs.push({ path, snippet: maskSecrets(content.substring(0, 1600)) });
      try {
        const parsed = JSON.parse(content);
        const apps = Object.keys(parsed.parameters?.apps || {});
        apps.forEach(a => { if (!analysis.apps.includes(a)) analysis.apps.push(a); });
      } catch(e) {}
    }
  }

  analysis.bodyCount = analysis.bodies.length;
  analysis.patterns = detectReferencePatterns(analysis);
  analysis.qualityScore = calculateReferenceQuality(analysis);
  onProgress?.(`✅ Padrões detectados: ${analysis.patterns.length}. Score de qualidade: ${analysis.qualityScore}%.`);
  return analysis;
}

function extractFeatureReference(path, content) {
  const featureName = content.match(/^Feature:\s*(.+)$/m)?.[1]?.trim() || path.split('/').pop();
  const tags = [...content.matchAll(/^\s*(@[\w-]+)/gm)].map(m => m[1]).slice(0, 20);
  const scenarios = [...content.matchAll(/^\s*Scenario(?: Outline)?:\s*(.+)$/gm)].map(m => m[1].trim()).slice(0, 50);
  const methods = [...content.matchAll(/(?:make|send|execute).*?\b(GET|POST|PUT|DELETE|PATCH)\b/gi)].map(m => m[1].toUpperCase());
  const statusCodes = [...content.matchAll(/(?:response code should be|status code|codigo|código).*?\b(200|201|400|401|403|405|406|415|422|429|500)\b/gi)].map(m => m[1]);
  const errorPrefixes = [...content.matchAll(/\b(API-[A-Z0-9-]+)-(?:400|401|403|405|406|415|422|429)\b/g)].map(m => m[1]).slice(0, 20);
  const snippet = smartSnippet(content, ['Scenario Outline', 'CT-200', 'CT-400', 'CT-401', 'Feature:']);
  return { path, featureName, tags, scenarios, methods:[...new Set(methods)], statusCodes:[...new Set(statusCodes)], errorPrefixes:[...new Set(errorPrefixes)], snippet };
}

function smartSnippet(content, keywords) {
  const lower = content.toLowerCase();
  let idx = -1;
  for (const k of keywords) {
    idx = lower.indexOf(String(k).toLowerCase());
    if (idx >= 0) break;
  }
  if (idx < 0) idx = 0;
  const start = Math.max(0, idx - 900);
  return maskSecrets(content.substring(start, start + MAX_REFERENCE_SNIPPET_CHARS));
}

function maskSecrets(text) {
  return String(text || '')
    .replace(/Basic\s+[A-Za-z0-9+/_=-]{12,}/g, 'Basic ***MASKED***')
    .replace(/Bearer\s+[A-Za-z0-9._-]{12,}/g, 'Bearer ***MASKED***')
    .replace(/sk-[A-Za-z0-9._-]{12,}/g, 'sk-***MASKED***');
}

function detectReferencePatterns(a) {
  const patterns = [];
  const allScenarios = a.features.flatMap(f => f.scenarios).join(' | ');
  const allText = JSON.stringify(a).toLowerCase();
  if (/429/.test(allScenarios)) patterns.push('CT-429 com espera/rate limit');
  if (/401/.test(allScenarios)) patterns.push('CT-401 autenticação');
  if (/403/.test(allScenarios)) patterns.push('CT-403 app sem permissão');
  if (/400/.test(allScenarios)) patterns.push('validação 400 por schema');
  if (a.statusCodes.includes('422')) patterns.push('validação 422 detectada');
  if (a.apps.some(n => /nper/i.test(n))) patterns.push('app NPER');
  if (a.apps.some(n => /nq/i.test(n))) patterns.push('app NQ');
  if (a.bodies.length) patterns.push('body default em steps');
  if (/oauth2\/v1\/token|obtem token|obtém token/.test(allText)) patterns.push('OAuth no background');
  if (/content-type|415/.test(allText)) patterns.push('CT-415 mídia inválida');
  if (/method.*not.*allowed|405|método inválido|metodo invalido/.test(allText)) patterns.push('CT-405 método inválido');
  if (a.errorPrefixes.length) patterns.push('prefixos de errorCode reais');
  return [...new Set(patterns)];
}

function calculateReferenceQuality(a) {
  let score = 0;
  if ((a.featureCount || 0) > 0) score += 20;
  if ((a.stepCount || 0) > 0) score += 18;
  if ((a.configCount || 0) > 0) score += 14;
  if ((a.bodyCount || 0) > 0) score += 10;
  if ((a.apps || []).length >= 2) score += 8;
  if ((a.patterns || []).length >= 4) score += 12;
  if ((a.statusCodes || []).length >= 4) score += 8;
  if ((a.errorPrefixes || []).length) score += 5;
  if ((a.methods || []).length) score += 5;
  return Math.max(0, Math.min(100, score));
}

function scoreReferenceForEndpoint(ref, ep) {
  if (ref.status === 'ignored') return -999;
  const a = ref.analysis || {};
  const text = JSON.stringify(a).toLowerCase();
  const pathTokens = ep.path.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 2 && !['v1','v2','api','com','clr'].includes(t));
  let score = 0;
  pathTokens.forEach(t => { if (text.includes(t)) score += 10; });
  if (text.includes(ep.method.toLowerCase())) score += 8;
  if ((a.featureCount || 0) > 0) score += 4;
  if ((a.stepCount || 0) > 0) score += 4;
  if ((a.configCount || 0) > 0) score += 3;
  score += Math.round((a.qualityScore || 0) / 10);
  if (ref.status === 'trusted') score = Math.round(score * 1.45 + 12);
  if (ref.status === 'legacy') score = Math.round(score * 0.55);
  return score;
}

function getRelevantReferences(ep, limit = MAX_REFERENCES_IN_PROMPT) {
  return referenceBase
    .map(ref => ({ ref, score: scoreReferenceForEndpoint(ref, ep) }))
    .filter(x => x.score > -999)
    .sort((a,b) => b.score - a.score)
    .slice(0, limit)
    .filter(x => x.score > 0 || referenceBase.filter(r => r.status !== 'ignored').length <= limit);
}

function buildReferenceContextForEndpoint(ep) {
  const ranked = getRelevantReferences(ep);
  if (!ranked.length) return { context: '', used: [] };
  const chunks = [];
  const used = [];
  ranked.forEach(({ref, score}, idx) => {
    const a = ref.analysis || {};
    const reason = explainReferenceChoice(ref, ep, score);
    used.push({ name: ref.name, score, status: ref.status, qualityScore: a.qualityScore || 0, reason });
    chunks.push(`\n--- REFERÊNCIA ${idx+1}: ${ref.name} ---\nStatus: ${statusLabel(ref.status)}\nScore: ${score}\nQualidade: ${a.qualityScore || 0}%\nMotivo: ${reason}\nNotas do usuário: ${ref.notes || 'nenhuma'}\nPadrões: ${(a.patterns||[]).join(', ') || 'não detectados'}\nApps: ${(a.apps||[]).slice(0,8).join(', ') || 'não detectados'}\nStatus codes reais: ${(a.statusCodes||[]).join(', ') || 'não detectados'}`);
    (a.features || []).slice(0, 2).forEach(f => chunks.push(`\n[Feature exemplo: ${f.path}]\n${f.snippet}`));
    (a.steps || []).slice(0, 1).forEach(st => chunks.push(`\n[Steps exemplo: ${st.path}]\n${st.snippet}`));
    (a.configs || []).slice(0, 1).forEach(c => chunks.push(`\n[Config exemplo: ${c.path}]\n${c.snippet}`));
  });
  return { context: chunks.join('\n'), used };
}

function explainReferenceChoice(ref, ep, score) {
  const a = ref.analysis || {};
  const bits = [];
  const text = JSON.stringify(a).toLowerCase();
  ep.path.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 2).slice(0,6).forEach(t => { if (text.includes(t)) bits.push(`termo parecido: ${t}`); });
  if (a.methods?.includes(ep.method)) bits.push(`mesmo método ${ep.method}`);
  if ((a.qualityScore || 0) >= 75) bits.push(`alta qualidade (${a.qualityScore}%)`);
  if (ref.status === 'trusted') bits.push('marcado como confiável');
  if ((a.featureCount || 0) > 0) bits.push(`${a.featureCount} feature(s)`);
  if ((a.stepCount || 0) > 0) bits.push(`${a.stepCount} step(s)`);
  return bits.slice(0,5).join('; ') || `referência geral disponível (score ${score})`;
}
