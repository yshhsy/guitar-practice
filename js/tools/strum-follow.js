/* ============================================================
 * 扫弦节奏跟练器 🪕
 * 4 到 32 分扫弦节奏分步跟练，C 和弦示范音。
 * ============================================================ */
(() => {
  let _stop = null;

  // cells: ↓ 下扫 / ↑ 上扫 / · 空拍
  const PATTERNS = [
    { name: '全下扫', diff: '入门', spb: 2,
      cells: ['↓', '·', '↓', '·', '↓', '·', '↓', '·'],
      tip: '每拍匀速下扫，先求稳再求快，听清扫弦落点。' },
    { name: '八分交替', diff: '入门', spb: 2,
      cells: ['↓', '↑', '↓', '↑', '↓', '↑', '↓', '↑'],
      tip: '下上交替，手腕放松，像轻轻甩手上的水。' },
    { name: '民谣经典', diff: '初级', spb: 2,
      cells: ['↓', '·', '↓', '↑', '·', '↑', '↓', '↑'],
      tip: '《童年》同款节奏，空拍时手腕继续摆动不要停。' },
    { name: '慢摇抒情', diff: '初级', spb: 2,
      cells: ['↓', '·', '·', '·', '↓', '·', '·', '↑'],
      tip: '留白也是情绪，第二、三拍忍住别扫。' },
    { name: '流行切分', diff: '中级', spb: 2,
      cells: ['↓', '·', '↓', '↑', '·', '↑', '↓', '·'],
      tip: '切分重音落在第四拍前的上扫，跟住别抢拍。' },
    { name: '摇滚驱动', diff: '中级', spb: 2,
      cells: ['↓', '↓', '·', '↓', '↓', '↓', '·', '↓'],
      tip: '连续下扫制造推进感，适合强力和弦练习。' },
    { name: '十六分基础', diff: '进阶', spb: 4,
      cells: ['↓', '↑', '·', '↑', '↓', '↑', '·', '↑', '↓', '↑', '·', '↑', '↓', '↑', '·', '↑'],
      tip: '十六分音符均匀是关键，先 60 BPM 慢练再提速。' },
    { name: '十六分民谣', diff: '进阶', spb: 4,
      cells: ['↓', '·', '↓', '↑', '·', '↑', '↓', '↑', '↓', '·', '↓', '↑', '·', '↑', '↓', '↑'],
      tip: '民谣经典的十六分版本，空拍处手不停、声不出。' },
  ];

  const DIFF_COLOR = { '入门': '#17614e', '初级': '#c99a3f', '中级': '#b4503c', '进阶': '#8a4a2c' };

  const tool = {
    id: 'strum-follow',
    name: '扫弦节奏跟练器',
    desc: '4 到 32 分扫弦节奏分步跟练。',
    icon: '🪕',
    cat: '节奏与伴奏',

    render(el, api) {
      const { AudioEngine, ChordLib } = api;
      const st = { bpm: 72, pat: 2, playing: false, sched: null };
      const C_FREQS = ChordLib.chordFreqs([-1, 3, 2, 0, 1, 0]); // C 和弦

      /* ---------- 样式 ---------- */
      const style = document.createElement('style');
      style.textContent = `
        .sf-grid { display:grid; grid-template-columns:repeat(8,1fr); gap:5px; margin-top:12px; }
        .sf-cell {
          aspect-ratio: 1/1.1; display:flex; flex-direction:column; align-items:center; justify-content:center;
          background:var(--paper); border:1px solid var(--line); border-radius:10px;
          font-size:24px; color:var(--ink-2); transition: all .06s; position:relative;
        }
        .sf-cell .sf-sym { line-height:1; font-weight:700; }
        .sf-cell .sf-beat { font-size:8px; color:var(--ink-3); margin-top:3px; font-variant-numeric:tabular-nums; }
        .sf-cell.rest .sf-sym { color:#cfc3a8; font-size:18px; }
        .sf-cell.up .sf-sym { color:var(--gold); }
        .sf-cell.cur { background:var(--green); border-color:var(--green); transform:scale(1.08); box-shadow:var(--shadow); }
        .sf-cell.cur .sf-sym, .sf-cell.cur .sf-beat { color:#f3efe4; }
        .sf-cell.up.cur { background:var(--gold); border-color:var(--gold); }
        .sf-cell.up.cur .sf-sym, .sf-cell.up.cur .sf-beat { color:#3a2c0c; }
        .sf-pat { display:flex; gap:8px; overflow-x:auto; padding:2px; }
        .sf-pat-item {
          flex:none; padding:8px 12px; border:1px solid var(--line); border-radius:11px;
          background:var(--card); cursor:pointer; text-align:center; transition:all .12s;
        }
        .sf-pat-item .n { font-size:13px; font-weight:700; color:var(--ink); }
        .sf-pat-item .d { font-size:10px; margin-top:2px; }
        .sf-pat-item.active { border-color:var(--green); background:var(--green-soft); }
        .sf-pat-item:active { transform:scale(.96); }
        .sf-seq { text-align:center; font-size:20px; letter-spacing:4px; color:var(--ink-2);
                  background:var(--paper); border:1px dashed var(--line); border-radius:10px;
                  padding:9px 6px; margin-top:12px; }
      `;
      el.appendChild(style);

      /* ---------- 节奏型选择 ---------- */
      const card1 = document.createElement('div');
      card1.className = 'card';
      card1.innerHTML = `<div class="field-label">选择扫弦型（由易到难）</div><div class="sf-pat" id="sf-pats"></div>`;
      el.appendChild(card1);
      const patBox = card1.querySelector('#sf-pats');

      /* ---------- 网格 ---------- */
      const card2 = document.createElement('div');
      card2.className = 'card';
      card2.innerHTML = `
        <h2 id="sf-title"></h2>
        <div class="sf-grid" id="sf-grid"></div>
        <div class="result-box mt12" id="sf-tip"></div>
      `;
      el.appendChild(card2);
      const titleEl = card2.querySelector('#sf-title');
      const gridEl = card2.querySelector('#sf-grid');
      const tipEl = card2.querySelector('#sf-tip');

      /* ---------- 播放控制 ---------- */
      const card3 = document.createElement('div');
      card3.className = 'card';
      card3.innerHTML = `
        <div class="row between">
          <span class="field-label" style="margin:0">速度</span>
          <span style="font-size:22px;font-weight:600;font-variant-numeric:tabular-nums" id="sf-bpm">72<small style="font-size:12px;color:var(--ink-3)"> BPM</small></span>
        </div>
        <input type="range" id="sf-slider" min="40" max="160" step="1" value="72">
        <button class="btn-primary mt8" id="sf-toggle">▶ 开始跟练</button>
        <div class="hint">示范音为 C 和弦 · 跟着高亮格一起扫</div>
      `;
      el.appendChild(card3);
      const bpmEl = card3.querySelector('#sf-bpm');
      const slider = card3.querySelector('#sf-slider');
      const toggleBtn = card3.querySelector('#sf-toggle');

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
          const d = document.createElement('div');
          d.className = 'sf-cell' + (c === '·' ? ' rest' : c === '↑' ? ' up' : '');
          const beat = i % p.spb === 0 ? (i / p.spb + 1) : '';
          d.innerHTML = `<div class="sf-sym">${c === '·' ? '·' : c}</div>
                         <div class="sf-beat">${beat || ' '}</div>`;
          gridEl.appendChild(d);
          return d;
        });
        tipEl.innerHTML = `<b>练习要点</b>　${p.tip}`;
      }

      PATTERNS.forEach((p, i) => {
        const d = document.createElement('div');
        d.className = 'sf-pat-item' + (i === st.pat ? ' active' : '');
        d.innerHTML = `<div class="n">${p.name}</div>
                       <div class="d" style="color:${DIFF_COLOR[p.diff]}">${p.diff} · ${p.spb === 4 ? '16分' : '8分'}</div>`;
        d.addEventListener('click', () => {
          st.pat = i;
          patBox.querySelectorAll('.sf-pat-item').forEach((x, j) => x.classList.toggle('active', j === i));
          buildGrid();
          if (st.playing) { stopPlay(true); start(); }
        });
        patBox.appendChild(d);
      });

      /* ---------- 调度 ---------- */
      function makeScheduler() {
        const p = pat();
        const s = new AudioEngine.Scheduler({
          bpm: st.bpm,
          stepsPerBeat: p.spb,
          onStep(step, time) {
            const pos = step % p.cells.length;
            const c = p.cells[pos];
            const off = Math.max(0, time - AudioEngine.now());
            if (c === '↓') AudioEngine.strum(C_FREQS, { gap: 0.03, gain: 0.6, dir: 'down', when: off });
            else if (c === '↑') AudioEngine.strum(C_FREQS, { gap: 0.024, gain: 0.5, dir: 'up', when: off });
            if (pos % p.spb === 0) AudioEngine.click(off, pos === 0);
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
        st.bpm = Math.min(160, Math.max(40, Math.round(v)));
        bpmEl.innerHTML = `${st.bpm}<small style="font-size:12px;color:var(--ink-3)"> BPM</small>`;
        slider.value = st.bpm;
        if (st.sched) st.sched.setBpm(st.bpm);
      }
      slider.addEventListener('input', () => setBpm(Number(slider.value)));

      /* ---------- 初始化 ---------- */
      buildGrid();
      setBpm(72);
      _stop = () => stopPlay();
    },

    teardown() {
      if (_stop) { try { _stop(); } catch {} _stop = null; }
    },
  };

  Tools.register(tool);
})();
