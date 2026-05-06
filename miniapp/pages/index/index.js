const { classify, formatInt } = require('../../utils/classify');

const BASE_DENOMS = [50000, 25000, 10000, 5000, 1000];

Page({
  data: {
    amountInput: '',
    denominations: BASE_DENOMS.map((d) => ({
      denom: d,
      label: formatInt(d),
      checked: true,
    })),
    errorMsg: '',
    hasResult: false,
    parts: [],
    remainder: 0,
    remainderLabel: '0',
    paperSumLabel: '0',
  },

  onLoad() {
    const saved = wx.getStorageSync('selectedDenoms');
    if (Array.isArray(saved) && saved.length) {
      const set = new Set(saved);
      this.setData({
        denominations: BASE_DENOMS.map((d) => ({
          denom: d,
          label: formatInt(d),
          checked: set.has(d),
        })),
      });
    }
  },

  onAmountInput(e) {
    this.setData({ amountInput: e.detail.value, errorMsg: '' });
  },

  onCheckboxChange(e) {
    const selected = (e.detail.value || []).map((n) => Number(n));
    const set = new Set(selected);
    const denominations = this.data.denominations.map((item) => ({
      ...item,
      checked: set.has(item.denom),
    }));
    this.setData({ denominations, errorMsg: '' });
    wx.setStorageSync('selectedDenoms', selected);
  },

  toggleAll() {
    const checkedCount = this.data.denominations.filter((d) => d.checked).length;
    const target = checkedCount !== this.data.denominations.length;
    const denominations = this.data.denominations.map((d) => ({ ...d, checked: target }));
    this.setData({ denominations, errorMsg: '' });
    wx.setStorageSync(
      'selectedDenoms',
      denominations.filter((d) => d.checked).map((d) => d.denom),
    );
  },

  handleCalculate() {
    const raw = this.data.amountInput.trim();
    const amount = Number(raw);
    if (!raw || !Number.isFinite(amount)) {
      this.setData({ errorMsg: '这里需要填一个数字哦。', hasResult: false });
      return;
    }
    if (amount < 0) {
      this.setData({ errorMsg: '金额不能是负数呀。', hasResult: false });
      return;
    }

    const selected = this.data.denominations.filter((d) => d.checked).map((d) => d.denom);
    if (!selected.length) {
      this.setData({ errorMsg: '至少勾一种纸币面额，才知道怎么拆～', hasResult: false });
      return;
    }

    wx.setStorageSync('selectedDenoms', selected);

    const { parts, remainder } = classify(amount, selected);
    const displayParts = parts.map((p) => ({
      ...p,
      label: formatInt(p.denom),
      subtotalLabel: formatInt(p.denom * p.count),
    }));
    const paperSum = displayParts.reduce((s, p) => s + p.denom * p.count, 0);

    this.setData({
      errorMsg: '',
      hasResult: true,
      parts: displayParts,
      remainder,
      remainderLabel: formatInt(remainder),
      paperSumLabel: formatInt(paperSum),
    });
  },
});
