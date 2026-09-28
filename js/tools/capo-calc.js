/* ============================================================
 * 变调夹计算器 🧮
 * 输入原调指法，自动算夹品 + 和弦进行对照 + 速查表
 * ============================================================ */
(() => {
const tool = {
  id: 'capo-calc',
  name: '变调夹计算器',
  desc: '输入原调指法，自动算夹品。',
  icon: '🧮',
  cat: '乐理与工具',

  render(el, api) {
    const { AudioEngine, Theory, ChordLib, Store } = api;

    const SHAPE_KEYS = ['C', 'G', 'D', 'A', 'E'];
    // 与 MAJOR_KEYS 一致的 12 调拼写（吉他常用写法）
    const KN = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
    const keyName = (i) => KN[((i % 12) + 12) % 12];

    const saved = Store.getJSON('capo_calc_v1', {}) || {};
    let shapeKey = saved.shapeKey || 'C';
    let targetKey = saved.targetKey || 'G';

    /* ---- 发音辅助：优先真实指法，兜底用和弦构成音 ---- */
    function matchTones(c, frets) {
      const tones = new Set(c.tones.map((t) => ((c.rootIdx + t) % 12 + 12) % 12));
      let played = 0, hasRoot = false;
      for (let i = 0; i < 6; i++) {
        const f = frets[i];
        if (f < 0) continue;
        played++;
        const pc = (ChordLib.OPEN_NOTES[i] + f) % 12;
        if (!tones.has(pc)) return false;
        if (pc === c.rootIdx) hasRoot = true;
      }
      return played >= 3 && hasRoot;
    }
    function playChord(name) {
      const c = Theory.parseChord(name);
      if (!c) return;
      const v = ChordLib.getVoicings(name).find((x) => matchTones(c, x.frets));
      let freqs;
      if (v) freqs = ChordLib.chordFreqs(v.frets);
      else {
        freqs = [];
        let oct = 3, prev = 0;
        c.tones.forEach((t) => {
          const pc = (c.rootIdx + t) % 12;
          let f = Theory.freqOf(pc, oct);
          if (f < prev) f = Theory.freqOf(pc, ++oct);
          prev = f; freqs.push(f);
        });
      }
      AudioEngine.strum(freqs);
    }

    el.innerHTML = `
      <style>
        .capo-table{width:100%;border-collapse:collapse;font-size:12.5px;}
        .capo-table th,.capo-table td{
          border:1px solid #e3d8bf;padding:7px 2px;text-align:center;color:#6d6455;
        }
        .capo-table th{background:#ece4d2;color:#2e2a22;font-weight:700;}
        .capo-table td.capo-rowhead{background:#ece4d2;color:#2e2a22;font-weight:700;}
        .capo-table td.capo-hl{background:#17614e;color:#f3efe4;font-weight:800;}
        .capo-table td.capo-cur-row{background:#e4efe9;}
        .capo-lab{font-size:12px;color:#a29681;margin:10px 0 4px;font-weight:600;}
        .capo-token2{background:#f6ead0;border-color:#e8d5ac;color:#8a6414;}
        .capo-token2:active{background:#c99a3f;color:#3a2c0c;}
        .capo-bad{background:#f7e3de;border-color:#e0b8ae;color:#b4503c;cursor:default;}
      </style>

      <div class="card">
        <h2>夹几品？</h2>
        <div class="grid2">
          <div>
            <div class="field-label">你会按的指法调</div>
            <select id="capo-shape"></select>
          </div>
          <div>
            <div class="field-label">想唱的实际调</div>
            <select id="capo-target"></select>
          </div>
        </div>
        <div class="result-box mt12" id="capo-result"></div>
      </div>

      <div class="card">
        <h2>和弦进行对照</h2>
        <div class="field-label">输入你按的和弦（空格分隔）</div>
        <input type="text" id="capo-prog" placeholder="如：C G Am F" value="C G Am F">
        <div id="capo-prog-out"></div>
      </div>

      <div class="card">
        <h2>速查表 · 指法调 × 夹品 = 实际调</h2>
        <div id="capo-table-box"></div>
        <p class="hint">绿色格子 = 当前选择的组合</p>
      </div>
    `;

    const shapeSel = el.querySelector('#capo-shape');
    const targetSel = el.querySelector('#capo-target');
    SHAPE_KEYS.forEach((k) => shapeSel.add(new Option(k + ' 调指法', k)));
    Theory.MAJOR_KEYS.forEach((k) => targetSel.add(new Option(k + ' 调', k)));
    shapeSel.value = shapeKey;
    targetSel.value = targetKey;

    function capo() { return Theory.keyDistance(shapeKey, targetKey); }

    function updateResult() {
      const n = capo();
      const box = el.querySelector('#capo-result');
      if (n === 0) {
        box.innerHTML = `不用变调夹，直接用 <b>${shapeKey}</b> 调指法弹，就是 <b>${targetKey}</b> 调。`;
      } else if (n <= 7) {
        box.innerHTML = `变调夹夹第 <b>${n}</b> 品，用 <b>${shapeKey}</b> 调指法即可唱出 <b>${targetKey}</b> 调。`;
      } else {
        // 给更优建议
        let best = null;
        SHAPE_KEYS.forEach((k) => {
          const d = Theory.keyDistance(k, targetKey);
          if (!best || d < best.d) best = { k, d };
        });
        box.innerHTML = `要夹第 <b>${n}</b> 品，太靠后了，音色发闷、指型别扭，<b>建议换一种指法调</b>。<br>`
          + `推荐改用 <b>${best.k}</b> 调指法，只需夹第 <b>${best.d}</b> 品。`;
      }
    }

    function updateProg() {
      const raw = el.querySelector('#capo-prog').value.trim();
      const out = el.querySelector('#capo-prog-out');
      const n = capo();
      const useFlat = ['F', 'Bb', 'Eb', 'Ab', 'Db'].includes(targetKey);
      if (!raw) { out.innerHTML = ''; return; }
      const tokens = raw.split(/[\s,，、]+/).filter(Boolean);
      const good = [], bad = [];
      tokens.forEach((t) => {
        const c = Theory.parseChord(t);
        if (c && c.valid) good.push({ from: t, to: Theory.transposeChord(t, n, useFlat) });
        else bad.push(t);
      });
      if (!good.length && !bad.length) { out.innerHTML = ''; return; }
      let html = '';
      if (good.length) {
        html += `<div class="capo-lab">你按的（${shapeKey} 调指法）</div><div class="row wrap">`
          + good.map((g, i) => `<span class="chord-token" data-i="${i}" data-kind="from">${g.from}</span>`).join('')
          + `</div><div class="capo-lab">实际发音（${targetKey} 调）</div><div class="row wrap">`
          + good.map((g, i) => `<span class="chord-token capo-token2" data-i="${i}" data-kind="to">${g.to}</span>`).join('')
          + `</div>`;
      }
      if (bad.length) {
        html += `<div class="capo-lab">没认出来（已忽略）</div><div class="row wrap">`
          + bad.map((b) => `<span class="chord-token capo-bad">${b}</span>`).join('') + `</div>`;
      }
      out.innerHTML = html;
      out.querySelectorAll('.chord-token:not(.capo-bad)').forEach((tk) => {
        tk.addEventListener('click', () => {
          const g = good[+tk.dataset.i];
          playChord(tk.dataset.kind === 'from' ? g.from : g.to);
        });
      });
    }

    function updateTable() {
      const n = capo();
      let html = `<table class="capo-table"><tr><th>指法调 \\ 夹品</th>`;
      for (let f = 0; f <= 7; f++) html += `<th>${f}</th>`;
      html += '</tr>';
      SHAPE_KEYS.forEach((k) => {
        html += `<tr><td class="capo-rowhead">${k}</td>`;
        for (let f = 0; f <= 7; f++) {
          const cur = k === shapeKey && f === n;
          const inRow = k === shapeKey && !cur;
          html += `<td class="${cur ? 'capo-hl' : inRow ? 'capo-cur-row' : ''}">${keyName(Theory.idx(k) + f)}</td>`;
        }
        html += '</tr>';
      });
      html += '</table>';
      el.querySelector('#capo-table-box').innerHTML = html;
    }

    function updateAll() {
      Store.setJSON('capo_calc_v1', { shapeKey, targetKey });
      updateResult();
      updateProg();
      updateTable();
    }

    shapeSel.addEventListener('change', () => { shapeKey = shapeSel.value; updateAll(); });
    targetSel.addEventListener('change', () => { targetKey = targetSel.value; updateAll(); });
    el.querySelector('#capo-prog').addEventListener('input', updateProg);

    updateAll();
  },

  teardown() {},
};
Tools.register(tool);
})();
