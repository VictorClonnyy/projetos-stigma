/*
 * Apickli Studio v3 — Info Page
 * Arquivo modular gerado a partir do HTML original.
 */

// ═══════════════════════════════════
// INFO PAGE
// ═══════════════════════════════════
function renderInfoPage() {
  if (!swaggerData) {
    document.getElementById('info-no-sw').style.display = 'block';
    document.getElementById('info-content').style.display = 'none';
    return;
  }
  document.getElementById('info-no-sw').style.display = 'none';
  document.getElementById('info-content').style.display = 'block';

  const sw = swaggerData;
  const info = sw.info || {};
  const isV3 = !!sw.openapi;
  const allMethods = swaggerEndpoints.length > 0 ? swaggerEndpoints : [];

  const methodCounts = {};
  allMethods.forEach(m => { methodCounts[m.method] = (methodCounts[m.method]||0)+1; });

  // API summary
  document.getElementById('info-summary-body').innerHTML = `
    <div class="row g-3">
      <div class="col-md-4">
        <div style="font-size:20px;font-weight:800;color:var(--blue);">${info.title || 'API'}</div>
        <div style="font-size:12px;color:var(--muted);">v${info.version||'?'}</div>
        ${info.description ? `<div style="font-size:12px;margin-top:6px;color:var(--text2);">${info.description.substring(0,200)}</div>` : ''}
        ${info.contact ? `<div style="font-size:11px;margin-top:6px;color:var(--muted);">📧 ${info.contact.email||''} ${info.contact.name||''}</div>` : ''}
      </div>
      <div class="col-md-4">
        <div style="font-size:12px;font-weight:700;margin-bottom:8px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;">Métodos HTTP</div>
        <div class="d-flex flex-wrap gap-2">
          ${Object.entries(methodCounts).map(([m,c]) => `<span class="method-badge method-${m}">${m} <b>(${c})</b></span>`).join('')}
        </div>
        <div style="margin-top:10px;font-size:13px;font-weight:700;">${allMethods.length} endpoint(s) no total</div>
        ${sw.tags?.length ? `<div style="margin-top:8px;font-size:11px;color:var(--muted);">Tags: ${sw.tags.map(t=>`<span style="background:#f0f1f3;padding:1px 7px;border-radius:10px;margin-right:4px;">${t.name}</span>`).join('')}</div>` : ''}
      </div>
      <div class="col-md-4">
        <div style="font-size:12px;font-weight:700;margin-bottom:6px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;">Servidor</div>
        <div style="font-size:12px;font-family:var(--mono);color:var(--text2);">
          ${isV3 ? (sw.servers?.map(s=>`<div>${s.url}</div>`).join('')||'N/A') : ((sw.host||'') + (sw.basePath||''))}
        </div>
        ${sw.securityDefinitions || sw.components?.securitySchemes ? `<div style="margin-top:8px;font-size:11px;font-weight:700;color:var(--muted);">🔐 Autenticação: ${Object.keys(sw.securityDefinitions||sw.components?.securitySchemes||{}).join(', ')}</div>` : ''}
        ${projectStructure ? `<div class="status-pill ok" style="margin-top:8px;display:inline-flex;">📦 Backend ZIP carregado</div>` : ''}
      </div>
    </div>`;

  // Endpoint list
  document.getElementById('info-ep-count-badge').textContent = `(${allMethods.length})`;
  const list = document.getElementById('info-ep-list');
  list.innerHTML = '';
  allMethods.forEach((ep, i) => {
    const div = document.createElement('div');
    div.className = 'ep-sel-item' + (ep.status === 'done' ? ' done' : '');
    div.onclick = () => renderInfoEndpointDetail(i);
    div.innerHTML = `
      <span class="method-badge method-${ep.method}">${ep.method}</span>
      <div style="flex:1;min-width:0;">
        <div class="ep-path">${ep.path}</div>
        <div style="font-size:10.5px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${ep.op.summary||''}</div>
      </div>`;
    list.appendChild(div);
  });
}

