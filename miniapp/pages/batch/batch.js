const {
  DENOM_ORDER,
  rowsToBatchRows,
  buildWorkbook,
  dateStamp,
  readRowsFromArrayBuffer,
  workbookToArrayBuffer,
} = require('../../utils/excel');
const { formatInt } = require('../../utils/classify');

Page({
  data: {
    rows: [],
    statusMsg: '',
    errorMsg: '',
    hasImported: false,
    selectedDenomLabels: [],
  },

  onShow() {
    const selected = wx.getStorageSync('selectedDenoms');
    const useDenoms = Array.isArray(selected) && selected.length ? selected : DENOM_ORDER;
    this.setData({ selectedDenomLabels: useDenoms.sort((a, b) => b - a).map((d) => formatInt(d)) });
  },

  getSelectedDenoms() {
    const selected = wx.getStorageSync('selectedDenoms');
    if (Array.isArray(selected) && selected.length) return selected;
    return DENOM_ORDER;
  },

  pickExcel() {
    this.setData({ errorMsg: '', statusMsg: '' });
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['xlsx', 'xls', 'csv'],
      success: (res) => {
        const file = res.tempFiles?.[0];
        if (!file?.path) {
          this.setData({ errorMsg: '没有选到文件，请重试。' });
          return;
        }
        wx.setStorageSync('lastExcelPath', file.path);
        this.parseByPath(file.path);
      },
      fail: () => {
        this.setData({ errorMsg: '文件选择已取消。' });
      },
    });
  },

  recalc() {
    this.setData({ errorMsg: '' });
    const lastPath = wx.getStorageSync('lastExcelPath');
    if (!lastPath) {
      this.setData({ errorMsg: '还没有导入表格，先选一份 Excel 吧。' });
      return;
    }
    this.parseByPath(lastPath);
  },

  parseByPath(path) {
    const fs = wx.getFileSystemManager();
    fs.readFile({
      filePath: path,
      success: (res) => {
        try {
          const rows = readRowsFromArrayBuffer(res.data);
          const selected = this.getSelectedDenoms();
          if (!selected.length) {
            this.setData({ errorMsg: '先在单笔页勾至少一种面额，再来批量处理。' });
            return;
          }

          const parsed = rowsToBatchRows(rows, selected);
          const displayRows = parsed.rows.map((r) => ({
            ...r,
            salaryLabel: formatInt(r.salary),
            c50000: r.counts[50000],
            c25000: r.counts[25000],
            c10000: r.counts[10000],
            c5000: r.counts[5000],
            c1000: r.counts[1000],
            remainderLabel: r.remainder > 0 ? formatInt(r.remainder) : '—',
          }));

          let statusMsg = `已读到 ${displayRows.length} 人，可导出结果。`;
          if (parsed.badLines.length) {
            statusMsg += ` 跳过无效行：${parsed.badLines.join(',')}`;
          }

          this.setData({
            rows: displayRows,
            hasImported: true,
            errorMsg: '',
            statusMsg,
            selectedDenomLabels: selected.sort((a, b) => b - a).map((d) => formatInt(d)),
          });
        } catch (err) {
          this.setData({ errorMsg: `解析失败：${err.message || err}` });
        }
      },
      fail: () => {
        this.setData({ errorMsg: '读取文件失败，请确认文件仍可访问。' });
      },
    });
  },

  exportExcel() {
    this.setData({ errorMsg: '' });
    if (!this.data.rows.length) {
      this.setData({ errorMsg: '暂时没有可导出的数据。' });
      return;
    }

    try {
      const wb = buildWorkbook(this.data.rows);
      const buffer = workbookToArrayBuffer(wb);
      const filePath = `${wx.env.USER_DATA_PATH}/薪酬配钞导出_${dateStamp()}.xlsx`;
      const fs = wx.getFileSystemManager();
      fs.writeFile({
        filePath,
        data: buffer,
        encoding: 'binary',
        success: () => {
          wx.openDocument({
            filePath,
            showMenu: true,
            fileType: 'xlsx',
            success: () => {
              this.setData({ statusMsg: `导出成功：${filePath}` });
            },
            fail: () => {
              this.setData({ statusMsg: `导出成功（路径：${filePath}）` });
            },
          });
        },
        fail: () => {
          this.setData({ errorMsg: '导出失败，请重试。' });
        },
      });
    } catch (err) {
      this.setData({ errorMsg: `导出失败：${err.message || err}` });
    }
  },
});
