/*
 * Apickli Studio v3 — Swagger Helpers
 * Arquivo modular gerado a partir do HTML original.
 */

// ═══════════════════════════════════
// SWAGGER HELPERS
// ═══════════════════════════════════
function buildFeatureName(path, method, sw) {
  if (projectStructure) {
    const featPaths = Object.keys(projectStructure.features);
    for (const fp of featPaths) {
      const content = projectStructure.features[fp];
      const match = content.match(/^Feature:\s*(.+)$/m);
      if (match) return match[1].trim();
    }
  }
  const title = (sw.info?.title || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const parts = path.split('/').filter(p => p && !p.startsWith('{'));
  const version = (path.match(/\/(v\d+)/) || [])[1] || '';
  if (title) return title;
  const baseName = parts.slice(0, 4).join('-').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'api';
  return baseName + (version ? '-' + version : '');
}

function extractParams(op, sw, isV3) {
  const params = [];
  (op.parameters || []).forEach(p => {
    let param = p;
    if (p.$ref) {
      const rp = p.$ref.replace('#/','').split('/');
      let ref = sw; rp.forEach(k => ref = ref?.[k]);
      param = ref || p;
    }
    params.push({
      name: param.name, in: param.in,
      required: param.required || param.in === 'path',
      type: param.schema?.type || param.type || 'string',
      description: param.description || ''
    });
  });
  return params;
}

function extractBodySchema(op, sw, isV3) {
  let schema = null;
  if (isV3) {
    const rb = op.requestBody;
    if (rb) {
      const content = rb.content || {};
      schema = (content['application/json'] || Object.values(content)[0])?.schema;
    }
  } else {
    const bp = (op.parameters || []).find(p => p.in === 'body');
    if (bp) schema = bp.schema;
  }
  if (schema?.$ref) {
    const rp = schema.$ref.replace('#/','').split('/');
    let ref = sw; rp.forEach(k => ref = ref?.[k]);
    schema = ref;
  }
  return schema;
}

function flatSchema(schema, prefix, result, reqFields) {
  if (!schema) return;
  const req = schema.required || reqFields || [];
  Object.entries(schema.properties || {}).forEach(([k, v]) => {
    const path = prefix ? prefix + '.' + k : k;
    const isReq = req.includes(k);
    if (v.type === 'object' || v.properties) flatSchema(v, path, result, v.required || []);
    else result.push({ path, type: v.type || 'any', required: isReq });
  });
}

function buildExampleBody(schema, depth=0) {
  if (!schema || depth > 4 || schema.$ref) return {};
  if (schema.example !== undefined) return schema.example;
  if (schema.type === 'string') return schema.enum?.[0] || 'example';
  if (schema.type === 'number' || schema.type === 'integer') return 0;
  if (schema.type === 'boolean') return true;
  if (schema.type === 'array') return [buildExampleBody(schema.items, depth+1)];
  if (schema.type === 'object' || schema.properties) {
    const obj = {};
    Object.entries(schema.properties || {}).forEach(([k,v]) => { obj[k] = buildExampleBody(v, depth+1); });
    return obj;
  }
  return null;
}



async function callOpenRouter(prompt, options = {}) {
  const key = options.key || getApiKey();
  if (!key) return '';

  const messages = [
    { role: 'user', content: prompt }
  ];

  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer': location.origin || 'http://localhost',
      'X-OpenRouter-Title': 'Apickli Studio'
    },
    body: JSON.stringify({
      model: options.model || OPENROUTER_MODEL,
      messages,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxOutputTokens || 4096
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    const msg = data.error?.message || data.message || `Erro HTTP ${response.status}`;
    throw new Error(msg);
  }

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('OpenRouter não retornou texto. Tente novamente ou escolha outro modelo grátis.');
  return text;
}

async function callOpenRouterChat(systemPrompt, history, key) {
  const recent = history.slice(-14);
  const messages = [
    { role: 'system', content: systemPrompt },
    ...recent.map(item => ({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: item.content
    }))
  ];

  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer': location.origin || 'http://localhost',
      'X-OpenRouter-Title': 'Apickli Studio'
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 2048
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    const msg = data.error?.message || data.message || `Erro HTTP ${response.status}`;
    throw new Error(msg);
  }

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('OpenRouter não retornou texto. Tente novamente ou escolha outro modelo grátis.');
  return text;
}
