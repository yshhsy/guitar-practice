/* ============================================================
 * 和弦鼓机 🎛️
 * 和弦走向配鼓点，大屏显示当前和弦与指法图。
 * ============================================================ */
(() => {
  let _stop = null;

  const PROGRESSIONS = [
    { name: '卡农', chords: ['C', 'G', 'Am', 'Em', 'F', 'C', 'F', 'G'] },
    { name: '4536251', chords: ['F', 'G', 'Em', 'Am', 'Dm', 'G', 'C'] },
    { name: '1645', chords: ['C', 'Am', 'F', 'G'] },
    { name: '6415', chords: ['Am', 'F', 'C', 'G'] },
    { name: '12小节布鲁斯', chords: ['E7', 'E7', 'E7', 'E7', 'A7', 'A7', 'E7', 'E7', 'B7', 'A7', 'E7', 'B7'] },
  ];

  // 精简鼓点（16 步）
  const DRUMS = [
    { name: '动次打次', kick: [0, 8], snare: [4, 12], hihat: [0, 2, 4, 6, 8, 10, 12, 14] },
    { name: '摇滚', kick: [0, 6, 8, 10], snare: [4, 12], hihat: [0, 2, 4, 6, 8, 10, 12, 14] },
    { name: '民谣', kick: [0, 8, 10], snare: [4, 12], hihat: [0, 4, 8, 12] },
  ];

  const STEPS = 16; // 每小节 16 步

  const tool = {
    id: 'chord-drum',
    name: '和弦鼓机',
    desc: '和弦走向配鼓点，强化伴奏感。',
    icon: '🎛️',
    cat: '节奏与伴奏',

    render(el, api) {
      const { AudioEngine, ChordLib, Diagram, Theory } = api;
      const st = { bpm: 92, prog: 0, drum: 0, bars: 1, playing: false, sched: null };

      /* ---------- 样式 ---------- */
      const style = document.createElement('style');
      style.textContent = `
        .cd-stage { display:flex; gap:14px; align-items:center; }
        .cd-name { font-size:44px; font-weight:800; color:var(--green-deep); letter-spacing:1px; line-height:1.1; }
        .cd-next { font-size:12px; color:var(--ink-3); margin-top:6px; }
        .cd-next b { color:var(--gold); font-size:15px; }
        .cd-diag { flex:none; background:var(--paper); border:1px solid var(--line-soft); border-radius:12px; padding:6px; }
        .cd-bar-dots { display:flex; justify-content:center; gap:5px; margin-top:14px; flex-wrap:wrap; }
        .cd-bar-dots .beat-dot { width:9px; height:9px; }
        .cd-prog-line { display:flex; gap:6px; overflow-x:auto; padding:2px; margin-top:12px; }
        .cd-prog-line .chord-token { flex:none; margin:0; font-size:13px; padding:5px 10px; opacity:.55; }
        .cd-prog-line .chord-token.cur { opacity:1; background:var(--green); color:#fff; border-color:var(--green); }
        .cd-prog-line .chord-token.next { opacity:.9; border-color:var(--gold); color:#8a6414; background:var(--gold-soft); }
        .cd-bar-num { text-align:center; font-size:11px; color:var(--ink-3); margin-top:8px; font-variant-numeric:tabular-nums; }
      `;
      el.appendChild(style);

      /* ---------- 进行选择 ---------- */
      const card1 = document.createElement('div');
      card1.className = 'card';
      card1.innerHTML = `<div class="field-label">和弦进行</div><div class="chip-row" id="cd-progs"></div>`;
      el.appendChild(card1);
      const progBox = card1.querySelector('#cd-progs');

      /* ---------- 舞台 ---------- */
      const card2 = document.createElement('div');
      card2.className = 'card';
      card2.innerHTML = `
        <div class="cd-stage">
          <div style="flex:1;min-width:0">
            <div class="cd-name" id="cd-name">—</div>
            <div class="cd-next" id="cd-next"></div>
          </div>
          <div class="cd-diag" id="cd-diag"></div>
        </div>
        <div class="cd-bar-dots" id="cd-dots"></div>
        <div class="cd-bar-num" id="cd-barnum"></div>
        <div class="cd-prog-line" id="cd-line"></div>
      `;
      el.appendChild(card2);
      const nameEl = card2.querySelector('#cd-name');
      const nextEl = card2.querySelector('#cd-next');
      const diagEl = card2.querySelector('#cd-diag');
      const dotsEl = card2.querySelector('#cd-dots');
      const barnumEl = card2.querySelector('#cd-barnum');
      const lineEl = card2.querySelector('#cd-line');

      /* ---------- 控制 ---------- */
      const card3 = document.createElement('div');
      card3.className = 'card';
      card3.innerHTML = `
        <div class="field-label">鼓点</div>
        <div class="chip-row" id="cd-drums"></div>
        <div class="field-label mt12">每和弦小节数</div>
        <div class="seg" id="cd-bars">
          <button data-v="1" class="active">1 小节</button>
          <button data-v="2">2 小节</button>
        </div>
        <div class="row between mt12">
          <span class="field-label" style="margin:0">速度</span>
          <span style="font-size:22px;font-weight:600;font-variant-numeric:tabular-nums" id="cd-bpm">92<small style="font-size:12px;color:var(--ink-3)"> BPM</small></span>
        </div>
        <input type="range" id="cd-slider" min="50" max="180" step="1" value="92">
        <button class="btn-primary mt8" id="cd-toggle">▶ 开始</button>
      `;
      el.appendChild(card3);
      const drumBox = card3.querySelector('#cd-drums');
      const barsSeg = card3.querySelector('#cd-bars');
      const bpmEl = card3.querySelector('#cd-bpm');
      const slider = card3.querySelector('#cd-slider');
      const toggleBtn = card3.querySelector('#cd-toggle');

      /* ---------- 数据 ---------- */
      function chords() { return PROGRESSIONS[st.prog].chords; }
      function drum() { return DRUMS[st.drum]; }

      // 取和弦首个 voicing；查不到则用乐理音名兜底合成频率
      function voicingOf(name) {
        const vs = ChordLib.getVoicings(name);
        if (vs.length) return vs[0];
        const c = Theory.parseChord(name);
        if (!c) return null;
        // 兜底：根音在 5/6 弦附近，简单构造
        const base = Theory.freqOf(c.rootIdx, 2);
        return { frets: null, freqs: c.tones.map((t) => base * Math.pow(2, t / 12)), label: '音名合成' };
      }
      function freqsOf(name) {
        const v = voicingOf(name);
        if (!v) return [130.81, 164.81, 196.0];
        return v.frets ? ChordLib.chordFreqs(v.frets) : v.freqs;
      }

      /* ---------- 舞台渲染 ---------- */
      let lineTokens = [];
      function buildLine() {
        lineEl.innerHTML = '';
        lineTokens = chords().map((c) => {
          const t = document.createElement('span');
          t.className = 'chord-token';
          t.textContent = c;
          lineEl.appendChild(t);
          return t;
        });
      }
      function buildDots() {
        dotsEl.innerHTML = '';
        for (let i = 0; i < STEPS; i++) {
          const d = document.createElement('div');
          d.className = 'beat-dot';
          dotsEl.appendChild(d);
        }
      }
      function showChord(idx, stepInBar) {
        const list = chords();
        const cur = list[idx];
        const nxt = list[(idx + 1) % list.length];
        nameEl.textContent = cur;
        nextEl.innerHTML = `下一个 <b>${nxt}</b>`;
        const v = voicingOf(cur);
        diagEl.innerHTML = v && v.frets
          ? Diagram.chord(v.frets, { fingers: v.fingers, barre: v.barre, baseFret: v.baseFret || 1, size: 92 })
          : '<div class="hint" style="margin:0;padding:18px 8px">无指法图</div>';
        lineTokens.forEach((t, i) => {
          t.classList.toggle('cur', i === idx);
          t.classList.toggle('next', i === (idx + 1) % list.length);
        });
        const curTok = lineTokens[idx];
        if (curTok && curTok.scrollIntoView)
          curTok.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
        barnumEl.textContent = `第 ${idx + 1} / ${list.length} 个和弦 · 每和弦 ${st.bars} 小节`;
        if (typeof stepInBar === 'number') lightSteps(stepInBar);
      }
      function lightSteps(pos) {
        dotsEl.querySelectorAll('.beat-dot').forEach((d, i) => {
          d.classList.toggle('on', i === pos);
          d.classList.toggle('first', i === pos && pos === 0);
        });
      }

      /* ---------- 控制绑定 ---------- */
      PROGRESSIONS.forEach((p, i) => {
        const c = document.createElement('button');
        c.className = 'chip' + (i === st.prog ? ' active' : '');
        c.textContent = p.name;
        c.addEventListener('click', () => {
          st.prog = i;
          progBox.querySelectorAll('.chip').forEach((x, j) => x.classList.toggle('active', j === i));
          buildLine();
          showChord(0);
          if (st.playing) { stopPlay(true); start(); }
        });
        progBox.appendChild(c);
      });
      DRUMS.forEach((d, i) => {
        const c = document.createElement('button');
        c.className = 'chip' + (i === st.drum ? ' active' : '');
        c.textContent = d.name;
        c.addEventListener('click', () => {
          st.drum = i;
          drumBox.querySelectorAll('.chip').forEach((x, j) => x.classList.toggle('active', j === i));
        });
        drumBox.appendChild(c);
      });
      barsSeg.querySelectorAll('button').forEach((b) => {
        b.addEventListener('click', () => {
          st.bars = Number(b.dataset.v);
          barsSeg.querySelectorAll('button').forEach((x) => x.classList.remove('active'));
          b.classList.add('active');
          showChord(0);
        });
      });

      function setBpm(v) {
        st.bpm = Math.min(180, Math.max(50, Math.round(v)));
        bpmEl.innerHTML = `${st.bpm}<small style="font-size:12px;color:var(--ink-3)"> BPM</small>`;
        slider.value = st.bpm;
        if (st.sched) st.sched.setBpm(st.bpm);
      }
      slider.addEventListener('input', () => setBpm(Number(slider.value)));

      /* ---------- 调度 ---------- */
      function makeScheduler() {
        const list = chords();
        const barsTotal = list.length * st.bars;
        const s = new AudioEngine.Scheduler({
          bpm: st.bpm,
          stepsPerBeat: 4,
          onStep(step, time) {
            const pos = step % STEPS;                 // 小节内步号
            const bar = Math.floor(step / STEPS) % barsTotal;
            const chordIdx = Math.floor(bar / st.bars);
            const off = Math.max(0, time - AudioEngine.now());
            const d = drum();
            // 鼓
            if (d.kick.includes(pos)) AudioEngine.kick(off, 0.95);
            if (d.snare.includes(pos)) AudioEngine.snare(off, 0.8);
            if (d.hihat.includes(pos)) AudioEngine.hihat(off, { gain: 0.3 });
            // 每小节第 1 拍扫当前和弦
            if (pos === 0) {
              const freqs = freqsOf(list[chordIdx]);
              AudioEngine.strum(freqs, { gap: 0.03, gain: 0.6, dir: 'down', when: off });
            }
          },
        });
        s.onUiStep = (step) => {
          const pos = step % STEPS;
          const bar = Math.floor(step / STEPS) % barsTotal;
          const chordIdx = Math.floor(bar / st.bars);
          if (pos === 0 || showChord._last !== chordIdx) {
            showChord._last = chordIdx;
            showChord(chordIdx);
          }
          lightSteps(pos);
        };
        return s;
      }
      function start() {
        AudioEngine.ensureCtx();
        showChord._last = -1;
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
          lightSteps(-1);
        }
      }
      toggleBtn.addEventListener('click', () => (st.playing ? stopPlay() : start()));

      /* ---------- 初始化 ---------- */
      buildLine();
      buildDots();
      showChord(0);
      setBpm(92);
      _stop = () => stopPlay();
    },

    teardown() {
      if (_stop) { try { _stop(); } catch {} _stop = null; }
    },
  };

  Tools.register(tool);
})();
