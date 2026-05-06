const XLSX = require('../xlsx.full.min.js');
const {
  DENOM_ORDER,
  classify,
  partsToCounts,
  parseSalary,
  isHeaderRow,
  isEmptyRow,
} = require('./classify');

const EXPORT_HEADERS = [
  '姓名',
  '薪水',
  '50000纸币',
  '25000纸币',
  '10000纸币',
  '5000纸币',
  '1000纸币',
];

function rowsToBatchRows(rows, selectedDenoms) {
  let start = 0;
  if (rows.length && isHeaderRow(rows[0])) start = 1;

  const result = [];
  const badLines = [];
  for (let i = start; i < rows.length; i += 1) {
    const row = rows[i];
    if (isEmptyRow(row)) continue;

    const name = String(row[0] ?? '').trim();
    const salary = parseSalary(row[1]);
    if (!name && !Number.isFinite(salary)) continue;

    if (!Number.isFinite(salary) || salary < 0) {
      badLines.push(i + 1);
      continue;
    }

    const { parts, remainder } = classify(salary, selectedDenoms);
    result.push({
      name: name || '（未命名）',
      salary,
      counts: partsToCounts(parts),
      remainder,
    });
  }

  return { rows: result, badLines };
}

function buildWorkbook(batchRows) {
  const aoa = [EXPORT_HEADERS];
  batchRows.forEach((r) => {
    aoa.push([
      r.name,
      r.salary,
      r.counts[50000],
      r.counts[25000],
      r.counts[10000],
      r.counts[5000],
      r.counts[1000],
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '配钞结果');
  return wb;
}

function dateStamp() {
  const d = new Date();
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(
    d.getMinutes(),
  )}`;
}

function readRowsFromArrayBuffer(buffer) {
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error('工作簿中没有工作表');
  const sheet = wb.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
}

function workbookToArrayBuffer(workbook) {
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
}

module.exports = {
  DENOM_ORDER,
  EXPORT_HEADERS,
  rowsToBatchRows,
  buildWorkbook,
  dateStamp,
  readRowsFromArrayBuffer,
  workbookToArrayBuffer,
};
