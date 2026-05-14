/*
 * Apickli Studio v3 — Gerador — Swagger Import (Topo)
 * Arquivo modular gerado a partir do HTML original.
 */

// ═══════════════════════════════════
// GERADOR — SWAGGER IMPORT (topo)
// ═══════════════════════════════════
function dropGenFile(e, type) {
  e.preventDefault(); e.currentTarget.classList.remove('drag');
  const file = e.dataTransfer.files[0]; if (!file) return;
  if (type === 'zip') loadGenZip(file); else loadGenSwagger(file);
}

async function loadGenSwagger(file) {
  if (!file) return;
  document.getElementById('gen-sw-label').textContent = '⏳ Lendo ' + file.name + '...';
  try {
    const text = await file.text();
    swaggerData = file.name.endsWith('.yaml') || file.name.endsWith('.yml') ? jsyaml.load(text) : JSON.parse(text);
    document.getElementById('gen-sw-zone').classList.add('done');
    document.getElementById('gen-sw-label').textContent = '✅ ' + file.name;

    // Also share with chat
    chatSwaggerContext = swaggerData;
    updateChatContextUI(swaggerData);

    // Parse endpoints
    parseSwaggerEndpoints();
    autoFillFromSwagger();
    renderGenEndpointSelector();
    updatePostmanBox();
    updateGenIAButton();
  } catch(e) {
    document.getElementById('gen-sw-label').textContent = '❌ Erro: ' + e.message;
    showToast('Erro ao ler Swagger: ' + e.message, 'error');
  }
}

async function loadGenZip(file) {
  if (!file) return;
  document.getElementById('gen-zip-label').textContent = '⏳ Lendo ' + file.name + '...';
  try {
    const zip = await JSZip.loadAsync(file);
    projectStructure = { files: {}, paths: [], features: {}, stepDefs: {}, configs: {}, integConfig: null, bodyDefs: {} };
    const entries = Object.keys(zip.files).filter(k => !zip.files[k].dir);
    for (const path of entries) {
      projectStructure.paths.push(path);
      if (path.includes('node_modules') || path.includes('/.git/')) continue;
      if (/\.(js|json|feature|html|yaml|yml|md)$/.test(path)) {
        const content = await zip.files[path].async('string');
        projectStructure.files[path] = content;
        if (path.endsWith('.feature')) projectStructure.features[path] = content;
        if ((path.includes('step_definition') || path.includes('step_definitions') || path.includes('steps')) && path.endsWith('.js'))
          projectStructure.stepDefs[path] = content;
        if (path.endsWith('.json') && (path.includes('config') || path.includes('Config'))) {
          projectStructure.configs[path] = content;
          if (path.includes('integration') && path.includes('config')) {
            try { const parsed = JSON.parse(content); if (parsed.parameters?.apps) projectStructure.integConfig = parsed; } catch(e) {}
          }
        }
      }
    }

    // Detect apps
    detectedApps = { ok: '', nper: '', nq: '' };
    if (projectStructure.integConfig?.parameters?.apps) {
      const appNames = Object.keys(projectStructure.integConfig.parameters.apps);
      appNames.forEach(name => {
        const nl = name.toLowerCase();
        if (nl.includes('nper') || nl.includes('app-nper')) detectedApps.nper = name;
        else if (nl.includes('-nq') || nl.includes('app-nq')) detectedApps.nq = name;
        else if (nl.includes('-ok') || nl.includes('app-ok') || nl.includes('app_ok')) detectedApps.ok = name;
      });
      if (!detectedApps.ok && appNames.length > 0) detectedApps.ok = appNames[0];
      if (!detectedApps.nper && appNames.length > 1) detectedApps.nper = appNames[1];
      if (!detectedApps.nq && appNames.length > 2) detectedApps.nq = appNames[2];
    }

    // Auto-detect body defs
    projectStructure.bodyDefs = {};
    Object.entries(projectStructure.stepDefs).forEach(([path, content]) => {
      const matches = content.matchAll(/I generate body default (\w+)/g);
      for (const m of matches) {
        const suffix = m[1];
        const bodyMatch = content.match(new RegExp(`generate body default ${suffix}[\\s\\S]*?var bodyDef = JSON\\.stringify\\(([\\s\\S]*?)\\);`, 'm'));
        if (bodyMatch) projectStructure.bodyDefs[suffix] = bodyMatch[1].trim();
      }
    });

    // Auto-fill UI
    autoFillFromZip();
    document.getElementById('gen-zip-zone').classList.add('done');
    document.getElementById('gen-zip-label').textContent = '✅ ' + file.name;
    updateGenIAButton();

    const appCount = Object.keys(projectStructure.integConfig?.parameters?.apps || {}).length;
    const bodyCount = Object.keys(projectStructure.bodyDefs).length;
    showToast(`ZIP carregado: ${appCount} apps, ${bodyCount} bodies detectados`);
  } catch(e) {
    document.getElementById('gen-zip-label').textContent = '❌ Erro: ' + e.message;
    showToast('Erro ao ler ZIP: ' + e.message, 'error');
  }
}

