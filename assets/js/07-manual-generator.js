/*
 * Apickli Studio v3 — Gerador Manual
 * Arquivo modular gerado a partir do HTML original.
 */

// ═══════════════════════════════════
// GERADOR MANUAL
// ═══════════════════════════════════
function togChip(code, el) {
  if (code === '400-auto') {
    if (document.getElementById('sfc').style.display === 'none') {
      const schemaText = document.getElementById('sch')?.value?.trim();
      if (schemaText) analisar();
    }
    if (document.getElementById('sfc').style.display === 'none') { alert('Preencha o Schema para montar o cenário 400 automático.'); return; }
    if (mfields.size === 0) { alert('Marque pelo menos um campo obrigatório no Schema.'); return; }
    el.classList.toggle('on', !el.classList.contains('on')); return;
  }
  if (act.has(code)) { act.delete(code); el.classList.remove('on'); }
  else { act.add(code); el.classList.add('on'); }
}

function analisar() {
  const t = document.getElementById('sch').value.trim();
  if (!t) { alert('Cole o Schema primeiro.'); return; }
  let s; try { s = JSON.parse(t); } catch(e) { alert('JSON inválido!'); return; }
  flist = []; flatJSON(s, '', flist);
  const c = document.getElementById('sfl'); c.innerHTML = '';
  mfields.clear();
  flist.forEach(f => {
    const row = document.createElement('div'); row.className = 'frow';
    const cb = document.createElement('input'); cb.type = 'checkbox';
    const sp = document.createElement('span'); sp.className = 'fpath'; sp.textContent = f.path;
    const ft = document.createElement('span'); ft.className = 'ftype'; ft.textContent = f.type;
    const mi = document.createElement('input'); mi.className = 'fmsg'; mi.placeholder = 'Message'; mi.value = 'Invalid Argument';
    const di = document.createElement('input'); di.className = 'fdetail'; di.placeholder = 'DetailedMessage'; di.value = `Campo '${f.path.split('.').pop()}' é obrigatório`;
    const update = () => { cb.checked ? mfields.set(f.path,{message:mi.value,detail:di.value}) : mfields.delete(f.path); };
    cb.onchange = update; mi.oninput = update; di.oninput = update;
    row.append(cb, sp, ft, mi, di);
    c.appendChild(row);
  });
  document.getElementById('sfc').style.display = 'block';
  document.getElementById('sts').textContent = flist.length + ' campos | ' + mfields.size + ' marcados';
}

function flatJSON(o, p, r) {
  for (let k in o) {
    if (!Object.prototype.hasOwnProperty.call(o, k)) continue;
    const path = p ? p + '.' + k : k;
    const v = o[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) flatJSON(v, path, r);
    else r.push({ path, type: Array.isArray(v) ? 'array' : typeof v });
  }
}

