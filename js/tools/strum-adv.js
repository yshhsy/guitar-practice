/* ============================================================
 * 扫弦进阶训练器 ⚡
 * 进阶节奏跟练：闷音 × 与重音 >。
 * ============================================================ */
(() => {
  let _stop = null;

  // cells: ↓ 下扫 / ↑ 上扫 / ↓> 重音下扫 / ↑> 重音上扫 / × 闷音 / · 空拍（16 步）
  const PATTERNS = [
    { name: '闷音律动', diff: '中级',
      cells: ['↓', '×', '↓', '×', '↓', '×', '↓', '↑', '↓', '×', '↓', '×', '↓', '×', '↑', '↑'],
      tip: '闷音拍右手小鱼际轻压琴桥处琴弦，扫出干脆的"嚓"声。' },
    { name: '重音移位', diff: '中级',
      cells: ['↓>', '↑', '↓', '↑', '↓', '↑>', '↓', '↑', '↓', '↑', '↓>', '↑', '↓', '↑', '↓', '↑'],
      tip: '重音拍加大手腕幅度扫全部弦，非重音只轻扫高音弦。' },
    { name: '放克十六分', diff: '进阶',
      cells: ['↓', '×', '↑', '×', '↓', '×', '↑', '↓', '×', '↑', '×', '↓', '↑', '×', '↓', '↑'],
      tip: '闷音与实音快速交替，右手保持十六分摆动一刻不停。' },
    { name: '慢摇闷音', diff: '进阶',
      cells: ['↓>', '·', '×', '↑', '·', '×', '↓', '·', '↓>', '·', '×', '↑', '×', '·', '↑', '↑'],
      tip: '第一拍重音站稳阵脚，中间的闷音拍轻巧带过即可。' },
    { name: '摇滚重击', diff: '进阶',
      cells: ['↓>', '↓', '×', '↓', '↓>', '↓', '×', '↓', '↓>', '↓', '×', '↓', '↓>', '↓', '↑', '↑'],
      tip: '配合强力和弦使用，重音拍可以略微"坐"一下制造冲击力。' },
    { name: '雷鬼反拍', diff: '高级',
      cells: ['·', '×', '·', '↑', '·', '×', '·', '↑', '·', '×', '·', '↑', '·', '×', '·', '↑'],
      tip: '正拍全部休息、反拍才发声，用心体会"空"出来的 groove。' },
    { name: '混合律动', diff: '高级',
      cells: ['↓>', '↑', '×', '↑', '↓', '×', '↑', '↓>', '×', '↑', '↓', '↑', '×', '↑', '↓', '↑'],
      tip: '四种符号混合出现，先 60 BPM 把每格读准确再逐渐加速。' },
  ];

  const DIFF_COLOR = { '中级': '#b4503c', '进阶': '#8a4a2c', '高级': '#6b3fa0' };

  const tool = {
    id: 'strum-adv',
    name: '扫弦进阶训练器',
    desc: '扫弦进阶节奏跟练（闷音与重音）。',
    icon: '⚡',
    cat: '节奏与伴奏',

    render(el, api) {
      const { AudioEngine, ChordLib } = api;
      const st = { bpm: 66, pat: 0, playing: false, sched: null };
      const C_FREQS = ChordLib.chordFreqs([-1, 3, 2, 0, 1, 0]);

      /* ---------- 样式 ---------- */
      const style = document.createElement('style');
      style.textContent = `
        .sa-grid { display:grid; grid-template-columns:repeat(8,1fr); gap:5px; margin-top:12px; }
        .sa-cell {
          aspect-ratio: 1/1.1; display:flex; flex-direction:column; align-items:center; justify-content:center;
          background:var(--paper); border:1px solid var(--line); border-radius:10px;
          transition: all .06s; position:relative;
        }
        .sa-cell .sa-sym { line-height:1; font-weight:700; font-size:22px; color:var(--ink-2); }
        .sa-cell .sa-acc { font-size:11px; color:var(--red); font-weight:800; line-height:1; }
        .sa-cell .sa-beat { font-size:8px; color:var(--ink-3); margin-top:3px; font-variant-numeric:tabular-nums; }
        .sa-cell.rest .sa-sym { color:#cfc3a8; font-size:16px; }
        .sa-cell.up .sa-sym { color:var(--gold); }
        .sa-cell.mute .sa-sym { color:var(--red); }
        .sa-cell.cur { background:var(--green); border-color:var(--green); transform:scale(1.08); box-shadow:var(--shadow); }
        .sa-cell.cur .sa-sym, .sa-cell.cur .sa-beat, .sa-cell.cur .sa-acc { color:#f3efe4; }
        .sa-cell.up.cur { background:var(--gold); border-color:var(--gold); }
        .sa-cell.up.cur .sa-sym, .sa-cell.up.cur .sa-beat, .sa-cell.up.cur .sa-acc { color:#3a2c0c; }
        .sa-cell.mute.cur { background:var(--red); border-color:var(--red); }
        .sa-legend { display:flex; justify-content:center; gap:14px; flex-wrap:wrap; margin-top:12px; }
        .sa-legend span { font-size:12px; color:var(--ink-2); display:flex; align-items:center; gap:4px; }
        .sa-legend b { font-size:16px; }
        .sa-pat { display:flex; gap:8px; overflow-x:auto; padding:2px; }
        .sa-pat-item {
          flex:none; padding:8px 12px; border:1px solid var(--line); border-radius:11px;
          background:var(--card); cursor:pointer; text-align:center; transition:all .12s;
        }
        .sa-pat-item .n { font-size:13px; font-weight:700; color:var(--ink); }
        .sa-pat-item .d { font-size:10px; margin-top:2px; }
        .sa-pat-item.active { border-color:var(--green); background:var(--green-soft); }
        .sa-pat-item:active { transform:scale(.96); }
      `;
      el.appendChild(style);

      /* ---------- 节奏型选择 ---------- */
      const card1 = document.createElement('div');
      card1.className = 'card';
      card1.innerHTML = `<div class="field-label">进阶扫弦型</div><div class="sa-pat" id="sa-pats"></div>`;
      el.appendChild(card1);
      const patBox = card1.querySelector('#sa-pats');

      /* ---------- 网格 ---------- */
      const card2 = document.createElement('div');
      card2.className = 'card';
      card2.innerHTML = `
        <h2 id="sa-title"></h2>
        <div class="sa-grid" id="sa-grid"></div>
        <div class="sa-legend">
          <span><b style="color:var(--ink-2)">↓</b> 下扫</span>
          <span><b style="color:var(--gold)">↑</b> 上扫</span>
          <span><b style="color:var(--red)">×</b> 闷音</span>
          <span><b style="color:var(--red)">&gt;</b> 重音</span>
          <span><b style="color:#cfc3a8">·</b> 空拍</span>
        </div>
        <div class="result-box mt12" id="sa-tip"></div>
      `;
      el.appendChild(card2);
      const titleEl = card2.querySelector('#sa-title');
      const gridEl = card2.querySelector('#sa-grid');
      const tipEl = card2.querySelector('#sa-tip');

      /* ---------- 播放控制 ---------- */
      const card3 = document.createElement('div');
      card3.className = 'card';
      card3.innerHTML = `
        <div class="row between">
          <span class="field-label" style="margin:0">速度</span>
          <span style="font-size:22px;font-weight:600;font-variant-numeric:tabular-nums" id="sa-bpm">66<small style="font-size:12px;color:var(--ink-3)"> BPM</small></span>
        </div>
        <input type="range" id="sa-slider" min="40" max="150" step="1" value="66">
        <button class="btn-primary mt8" id="sa-toggle">▶ 开始跟练</button>
        <div class="hint">闷音 = 极轻短扫 + 制音 · 重音 = 全力扫弦</div>
      `;
      el.appendChild(card3);
      const bpmEl = card3.querySelector('#sa-bpm');
      const slider = card3.querySelector('#sa-slider');
      const toggleBtn = card3.querySelector('#sa-toggle');

      /* ---------- 数据 ---------- */
      function pat() { return PATTERNS[st.pat]; }
      let cellEls = [];

      function buildGrid() {
        const p = pat();
        titleEl.innerHTML = `${p.name}
          <span style="font-size:11px;color:${DIFF_COLOR[p.diff]};border:1px solid ${DIFF_COLOR[p.diff]};
                border-radius:6px;padding:1px 7px;margin-left:6px;vertical-align:2px">${p.diff}</span>`;
        gridEl.innerHTML = '';
        cellEls = p.cells.map((c, i) => {
          const base = c[0];                    // ↓ ↑ × ·
          const accent = c.endsWith('>');
          const cls = base === '·' ? 'rest' : base === '↑' ? 'up' : base === '×' ? 'mute' : '';
          const beat = i % 4 === 0 ? (i / 4 + 1) : '';
          const d = document.createElement('div');
          d.className = 'sa-cell ' + cls;
          d.innerHTML = `
            ${accent ? '<div class="sa-acc">&gt;</div>' : ''}
            <div class="sa-sym">${base}</div>
            <div class="sa-beat">${beat || ' '}</div>`;
          gridEl.appendChild(d);
          return d;
        });
        tipEl.innerHTML = `<b>练习要点</b>　${p.tip}`;
      }

      PATTERNS.forEach((p, i) => {
        const d = document.createElement('div');
        d.className = 'sa-pat-item' + (i === st.pat ? ' active' : '');
        d.innerHTML = `<div class="n">${p.name}</div>
                       <div class="d" style="color:${DIFF_COLOR[p.diff]}">${p.diff}</div>`;
        d.addEventListener('click', () => {
          st.pat = i;
          patBox.querySelectorAll('.sa-pat-item').forEach((x, j) => x.classList.toggle('active', j === i));
          buildGrid();
          if (st.playing) { stopPlay(true); start(); }
        });
        patBox.appendChild(d);
      });

      /* ---------- 发声 ---------- */
      function playCell(c, off) {
        if (c === '·') return;
        const accent = c.endsWith('>');
        const base = c[0];
        if (base === '×') {
          // 闷音：制音咔哒 + 极轻短扫
          AudioEngine.rim(off, 0.5);
          AudioEngine.strum(C_FREQS, { gap: 0.011, gain: 0.12, dir: 'down', when: off });
        } else if (base === '↓') {
          AudioEngine.strum(C_FREQS, { gap: 0.03, gain: accent ? 1.0 : 0.55, dir: 'down', when: off });
        } else if (base === '↑') {
          AudioEngine.strum(C_FREQS, { gap: 0.024, gain: accent ? 0.9 : 0.48, dir: 'up', when: off });
        }
      }

      /* ---------- 调度 ---------- */
      function makeScheduler() {
        const p = pat();
        const s = new AudioEngine.Scheduler({
          bpm: st.bpm,
          stepsPerBeat: 4,
          onStep(step, time) {
            const pos = step % p.cells.length;
            const off = Math.max(0, time - AudioEngine.now());
            playCell(p.cells[pos], off);
            if (pos % 4 === 0) AudioEngine.click(off, pos === 0);
          },
        });
        s.onUiStep = (step) => {
          const pos = step % pat().cells.length;
          cellEls.forEach((d, i) => d.classList.toggle('cur', i === pos));
        };
        return s;
      }
      function start() {
        AudioEngine.ensureCtx();
        st.sched = makeScheduler();
        st.sched.start();
        st.playing = true;
        toggleBtn.textContent = '■ 停止';
        toggleBtn.classList.add('danger');
      }
      function stopPlay(silent) {
        if (st.sched) { st.sched.stop(); st.sched = null; }
        st.playing = false;
        if (!silent) {
          toggleBtn.textContent = '▶ 开始跟练';
          toggleBtn.classList.remove('danger');
          cellEls.forEach((d) => d.classList.remove('cur'));
        }
      }
      toggleBtn.addEventListener('click', () => (st.playing ? stopPlay() : start()));

      function setBpm(v) {
        st.bpm = Math.min(150, Math.max(40, Math.round(v)));
        bpmEl.innerHTML = `${st.bpm}<small style="font-size:12px;color:var(--ink-3)"> BPM</small>`;
        slider.value = st.bpm;
        if (st.sched) st.sched.setBpm(st.bpm);
      }
      slider.addEventListener('input', () => setBpm(Number(slider.value)));

      /* ---------- 初始化 ---------- */
      buildGrid();
      setBpm(66);
      _stop = () => stopPlay();
    },

    teardown() {
      if (_stop) { try { _stop(); } catch {} _stop = null; }
    },
  };

  Tools.register(tool);
})();