function autoFillFromZip() {
  if (detectedApps.ok && !document.getElementById('appOk').value) {
    document.getElementById('appOk').value = detectedApps.ok;
    document.getElementById('appNp').value = detectedApps.nper;
    document.getElementById('appNq').value = detectedApps.nq;
    document.getElementById('apps-auto-tag').style.display = 'inline';
  }
  const suffixes = Object.keys(projectStructure.bodyDefs);
  if (suffixes.length > 0 && !document.getElementById('bs').value)
    document.getElementById('bs').value = suffixes[0];

  // Pre-fill tokens if available in config
  if (projectStructure.integConfig?.parameters?.apps) {
    const apps = projectStructure.integConfig.parameters.apps;
    if (detectedApps.ok && apps[detectedApps.ok] && !document.getElementById('tokOk').value)
      document.getElementById('tokOk').value = apps[detectedApps.ok].authHeaderValue || '';
    if (detectedApps.nper && apps[detectedApps.nper] && !document.getElementById('tokNp').value)
      document.getElementById('tokNp').value = apps[detectedApps.nper].authHeaderValue || '';
    if (detectedApps.nq && apps[detectedApps.nq] && !document.getElementById('tokNq').value)
      document.getElementById('tokNq').value = apps[detectedApps.nq].authHeaderValue || '';
  }

  // Feature name from ZIP
  const featPaths = Object.keys(projectStructure.features);
  if (featPaths.length > 0 && !document.getElementById('fn').value) {
    const intFeat = featPaths.find(p => p.includes('integration'));
    const content = projectStructure.features[intFeat || featPaths[0]];
    const m = content.match(/^Feature:\s*(.+)$/m);
    if (m) { document.getElementById('fn').value = m[1].trim(); document.getElementById('id-auto-tag').style.display='inline'; }
  }
}

function parseSwaggerEndpoints() {
  if (!swaggerData) return;
  const sw = swaggerData;
  const isV3 = !!sw.openapi;
  swaggerEndpoints = [];
  Object.entries(sw.paths || {}).forEach(([path, methods]) => {
    Object.entries(methods).forEach(([method, op]) => {
      if (['get','post','put','delete','patch'].includes(method)) {
        const featureName = buildFeatureName(path, method, sw);
        const params = extractParams(op, sw, isV3);
        const bodySchema = extractBodySchema(op, sw, isV3);
        swaggerEndpoints.push({ path, method: method.toUpperCase(), op, featureName, params, bodySchema, status: 'pending', feature: '', steps: '', config: '', isV3 });
      }
    });
  });
}

function autoFillFromSwagger() {
  if (!swaggerData || swaggerEndpoints.length === 0) return;
  const sw = swaggerData;

  // If only one endpoint, auto-select it and fill fields
  if (swaggerEndpoints.length === 1) {
    selectGenEndpoint(0);
  } else {
    // Show status banner
    const info = sw.info || {};
    document.getElementById('gen-sw-status').style.display = 'block';
    document.getElementById('gen-sw-status').innerHTML = `
      <div class="sw-loaded-banner">
        <div>
          <div class="sw-title">${info.title || 'API'} <span style="font-size:11px;font-weight:400;color:var(--muted);">v${info.version||'?'}</span></div>
          <div class="sw-meta">${swaggerEndpoints.length} endpoint(s) detectado(s) — selecione abaixo para preencher automaticamente</div>
        </div>
        <div class="status-pill ok" style="margin-left:auto;">✅ Swagger OK</div>
      </div>`;
  }

  document.getElementById('body-swagger-hint').style.display = 'block';
  document.getElementById('body-manual-hint').style.display = 'none';
  document.getElementById('body-auto-tag').style.display = 'inline';
}