function renderInfoEndpointDetail(i) {
  if (!swaggerEndpoints[i]) return;
  const ep = swaggerEndpoints[i];
  document.getElementById('info-ep-placeholder').style.display = 'none';
  document.getElementById('info-ep-detail').style.display = 'block';
  document.getElementById('info-ep-detail-title').innerHTML = `<span class="method-badge method-${ep.method}" style="margin-right:6px;">${ep.method}</span>${ep.path}`;

  const reqParams = ep.params.filter(p => p.required);
  const optParams = ep.params.filter(p => !p.required);
  const headerParams = ep.params.filter(p => p.in === 'header');
  const pathParams = ep.params.filter(p => p.in === 'path');
  const queryParams = ep.params.filter(p => p.in === 'query');

  let html = '';
  if (ep.op.summary || ep.op.description) html += `<div class="alert alert-info" style="margin-bottom:12px;">${ep.op.summary || ''} ${ep.op.description && ep.op.description !== ep.op.summary ? '<br><small style="opacity:.7;">'+ep.op.description.substring(0,200)+'</small>' : ''}</div>`;

  // Tags / operationId
  const meta = [];
  if (ep.op.operationId) meta.push(`<span style="font-family:var(--mono);font-size:11px;">🔑 ${ep.op.operationId}</span>`);
  if (ep.op.tags?.length) meta.push(`🏷️ ${ep.op.tags.join(', ')}`);
  if (meta.length) html += `<div style="font-size:11px;color:var(--muted);margin-bottom:12px;">${meta.join(' &nbsp;|&nbsp; ')}</div>`;

  if (headerParams.length > 0) {
    html += `<div style="font-size:11.5px;font-weight:700;margin-bottom:7px;">📨 Headers (${headerParams.length})</div>`;
    html += `<table class="param-table" style="margin-bottom:14px;"><thead><tr><th>Nome</th><th>Tipo</th><th>Req.</th><th>Descrição</th></tr></thead><tbody>`;
    headerParams.forEach(p => {
      html += `<tr><td><b>${p.name}</b></td><td><span class="type-badge">${p.type}</span></td><td>${p.required?`<span class="req-badge">required</span>`:`<span class="opt-badge">opt</span>`}</td><td style="color:var(--muted);font-size:11px;">${p.description}</td></tr>`;
    });
    html += '</tbody></table>';
  }
  if (pathParams.length > 0) {
    html += `<div style="font-size:11.5px;font-weight:700;margin-bottom:7px;">📍 Parâmetros de Path</div>`;
    html += `<table class="param-table" style="margin-bottom:14px;"><thead><tr><th>Nome</th><th>Tipo</th><th>Descrição</th></tr></thead><tbody>`;
    pathParams.forEach(p => { html += `<tr><td><b>${p.name}</b> <span class="req-badge">required</span></td><td><span class="type-badge">${p.type}</span></td><td style="color:var(--muted);font-size:11px;">${p.description}</td></tr>`; });
    html += '</tbody></table>';
  }
  if (queryParams.length > 0) {
    html += `<div style="font-size:11.5px;font-weight:700;margin-bottom:7px;">🔍 Query Params</div>`;
    html += `<table class="param-table" style="margin-bottom:14px;"><thead><tr><th>Nome</th><th>Req.</th><th>Tipo</th><th>Descrição</th></tr></thead><tbody>`;
    queryParams.forEach(p => { html += `<tr><td><b>${p.name}</b></td><td>${p.required?`<span class="req-badge">req</span>`:`<span class="opt-badge">opt</span>`}</td><td><span class="type-badge">${p.type}</span></td><td style="color:var(--muted);font-size:11px;">${p.description}</td></tr>`; });
    html += '</tbody></table>';
  }

  if (ep.bodySchema) {
    const fields = []; flatSchema(ep.bodySchema, '', fields);
    const reqF = fields.filter(f => f.required), optF = fields.filter(f => !f.required);
    html += `<div style="font-size:11.5px;font-weight:700;margin:8px 0 7px;">📤 Request Body Schema</div>`;
    if (reqF.length) {
      html += `<div style="font-size:11px;color:var(--red);font-weight:700;margin:4px 0;">Campos obrigatórios (${reqF.length}):</div>`;
      html += '<div style="font-family:var(--mono);font-size:11px;background:#f8f9fa;padding:8px;border-radius:6px;line-height:2;">';
      reqF.forEach(f => { html += `<span class="req-badge" style="margin:2px;">${f.path}</span> `; });
      html += '</div>';
    }
    if (optF.length) {
      html += `<div style="font-size:11px;color:var(--muted);font-weight:700;margin:6px 0 4px;">Campos opcionais (${optF.length}):</div>`;
      html += '<div style="font-family:var(--mono);font-size:11px;background:#f8f9fa;padding:8px;border-radius:6px;line-height:2;">';
      optF.forEach(f => { html += `<span class="opt-badge" style="margin:2px;">${f.path}</span> `; });
      html += '</div>';
    }
    html += `<div style="margin-top:10px;"><div style="font-size:11px;font-weight:700;color:var(--muted);margin-bottom:5px;">Exemplo de body:</div><pre style="background:#0d1117;color:#c9d1d9;padding:10px;border-radius:6px;font-size:11px;overflow-x:auto;">${JSON.stringify(buildExampleBody(ep.bodySchema), null, 2)}</pre></div>`;
  }

  // Responses
  const responses = ep.op.responses || {};
  if (Object.keys(responses).length > 0) {
    html += `<div style="font-size:11.5px;font-weight:700;margin:12px 0 7px;">📥 Respostas</div>`;
    html += `<table class="param-table"><thead><tr><th>Código</th><th>Descrição</th></tr></thead><tbody>`;
    Object.entries(responses).forEach(([code, res]) => {
      const color = code.startsWith('2') ? 'var(--green)' : code.startsWith('4') || code.startsWith('5') ? 'var(--red)' : 'var(--orange)';
      html += `<tr><td><b style="color:${color};">${code}</b></td><td style="font-size:11px;color:var(--muted);">${res.description||''}</td></tr>`;
    });
    html += '</tbody></table>';
  }

  if (ep.params.length === 0 && !ep.bodySchema) html += '<div class="alert alert-info">Nenhum parâmetro detectado neste endpoint.</div>';

  document.getElementById('info-ep-detail-body').innerHTML = html;
}
