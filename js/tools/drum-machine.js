/* ============================================================
 * 鼓机 🥁
 * 内置常用鼓点节奏型，16 步进网格，练习更像伴奏。
 * ============================================================ */
(() => {
  let _stop = null;

  // 乐器行定义（key 对应 pattern 数组字段）
  const ROWS = [
    { key: 'kick',    label: '🦵', name: '底鼓',   color: '#17614e' },
    { key: 'snare',   label: '🥁', name: '军鼓',   color: '#b4503c' },
    { key: 'clap',    label: '👏', name: '拍手',   color: '#b4503c' },
    { key: 'hihat',   label: '🔔', name: '踩镲',   color: '#c99a3f' },
    { key: 'openhat', label: '🔆', name: '开镲',   color: '#c99a3f' },
  ];

  // 节奏型库：steps 总步数；数组为该乐器发声的步号
  const PATTERNS = [
    { name: '动次打次', steps: 16, spb: 4,
      kick: [0, 8], snare: [4, 12], clap: [], hihat: [0, 2, 4, 6, 8, 10, 12, 14], openhat: [14] },
    { name: '摇滚', steps: 16, spb: 4,
      kick: [0, 6, 8, 10], snare: [4, 12], clap: [], hihat: [0, 2, 4, 6, 8, 10, 12, 14], openhat: [] },
    { name: '流行', steps: 16, spb: 4,
      kick: [0, 7, 8], snare: [4, 12], clap: [12], hihat: [0, 2, 4, 6, 8, 10, 12, 14], openhat: [6] },
    { name: '民谣', steps: 16, spb: 4,
      kick: [0, 8, 10], snare: [4, 12], clap: [], hihat: [0, 4, 8, 12], openhat: [] },
    { name: '布鲁斯 Shuffle', steps: 16, spb: 4,
      kick: [0, 8], snare: [4, 12], clap: [], hihat: [0, 3, 4, 6, 8, 11, 12, 14], openhat: [] },
    { name: '6/8 摇摆', steps: 12, spb: 3,
      kick: [0, 6], snare: [6], clap: [], hihat: [0, 3, 6, 9], openhat: [9] },
  ];

  const tool = {
    id: 'drum-machine',
    name: '鼓机',
    desc: '内置常用鼓点，练习更像伴奏。',
    icon: '🥁',
    cat: '节奏与伴奏',

    render(el, api) {
      const { AudioEngine } = api;
      const st = { bpm: 100, pat: 0, playing: false, sched: null };

      /* ---------- 样式 ---------- */
      const style = document.createElement('style');
      style.textContent = `
        .dm-grid { display:flex; flex-direction:column; gap:4px; margin-top:12px; }
        .dm-row { display:flex; align-items:center; }
        .dm-label { width:38px; flex:none; font-size:15px; text-align:center; }
        .dm-cell {
          flex:1; height:22px; border-radius:5px; margin-left:2px;
          background:var(--paper-deep); border:1px solid var(--line-soft);
          transition: background .05s, transform .05s;
        }
        .dm-cell.dm-grp { margin-left:8px; }
        .dm-cell.on { border-color: transparent; }
        .dm-cell.cur { background:#efe0bd; }
        .dm-cell.on.cur { transform: scaleY(1.18); filter: brightness(1.12); }
        .dm-steps { display:flex; margin-left:38px; margin-bottom:2px; }
        .dm-stepnum {
          flex:1; margin-left:2px; text-align:center; font-size:9px; color:var(--ink-3);
          font-variant-numeric:tabular-nums; border-radius:4px; padding:1px 0;
        }
        .dm-stepnum.dm-grp { margin-left:8px; }
        .dm-stepnum.cur { background:var(--green); color:#f3efe4; font-weight:700; }
        .dm-legend { display:flex; flex-wrap:wrap; gap:10px; justify-content:center; margin-top:10px; }
        .dm-legend span { display:flex; align-items:center; gap:4px; font-size:11px; color:var(--ink-2); }
        .dm-legend i { width:10px; height:10px; border-radius:3px; display:inline-block; }
        .dm-pat-row { display:flex; gap:8px; overflow-x:auto; padding:2px; }
        .dm-pat-row .chip { flex:none; }
      `;
      el.appendChild(style);

      /* ---------- 节奏型选择 ---------- */
      const card1 = document.createElement('div');
      card1.className = 'card';
      card1.innerHTML = `<div class="field-label">节奏型</div><div class="dm-pat-row" id="dm-pats"></div>`;
      el.appendChild(card1);
      const patBox = card1.querySelector('#dm-pats');

      /* ---------- 网格卡片 ---------- */
      const card2 = document.createElement('div');
      card2.className = 'card';
      card2.innerHTML = `
        <h2 id="dm-title"></h2>
        <div class="dm-steps" id="dm-nums"></div>
        <div class="dm-grid" id="dm-grid"></div>
        <div class="dm-legend" id="dm-legend"></div>
      `;
      el.appendChild(card2);

      /* ---------- 速度 / 播放 ---------- */
      const card3 = document.createElement('div');
      card3.className = 'card center';
      card3.innerHTML = `
        <div class="row between">
          <span class="field-label" style="margin:0">速度</span>
          <span class="big-number small" style="font-size:26px;font-weight:600" id="dm-bpm">100<small> BPM</small></span>
        </div>
        <input type="range" id="dm-slider" min="50" max="200" step="1" value="100">
        <button class="btn-primary mt8" id="dm-toggle">▶ 开始</button>
      `;
      el.appendChild(card3);
      const bpmEl = card3.querySelector('#dm-bpm');
      const slider = card3.querySelector('#dm-slider');
      const toggleBtn = card3.querySelector('#dm-toggle');

      /* ---------- 构建网格 ---------- */
      let numEls = [];
      let cellEls = {}; // key -> [cells]
      function pat() { return PATTERNS[st.pat]; }

      function buildGrid() {
        const p = pat();
        card2.querySelector('#dm-title').textContent = `${p.name} · ${p.steps} 步进`;
        const numsBox = card2.querySelector('#dm-nums');
        const gridBox = card2.querySelector('#dm-grid');
        const legendBox = card2.querySelector('#dm-legend');
        numsBox.innerHTML = ''; gridBox.innerHTML = ''; legendBox.innerHTML = '';
        numEls = []; cellEls = {};

        for (let i = 0; i < p.steps; i++) {
          const n = document.createElement('div');
          n.className = 'dm-stepnum' + (i > 0 && i % 4 === 0 ? ' dm-grp' : '');
          n.textContent = (i % 4 === 0) ? (i / p.spb + 1) : '·';
          numsBox.appendChild(n);
          numEls.push(n);
        }

        ROWS.forEach((r) => {
          const used = p[r.key] && p[r.key].length > 0;
          const row = document.createElement('div');
          row.className = 'dm-row';
          row.style.opacity = used ? '1' : '.38';
          const lab = document.createElement('div');
          lab.className = 'dm-label';
          lab.textContent = r.label;
          lab.title = r.name;
          row.appendChild(lab);
          const cells = [];
          for (let i = 0; i < p.steps; i++) {
            const c = document.createElement('div');
            c.className = 'dm-cell' + (i > 0 && i % 4 === 0 ? ' dm-grp' : '');
            if (p[r.key].includes(i)) {
              c.classList.add('on');
              c.style.background = r.color;
            }
            row.appendChild(c);
            cells.push(c);
          }
          gridBox.appendChild(row);
          cellEls[r.key] = cells;

          const lg = document.createElement('span');
          lg.innerHTML = `<i style="background:${r.color}"></i>${r.label} ${r.name}`;
          legendBox.appendChild(lg);
        });
      }

      /* ---------- 节奏型 chips ---------- */
      PATTERNS.forEach((p, i) => {
        const c = document.createElement('button');
        c.className = 'chip' + (i === st.pat ? ' active' : '');
        c.textContent = p.name;
        c.addEventListener('click', () => {
          if (st.pat === i) return;
          st.pat = i;
          patBox.querySelectorAll('.chip').forEach((x, j) => x.classList.toggle('active', j === i));
          buildGrid();
          // 步数/步长可能变化，播放中则无缝重建调度器
          if (st.playing) { const was = true; stopPlay(true); start(); }
        });
        patBox.appendChild(c);
      });

      /* ---------- 调度 ---------- */
      function makeScheduler() {
        const p = pat();
        const s = new AudioEngine.Scheduler({
          bpm: st.bpm,
          stepsPerBeat: p.spb,
          onStep(step, time) {
            const pos = step % p.steps;
            const off = Math.max(0, time - AudioEngine.now());
            if (p.kick.includes(pos)) AudioEngine.kick(off, 1);
            if (p.snare.includes(pos)) AudioEngine.snare(off, 0.85);
            if (p.clap.includes(pos)) AudioEngine.clap(off, 0.6);
            if (p.openhat.includes(pos)) AudioEngine.hihat(off, { open: true, gain: 0.4 });
            else if (p.hihat.includes(pos)) AudioEngine.hihat(off, { gain: 0.35 });
          },
        });
        s.onUiStep = (step) => {
          const pos = step % pat().steps;
          numEls.forEach((n, i) => n.classList.toggle('cur', i === pos));
          ROWS.forEach((r) => cellEls[r.key] &&
            cellEls[r.key].forEach((c, i) => c.classList.toggle('cur', i === pos)));
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
          toggleBtn.textContent = '▶ 开始';
          toggleBtn.classList.remove('danger');
          numEls.forEach((n) => n.classList.remove('cur'));
          ROWS.forEach((r) => cellEls[r.key] &&
            cellEls[r.key].forEach((c) => c.classList.remove('cur')));
        }
      }
      toggleBtn.addEventListener('click', () => (st.playing ? stopPlay() : start()));

      /* ---------- BPM ---------- */
      function setBpm(v) {
        st.bpm = Math.min(200, Math.max(50, Math.round(v)));
        bpmEl.innerHTML = `${st.bpm}<small> BPM</small>`;
        slider.value = st.bpm;
        if (st.sched) st.sched.setBpm(st.bpm);
      }
      slider.addEventListener('input', () => setBpm(Number(slider.value)));

      buildGrid();
      setBpm(100);
      _stop = () => stopPlay();
    },

    teardown() {
      if (_stop) { try { _stop(); } catch {} _stop = null; }
    },
  };

  Tools.register(tool);
})();