function renderGenEndpointSelector() {
  if (!swaggerEndpoints.length) return;
  const wrap = document.getElementById('gen-ep-selector-wrap');
  const list = document.getElementById('gen-ep-list');
  wrap.style.display = 'block';
  document.getElementById('gen-ep-count').textContent = `(${swaggerEndpoints.length} encontrado${swaggerEndpoints.length>1?'s':''})`;
  list.innerHTML = '';
  swaggerEndpoints.forEach((ep, i) => {
    const div = document.createElement('div');
    div.className = 'ep-sel-item' + (i === selectedGenEpIndex ? ' active' : '') + (ep.status === 'done' ? ' done' : '');
    div.onclick = () => selectGenEndpoint(i);
    div.innerHTML = `
      <span class="method-badge method-${ep.method}">${ep.method}</span>
      <div style="flex:1;min-width:0;">
        <div class="ep-path">${ep.path}</div>
        <div class="ep-summary" style="font-size:10.5px;color:var(--muted);">${ep.op.summary || ''}</div>
      </div>
      <span style="font-size:10px;color:var(--green);font-weight:700;">${ep.status==='done'?'✅':''}</span>`;
    list.appendChild(div);
  });
}

function selectGenEndpoint(i) {
  selectedGenEpIndex = i;
  const ep = swaggerEndpoints[i];
  const sw = swaggerData;

  // Fill identification fields
  document.getElementById('fn').value = ep.featureName;
  document.getElementById('ep').value = ep.path;
  // Set HTTP method
  const vbSel = document.getElementById('vb');
  for (let o of vbSel.options) { if (o.value === ep.method) { vbSel.value = ep.method; break; } }

  // Auto background from summary
  if (ep.op.summary || ep.op.description) {
    if (!document.getElementById('bg').value)
      document.getElementById('bg').value = ep.op.summary || ep.op.description;
  }

  document.getElementById('id-auto-tag').style.display = 'inline';

  // Auto error code prefixes from swagger info/title
  autoFillErrorPrefixes(ep, sw);

  // Auto body from schema
  if (ep.bodySchema) {
    const exBody = buildExampleBody(ep.bodySchema);
    document.getElementById('bdef').value = JSON.stringify(exBody, null, 2);
    document.getElementById('bdef-auto-tag').style.display = 'inline';

    // Auto body suffix
    const pathParts = ep.path.split('/').filter(p => p && !p.startsWith('{'));
    if (!document.getElementById('bs').value)
      document.getElementById('bs').value = pathParts[pathParts.length-1] || 'default';

    // Auto schema fields
    document.getElementById('sch').value = JSON.stringify(exBody, null, 2);
    document.getElementById('sch-auto-tag').style.display = 'inline';

    // Auto-analyze schema and auto-mark required fields
    mfields.clear();
    autoAnalyzeSchema(ep.bodySchema);
  }

  document.getElementById('body-swagger-hint').style.display = 'block';
  document.getElementById('body-auto-tag').style.display = 'inline';

  renderGenEndpointSelector();
  updatePostmanBox();
  updateGenIAButton();
}

function autoFillErrorPrefixes(ep, sw) {
  // Try to derive from title or x-extensions or existing values
  if (document.getElementById('ep400').value && document.getElementById('epx').value) return;

  const title = (sw.info?.title || '').toUpperCase().replace(/\s+/g,'-').replace(/[^A-Z0-9-]/g,'');
  const pathKey = ep.path.split('/').filter(p=>p&&!p.startsWith('{')).join('-').toUpperCase().replace(/[^A-Z0-9-]/g,'');

  // Look in swagger x-error-prefix or similar extensions
  const ext400 = sw['x-error-prefix-400'] || sw.info?.['x-error-prefix-400'];
  const extx = sw['x-error-prefix'] || sw.info?.['x-error-prefix'];

  if (ext400 && !document.getElementById('ep400').value) document.getElementById('ep400').value = ext400;
  if (extx && !document.getElementById('epx').value) document.getElementById('epx').value = extx;

  // Fallback: derive from title
  if (!document.getElementById('ep400').value && title) {
    const shortTitle = title.replace(/^API-?/,'').slice(0, 20);
    document.getElementById('ep400').value = 'API-' + shortTitle;
    document.getElementById('epx').value = 'API-CLR-' + shortTitle;
    document.getElementById('ec-auto-tag').style.display = 'inline';
  }
}