function gerar() {
  const fn = document.getElementById('fn').value.trim();
  const bs = document.getElementById('bs').value.trim() || 'default';
  const ep = document.getElementById('ep').value.trim();
  const vb = document.getElementById('vb').value;
  const v405 = document.getElementById('v405').value;
  const ep400 = document.getElementById('ep400').value.trim();
  const epx = document.getElementById('epx').value.trim();
  const bg = document.getElementById('bg').value.trim();
  const aOk = document.getElementById('appOk').value.trim();
  const tOk = document.getElementById('tokOk').value.trim();
  const aNp = document.getElementById('appNp').value.trim();
  const tNp = document.getElementById('tokNp').value.trim();
  const aNq = document.getElementById('appNq').value.trim();
  const tNq = document.getElementById('tokNq').value.trim();
  const bdef = document.getElementById('bdef').value.trim();

  if (!fn || !ep || !aOk || !ep400 || !epx) {
    alert('Preencha: Feature Name, Endpoint, App OK (nome), Prefixos de ErrorCode.'); return;
  }

  const today = new Date().toLocaleDateString('pt-BR');
  let f = `##Author: Apickli Studio\n##Data: ${today}\n\n@apiproxy\nFeature: ${fn}\n\n  Background: ${bg || 'API ' + fn}\n    \n  @set-variables\n  Scenario: 0. Preparação das variáveis\n    Given I generate body default ${bs}\n    Given I set variable app_OK in global scope to Bearer \`access_token\`\n\n  Scenario: 0.1 Obtém token de autenticação\n    Given I use variables from app ${aOk}\n    And I set headers to\n      | name             | value                             |\n      | \`authHeaderName\` | \`authHeaderValue\`                 |\n      | Content-Type     | application/x-www-form-urlencoded |\n      | x-apigee-x       | true                              |\n    And I set form parameters to\n      | parameter  | value              |\n      | grant_type | client_credentials |\n    And I POST to /oauth2/v1/token\n    And I store the value of body path $.access_token as access_token in global scope\n`;

  const autoChip = document.getElementById('chips').querySelector('.chip.auto.on');
  if (mfields.size > 0 && autoChip) {
    f += `\n  Scenario Outline: API-CT-055.<code> Requisição com falha - <field> - COD 400\n    Given I set field "<field>" to "<value>" in body "Body_Default"\n    And I set headers to\n      | name          | value            |\n      | Authorization | \`app_OK\`         |\n      | Accept        | application/json |\n      | Content-Type  | application/json |\n      | x-apigee-x    | true             |\n    And I set body to \`Body_Default_${bs}\`\n    When I ${vb} ${ep}\n    And response body path $.apiVersion should be (.*)\n    And response body path $.transactionId should be (.*)\n    And response body path $.error.httpCode should be 400\n    And response body path $.error.errorCode should be ${ep400}-400\n    And response body path $.error.message should be <message>\n    And response body path $.error.detailedMessage should be <detailedMessage>\n    And response body path $.error.link.rel should be related\n    And response body path $.error.link.href should be https://api.claro.com.br/docs\n  Examples:\n    | code | field        | value | message          | detailedMessage                                     |\n`;
    let idx = 1;
    mfields.forEach((cfg, path) => {
      f += `    | ${String(idx++).padStart(4,'0')} | ${path} |       | ${cfg.message} | ${cfg.detail} |\n`;
    });
    f += '\n';
  }

  act.forEach(code => {
    if (code === '400-auto') return;
    if (code === '200') {
      f += `\n  Scenario: CT-200 - Sucesso - COD 200\n    Given I set headers to\n      | name          | value            |\n      | Authorization | \`app_OK\`         |\n      | Accept        | application/json |\n      | Content-Type  | application/json |\n      | x-apigee-x    | true             |\n    And I set body to \`Body_Default_${bs}\`\n    When I ${vb} ${ep}\n    Then response code should be 200\n    And response body should be valid json\n`;
    } else {
      f += gerarCenarioPadrao(code, bs, ep, vb, v405, epx, aNp, aNq);
    }
  });

  document.getElementById('tf').textContent = f;
  document.getElementById('originalFeature').value = f;

  let bf = '{}';
  if (bdef) { try { bf = JSON.stringify(JSON.parse(bdef), null, 2); } catch(e) { bf = bdef; } }
  document.getElementById('ts').textContent = generateStepsContent(bs, bf);
  document.getElementById('tc').textContent = generateConfigContent(aOk, tOk, aNp, tNp, aNq, tNq);
  saveState();
}

