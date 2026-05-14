/*
 * Apickli Studio — Diff antes/depois v4
 */

function buildLineDiff(before, after) {
  const a = String(before || '').split('\n');
  const b = String(after || '').split('\n');
  const max = Math.max(a.length, b.length);
  const out = [];
  for (let i = 0; i < max; i++) {
    if (a[i] === b[i]) continue;
    if (a[i] !== undefined) out.push(`- ${a[i]}`);
    if (b[i] !== undefined) out.push(`+ ${b[i]}`);
  }
  return out.join('\n') || 'Nenhuma mudança detectada.';
}

function summarizeDiff(before, after) {
  const diff = buildLineDiff(before, after).split('\n');
  return {
    removed: diff.filter(l => l.startsWith('- ')).length,
    added: diff.filter(l => l.startsWith('+ ')).length,
    text: diff.join('\n')
  };
}