function autoAnalyzeSchema(schema) {
  // Extract required fields from schema and pre-populate mfields
  const fields = [];
  flatSchema(schema, '', fields);
  const reqFields = fields.filter(f => f.required);

  // Build the visual schema tree
  flist = [];
  flatJSON(buildExampleBody(schema), '', flist);
  const c = document.getElementById('sfl'); c.innerHTML = '';
  flist.forEach(f => {
    const isReq = reqFields.some(r => r.path === f.path);
    const row = document.createElement('div'); row.className = 'frow';
    const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = isReq;
    const sp = document.createElement('span'); sp.className = 'fpath'; sp.textContent = f.path;
    const ft = document.createElement('span'); ft.className = 'ftype'; ft.textContent = f.type;
    const mi = document.createElement('input'); mi.className = 'fmsg'; mi.placeholder = 'Message'; mi.value = 'Invalid Argument';
    const di = document.createElement('input'); di.className = 'fdetail'; di.placeholder = 'DetailedMessage'; di.value = `Campo '${f.path.split('.').pop()}' é obrigatório`;
    if (isReq) mfields.set(f.path, { message: mi.value, detail: di.value });
    const update = () => { cb.checked ? mfields.set(f.path,{message:mi.value,detail:di.value}) : mfields.delete(f.path); };
    cb.onchange = update; mi.oninput = update; di.oninput = update;
    row.append(cb, sp, ft, mi, di);
    c.appendChild(row);
  });

  if (flist.length > 0) {
    document.getElementById('sfc').style.display = 'block';
    document.getElementById('sts').textContent = flist.length + ' campos | ' + mfields.size + ' obrigatórios (do Swagger)';
  }
}

function updateGenIAButton() {
  const btn = document.getElementById('btn-gen-ia');
  if (!btn) return;
  const hasSwagger = swaggerEndpoints.length > 0;
  const hasKey = !!apiKey;
  btn.disabled = !hasSwagger || !hasKey;
  document.getElementById('gen-ia-status').textContent =
    !hasSwagger ? '⚠️ Carregue um Swagger para usar a IA' :
    !hasKey ? '⚠️ Configure a API Key do OpenRouter para usar IA' : '';
}

// ═══════════════════════════════════
// POSTMAN COLLECTION — a partir do Swagger/OpenAPI
// ═══════════════════════════════════
function updatePostmanBox() {
  const box = document.getElementById('postman-box');
  const status = document.getElementById('postman-status');
  const serverStatus = document.getElementById('postman-server-status');
  const nameInput = document.getElementById('postman-collection-name');
  if (!box || !status) return;
  const count = swaggerEndpoints?.length || 0;
  box.style.display = count ? 'flex' : 'none';
  status.textContent = count
    ? `${count} método(s) detectado(s). A collection inclui URL, método, headers obrigatórios, parâmetros e body de exemplo.`
    : 'Carregue um Swagger para gerar a collection.';
  if (count && nameInput && !nameInput.value.trim()) {
    const title = swaggerData?.info?.title || 'API';
    nameInput.value = `${title} - Test SaaS`;
  }
  if (serverStatus) {
    const baseUrl = getSwaggerBaseUrl(swaggerData);
    serverStatus.textContent = count ? `Servidor da collection: ${baseUrl} (Test SaaS)` : 'Servidor: Test SaaS';
  }
}

function serverScoreForTestSaas(server) {
  const text = `${server?.url || ''} ${server?.description || ''}`.toLowerCase();
  let score = 0;
  if (/test|teste|testing|homolog|hml|qa|sandbox/.test(text)) score += 5;
  if (/saas/.test(text)) score += 5;
  if (/test.*saas|saas.*test|teste.*saas|saas.*teste/.test(text)) score += 10;
  return score;
}

function getSwaggerBaseUrl(sw) {
  if (!sw) return '{{baseUrl}}';

  // OpenAPI 3.x: sempre prioriza o server de Test SaaS, quando informado no Swagger.
  if (sw.openapi && Array.isArray(sw.servers) && sw.servers.length) {
    const ranked = sw.servers
      .filter(s => s?.url)
      .map(s => ({ server: s, score: serverScoreForTestSaas(s) }))
      .sort((a, b) => b.score - a.score);
    if (ranked[0]?.score > 0) return ranked[0].server.url.replace(/\/$/, '');
    return ranked[0]?.server.url?.replace(/\/$/, '') || '{{baseUrl}}';
  }

  // Swagger 2.0: usa host/basePath do arquivo, normalmente já apontando para o ambiente configurado.
  const scheme = (sw.schemes && sw.schemes[0]) || 'https';
  const host = sw.host || '{{host}}';
  const basePath = sw.basePath || '';
  return `${scheme}://${host}${basePath}`.replace(/\/$/, '');
}

function getPostmanCollectionName() {
  const input = document.getElementById('postman-collection-name');
  const typedName = input?.value?.trim();
  if (typedName) return typedName;
  return `${swaggerData?.info?.title || 'API'} - Test SaaS`;
}

function resolveSwaggerRef(ref, sw) {
  if (!ref || !String(ref).startsWith('#/')) return null;
  return String(ref).replace('#/','').split('/').reduce((acc, key) => acc?.[key], sw);
}