function generateStepsContent(bs, bodyJson) {
  return `'use strict';\n\nmodule.exports = function () {\n\n// Aguardar para evitar rate limit\nthis.When(/^I wait (\\d+) seconds$/, function (seconds, callback) {\n    setTimeout(function () { callback(); }, parseInt(seconds, 10) * 1000);\n});\n\n// Transformar parâmetro em null\nthis.Given(/^I set field "([^"]*)" to null in body "([^"]*)"$/, function (field, bodyName, callback) {\n    var bodyStr = this.apickli.getGlobalVariable(bodyName);\n    var body = JSON.parse(bodyStr);\n    var parts = field.replace(/\\[(\\d+)\\]/g, '.$1').split('.');\n    var obj = body;\n    for (var i = 0; i < parts.length - 1; i++) { obj = obj[parts[i]]; }\n    obj[parts[parts.length - 1]] = null;\n    this.apickli.setGlobalVariable(bodyName + '_modified', JSON.stringify(body));\n    callback();\n});\n\n// Alterar parâmetros no body\nthis.Given(/^I set field "([^"]*)" to "([^"]*)" in body "([^"]*)"$/, function (field, value, bodyName, callback) {\n    var bodyStr = this.apickli.getGlobalVariable(bodyName);\n    var body = JSON.parse(bodyStr);\n    var parts = field.replace(/\\[(\\d+)\\]/g, '.$1').split('.');\n    var obj = body;\n    for (var i = 0; i < parts.length - 1; i++) {\n        if (obj[parts[i]] === undefined) throw new Error('Path not found: ' + parts.slice(0, i+1).join('.'));\n        obj = obj[parts[i]];\n    }\n    obj[parts[parts.length - 1]] = value;\n    this.apickli.setGlobalVariable(bodyName + '_modified', JSON.stringify(body));\n    callback();\n});\n\n// Body default - ${bs}\nthis.Given(/^I generate body default ${bs}$/, function (callback) {\n    var bodyDef = JSON.stringify(${bodyJson});\n    this.apickli.setGlobalVariable('Body_Default_${bs}', bodyDef);\n    callback();\n});\n\n};\n`;
}

function generateConfigContent(aOk, tOk, aNp, tNp, aNq, tNq) {
  const cfg = { parameters: { domain: "api-test.claro.com.br", protocol: "https", port: "443", basepath: "", apps: {}, unitTesting: "false" } };
  if (aOk && tOk) cfg.parameters.apps[aOk] = { name: aOk, authHeaderName: "x-client-auth", authHeaderValue: tOk };
  if (aNp && tNp) cfg.parameters.apps[aNp] = { name: aNp, authHeaderName: "x-client-auth", authHeaderValue: tNp };
  if (aNq && tNq) cfg.parameters.apps[aNq] = { name: aNq, authHeaderName: "x-client-auth", authHeaderValue: tNq };
  return JSON.stringify(cfg, null, 4);
}

