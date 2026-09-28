/* ============================================================
 * 和弦转调 🔀
 * 输入和弦进行，一键完成转调，可试听、可复制
 * ============================================================ */
(() => {
const tool = {
  id: 'transpose',
  name: '和弦转调',
  desc: '输入和弦进行，一键完成转调。',
  icon: '🔀',
  cat: '乐理与工具',

  render(el, api) {
    const { AudioEngine, Theory, ChordLib, Store } = api;

    const KN = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
    const keyName = (i) => KN[((i % 12) + 12) % 12];

    const QUICK = [
      { label: '卡农进行', val: 'C G Am Em F C F G' },
      { label: '4536251', val: 'F G Em Am Dm G C' },
      { label: '1645', val: 'C Am F G' },
      { label: '6415', val: 'Am F C G' },
    ];

    const saved = Store.getJSON('transpose_v1', {}) || {};
    let fromKey = saved.fromKey || 'C';
    let semis = saved.semis !== undefined ? saved.semis : 5; // C -> G 默认示例

    /* ---- 发音辅助 ---- */
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
        .trans-step{display:flex;align-items:center;justify-content:center;gap:16px;}
        .trans-step-num{font-size:26px;font-weight:800;color:#0fa873;min-width:86px;text-align:center;
          font-variant-numeric:tabular-nums;}
        .trans-bad{background:#fdeceb !important;border-color:#eec7bf !important;color:#e05d4d !important;cursor:default;}
        .trans-copy-ok{color:#0fa873 !important;border-color:#0fa873 !important;}
      </style>

      <div class="card">
        <h2>和弦进行</h2>
        <textarea id="trans-input" placeholder="如：C G Am Em F C F G">${saved.input || 'C G Am Em F C F G'}</textarea>
        <div class="chip-row mt8">
          ${QUICK.map((q, i) => `<span class="chip" data-q="${i}">${q.label}</span>`).join('')}
        </div>
      </div>

      <div class="card">
        <h2>转到哪</h2>
        <div class="grid2">
          <div>
            <div class="field-label">原调</div>
            <select id="trans-from"></select>
          </div>
          <div>
            <div class="field-label">目标调</div>
            <select id="trans-to"></select>
          </div>
        </div>
        <div class="field-label mt12 center">或者直接按半音微调</div>
        <div class="trans-step">
          <button class="btn-mini" id="trans-minus">− 半音</button>
          <span class="trans-step-num" id="trans-semis"></span>
          <button class="btn-mini" id="trans-plus">＋ 半音</button>
        </div>
      </div>

      <div class="card">
        <h2>转调结果</h2>
        <div id="trans-out"></div>
        <div id="trans-bad-box"></div>
        <button class="btn-ghost mt12" id="trans-copy">📋 复制结果</button>
      </div>
    `;

    const fromSel = el.querySelector('#trans-from');
    const toSel = el.querySelector('#trans-to');
    Theory.MAJOR_KEYS.forEach((k) => { fromSel.add(new Option(k + ' 调', k)); toSel.add(new Option(k + ' 调', k)); });
    fromSel.value = fromKey;

    let result = [];

    function useFlat() { return ['F', 'Bb', 'Eb', 'Ab', 'Db'].includes(toSel.value); }

    function syncToSel() {
      toSel.value = keyName(Theory.idx(fromSel.value) + semis);
    }

    function renderOut() {
      const raw = el.querySelector('#trans-input').value.trim();
      const out = el.querySelector('#trans-out');
      const badBox = el.querySelector('#trans-bad-box');
      result = [];
      const bad = [];
      if (raw) {
        raw.split(/[\s,，、|]+/).filter(Boolean).forEach((t) => {
          const c = Theory.parseChord(t);
          if (c && c.valid) result.push(Theory.transposeChord(t, semis, useFlat()));
          else bad.push(t);
        });
      }
      out.innerHTML = result.length
        ? `<div class="row wrap">${result.map((r, i) => `<span class="chord-token" data-i="${i}">${r}</span>`).join('')}</div>`
        : '<p class="hint" style="margin-top:0">输入和弦后这里实时显示结果</p>';
      badBox.innerHTML = bad.length
        ? `<div class="field-label mt8" style="color:#e05d4d">没认出来（已忽略）</div>
           <div class="row wrap">${bad.map((b) => `<span class="chord-token trans-bad">${b}</span>`).join('')}</div>`
        : '';
      out.querySelectorAll('.chord-token').forEach((tk) => {
        tk.addEventListener('click', () => playChord(result[+tk.dataset.i]));
      });
      el.querySelector('#trans-semis').textContent =
        (semis > 0 ? '+' : '') + semis + ' 半音';
    }

    function save() {
      Store.setJSON('transpose_v1', {
        fromKey: fromSel.value,
        semis,
        input: el.querySelector('#trans-input').value,
      });
    }

    fromSel.addEventListener('change', () => {
      semis = Theory.keyDistance(fromSel.value, toSel.value);
      save(); renderOut();
    });
    toSel.addEventListener('change', () => {
      semis = Theory.keyDistance(fromSel.value, toSel.value);
      save(); renderOut();
    });
    el.querySelector('#trans-minus').addEventListener('click', () => {
      semis = Math.max(-6, semis - 1);
      syncToSel(); save(); renderOut();
    });
    el.querySelector('#trans-plus').addEventListener('click', () => {
      semis = Math.min(6, semis + 1);
      syncToSel(); save(); renderOut();
    });
    el.querySelector('#trans-input').addEventListener('input', () => { save(); renderOut(); });
    el.querySelectorAll('.chip[data-q]').forEach((chip) => {
      chip.addEventListener('click', () => {
        el.querySelector('#trans-input').value = QUICK[+chip.dataset.q].val;
        save(); renderOut();
      });
    });

    const copyBtn = el.querySelector('#trans-copy');
    copyBtn.addEventListener('click', async () => {
      if (!result.length) return;
      try {
        await navigator.clipboard.writeText(result.join(' '));
        copyBtn.textContent = '✓ 已复制到剪贴板';
        copyBtn.classList.add('trans-copy-ok');
        setTimeout(() => { copyBtn.textContent = '📋 复制结果'; copyBtn.classList.remove('trans-copy-ok'); }, 1400);
      } catch (e) {
        copyBtn.textContent = '复制失败，请手动长按选择';
        setTimeout(() => { copyBtn.textContent = '📋 复制结果'; }, 1400);
      }
    });

    syncToSel();
    renderOut();
  },

  teardown() {},
};
Tools.register(tool);
})();
