/* ============================================================
 * 本地存储
 * Store.records: 练习记录
 * Store.getJSON/setJSON: 各工具自己的数据（吉他谱、设置等）
 * ============================================================ */
const Store = (() => {
  const REC_KEY = 'gp_records_v1';

  function getJSON(key, fallback = null) {
    try {
      const v = localStorage.getItem('gp_' + key);
      return v === null ? fallback : JSON.parse(v);
    } catch { return fallback; }
  }
  function setJSON(key, val) {
    localStorage.setItem('gp_' + key, JSON.stringify(val));
  }

  const records = {
    load() { return getJSON('records_v1', []) || []; },
    save(list) { setJSON('records_v1', list); },
    add(rec) { const l = records.load(); l.push(rec); records.save(l); },
  };

  function dateStr(d = new Date()) {
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  return { getJSON, setJSON, records, dateStr };
})();