function gerarCenarioPadrao(code, bs, ep, vb, v405, epx, aNp, aNq) {
  const bv = `Body_Default_${bs}`;
  const T = {
    '401':`  Scenario: CT-401 - Authorization - COD 401\n    Given I set headers to\n      | name          | value            |\n      | Authorization |                  |\n      | accept        | application/json |\n      | Content-Type  | application/json |\n      | x-apigee-x    | true             |\n    And I set body to \`${bv}\`\n    When I ${vb} ${ep}\n    Then response code should be 401\n    And response body path $.apiVersion should be (.*)\n    And response body path $.transactionId should be (.*)\n    And response body path $.error.httpCode should be 401\n    And response body path $.error.errorCode should be ${epx}-401\n    And response body path $.error.message should be Unauthorized\n    And response body path $.error.detailedMessage should be Unauthorized\n    And response body path $.error.link.rel should be related\n    And response body path $.error.link.href should be https://api.claro.com.br/docs\n`,
    '403':`  Scenario: CT-403 - Forbidden - COD 403\n    Given I use variables from app ${aNp}\n    And I set headers to\n      | name          | value              |\n      | Authorization | \`authHeaderValue\` |\n      | accept        | application/json   |\n      | Content-Type  | application/json   |\n      | x-apigee-x    | true               |\n    And I set body to \`${bv}\`\n    When I ${vb} ${ep}\n    Then response code should be 403\n    And response body path $.apiVersion should be (.*)\n    And response body path $.transactionId should be (.*)\n    And response body path $.error.httpCode should be 403\n    And response body path $.error.errorCode should be ${epx}-403\n    And response body path $.error.message should be Forbidden\n    And response body path $.error.detailedMessage should be Client authorization failed.\n    And response body path $.error.link.rel should be related\n    And response body path $.error.link.href should be https://api.claro.com.br/docs\n`,
    '405':`  Scenario: CT-405 - Method Not Allowed - COD 405\n    Given I set headers to\n      | name          | value            |\n      | Authorization | \`app_OK\`         |\n      | accept        | application/json |\n      | Content-Type  | application/json |\n      | x-apigee-x    | true             |\n    And I set body to \`${bv}\`\n    When I ${v405} ${ep}\n    Then response code should be 405\n    And response body path $.apiVersion should be (.*)\n    And response body path $.transactionId should be (.*)\n    And response body path $.error.httpCode should be 405\n    And response body path $.error.errorCode should be ${epx}-405\n    And response body path $.error.message should be Method Not Allowed\n    And response body path $.error.detailedMessage should be Method not allowed\n    And response body path $.error.link.rel should be related\n    And response body path $.error.link.href should be https://api.claro.com.br/docs\n`,
    '406':`  Scenario: CT-406 - Not Acceptable - COD 406\n    Given I set headers to\n      | name          | value            |\n      | Authorization | \`app_OK\`         |\n      | accept        | text/plain       |\n      | Content-Type  | application/json |\n      | x-apigee-x    | true             |\n    And I set body to \`${bv}\`\n    When I ${vb} ${ep}\n    Then response code should be 406\n    And response body path $.apiVersion should be (.*)\n    And response body path $.transactionId should be (.*)\n    And response body path $.error.httpCode should be 406\n    And response body path $.error.errorCode should be ${epx}-406\n    And response body path $.error.message should be Not Acceptable\n    And response body path $.error.detailedMessage should be Requested content type not acceptable.\n    And response body path $.error.link.rel should be related\n    And response body path $.error.link.href should be https://api.claro.com.br/docs\n`,
    '415':`  Scenario: CT-415 - Unsupported Media Type - COD 415\n    Given I set headers to\n      | name          | value            |\n      | Authorization | \`app_OK\`         |\n      | accept        | application/json |\n      | Content-Type  | text/plain       |\n      | x-apigee-x    | true             |\n    And I set body to \`${bv}\`\n    When I ${vb} ${ep}\n    Then response code should be 415\n    And response body path $.apiVersion should be (.*)\n    And response body path $.transactionId should be (.*)\n    And response body path $.error.httpCode should be 415\n    And response body path $.error.errorCode should be ${epx}-415\n    And response body path $.error.message should be Unsupported Media Type\n    And response body path $.error.detailedMessage should be Unsupported request media type.\n    And response body path $.error.link.rel should be related\n    And response body path $.error.link.href should be https://api.claro.com.br/docs\n`,
    '429':`  Scenario: CT-429 - Too Many Requests - COD 429\n    Given I use variables from app ${aNq}\n    And I set headers to\n      | name          | value              |\n      | Authorization | \`authHeaderValue\` |\n      | accept        | application/json   |\n      | Content-Type  | application/json   |\n      | x-apigee-x    | true               |\n    And I set body to \`${bv}\`\n    When I ${vb} ${ep}\n    Then response code should be 429\n    And response body path $.apiVersion should be (.*)\n    And response body path $.transactionId should be (.*)\n    And response body path $.error.httpCode should be 429\n    And response body path $.error.errorCode should be ${epx}-429\n    And response body path $.error.message should be Too Many Requests\n    And response body path $.error.detailedMessage should be Quota check failed.\n    And response body path $.error.link.rel should be related\n    And response body path $.error.link.href should be https://api.claro.com.br/docs\n`
  };
  return '\n' + (T[code] || '') + '\n';
}

function stab(t) {
  ['f','s','c'].forEach(x => document.getElementById('t'+x).style.display = x===t?'block':'none');
  document.querySelectorAll('#page-gen .subtab').forEach((el,i) => el.classList.toggle('sel', i===['f','s','c'].indexOf(t)));
}
function copiar() {
  const el = ['tf','ts','tc'].find(id => document.getElementById(id).style.display !== 'none') || 'tf';
  navigator.clipboard.writeText(document.getElementById(el).textContent).then(() => showToast('Copiado!'));
}
function baixar() {
  const fn = document.getElementById('fn').value || 'api';
  dl(fn+'.feature', document.getElementById('tf').textContent);
  if (document.getElementById('ts').textContent) dl(fn+'_steps.js', document.getElementById('ts').textContent);
  if (document.getElementById('tc').textContent) dl(fn+'_config.json', document.getElementById('tc').textContent);
}
function dl(n,c) { const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([c],{type:'text/plain'})); a.download=n; a.click(); }