function collectSecurityHeaders(sw, op) {
  const result = [];
  const security = op.security || sw.security || [];
  const schemes = sw.components?.securitySchemes || sw.securityDefinitions || {};
  security.forEach(sec => {
    Object.keys(sec || {}).forEach(name => {
      const scheme = schemes[name];
      if (!scheme) return;
      if ((scheme.type === 'apiKey') && scheme.in === 'header' && scheme.name) {
        result.push({ key: scheme.name, value: `{{${scheme.name}}}`, description: scheme.description || `Header de segurança: ${name}` });
      }
      if ((scheme.type === 'http' && String(scheme.scheme).toLowerCase() === 'bearer') || scheme.type === 'oauth2') {
        result.push({ key: 'Authorization', value: 'Bearer {{token}}', description: scheme.description || `Autenticação ${name}` });
      }
      if (scheme.type === 'basic') {
        result.push({ key: 'Authorization', value: 'Basic {{basicToken}}', description: scheme.description || `Autenticação ${name}` });
      }
    });
  });
  return result;
}

function buildPostmanHeaders(ep, sw) {
  const headers = [];
  const add = (key, value, description='') => {
    if (!key || headers.some(h => h.key.toLowerCase() === String(key).toLowerCase())) return;
    headers.push({ key, value, description, type: 'text' });
  };

  (ep.params || []).filter(p => p.in === 'header' && p.required).forEach(p => {
    add(p.name, `{{${p.name}}}`, p.description || 'Header obrigatório pelo Swagger');
  });
  collectSecurityHeaders(sw, ep.op || {}).forEach(h => add(h.key, h.value, h.description));

  const hasBody = !!ep.bodySchema || !!(ep.op?.requestBody) || (ep.op?.parameters || []).some(p => p.in === 'body');
  if (hasBody) add('Content-Type', 'application/json', 'Body JSON');
  add('Accept', 'application/json', 'Response JSON');
  return headers;
}

function buildPostmanQuery(ep) {
  return (ep.params || [])
    .filter(p => p.in === 'query')
    .map(p => ({ key: p.name, value: p.required ? `{{${p.name}}}` : '', description: p.description || '', disabled: !p.required }));
}

function buildPostmanUrl(ep) {
  const rawPath = ep.path.replace(/{([^}]+)}/g, ':$1');
  const variable = (ep.params || []).filter(p => p.in === 'path').map(p => ({ key: p.name, value: `{{${p.name}}}` }));
  const query = buildPostmanQuery(ep);
  return { raw: `{{baseUrl}}${rawPath}`, host: ['{{baseUrl}}'], path: rawPath.split('/').filter(Boolean), variable, query };
}

function buildPostmanBody(ep) {
  if (!ep.bodySchema) return undefined;
  let example = {};
  try { example = buildExampleBody(ep.bodySchema); } catch(e) { example = {}; }
  return { mode: 'raw', raw: JSON.stringify(example, null, 2), options: { raw: { language: 'json' } } };
}

function buildPostmanCollection() {
  if (!swaggerData || !swaggerEndpoints.length) throw new Error('Carregue um Swagger/OpenAPI antes de gerar a collection.');
  const info = swaggerData.info || {};
  const baseUrl = getSwaggerBaseUrl(swaggerData);
  const collection = {
    info: {
      name: getPostmanCollectionName(),
      description: info.description || 'Collection gerada automaticamente pelo Apickli Studio a partir do Swagger/OpenAPI usando o servidor Test SaaS.',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    variable: [
      { key: 'baseUrl', value: baseUrl },
      { key: 'token', value: '' },
      { key: 'basicToken', value: '' }
    ],
    item: []
  };

  swaggerEndpoints.forEach(ep => {
    const item = {
      name: `${ep.method} ${ep.path}`,
      request: {
        method: ep.method,
        header: buildPostmanHeaders(ep, swaggerData),
        url: buildPostmanUrl(ep),
        description: ep.op?.description || ep.op?.summary || ''
      },
      response: []
    };
    const body = buildPostmanBody(ep);
    if (body) item.request.body = body;
    collection.item.push(item);
  });
  return collection;
}

function downloadPostmanCollection() {
  try {
    const collection = buildPostmanCollection();
    const nameBase = getPostmanCollectionName().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'api-test-saas';
    const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/json;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${nameBase}.postman_collection.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
    showToast('Collection Postman gerada. Importe o JSON no Postman.');
  } catch(e) {
    showToast(e.message, 'error');
  }
}
