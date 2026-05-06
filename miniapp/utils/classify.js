const DENOM_ORDER = [50000, 25000, 10000, 5000, 1000];

function classify(amount, denominations) {
  const sorted = [...denominations].sort((a, b) => b - a);
  let remainder = Math.trunc(amount);
  const parts = [];

  sorted.forEach((d) => {
    if (d <= 0 || !Number.isFinite(d)) return;
    if (remainder >= d) {
      const count = Math.floor(remainder / d);
      remainder %= d;
      if (count > 0) parts.push({ denom: d, count });
    }
  });

  return { parts, remainder };
}

function partsToCounts(parts) {
  const counts = {};
  DENOM_ORDER.forEach((d) => {
    counts[d] = 0;
  });
  parts.forEach((p) => {
    counts[p.denom] = p.count;
  });
  return counts;
}

function parseSalary(value) {
  if (value === '' || value === null || value === undefined) return NaN;
  if (typeof value === 'number' && !Number.isNaN(value)) return Math.round(value);
  const s = String(value).trim().replace(/[,，\s]/g, '');
  const n = parseFloat(s);
  return Number.isFinite(n) ? Math.round(n) : NaN;
}

function isHeaderRow(row) {
  if (!row || !row.length) return false;
  const a = String(row[0] ?? '').trim();
  const b = String(row[1] ?? '').trim();
  return /姓名|名字/i.test(a) || /薪水|工资|薪资|薪酬|金额/i.test(b);
}

function isEmptyRow(row) {
  return !row || row.every((c) => c === '' || c === null || c === undefined);
}

function formatInt(n) {
  return Number(n || 0).toLocaleString('zh-CN');
}

module.exports = {
  DENOM_ORDER,
  classify,
  partsToCounts,
  parseSalary,
  isHeaderRow,
  isEmptyRow,
  formatInt,
};
