/* ============================================================
 * 节拍器 ⏱️
 * 拍号/速度切换、细分、击拍测速，适合练拍。
 * ============================================================ */
(() => {
  let _stop = null; // 当前会话清理函数

  const TIME_SIGS = [
    { label: '2/4', beats: 2 },
    { label: '3/4', beats: 3 },
    { label: '4/4', beats: 4 },
    { label: '6/8', beats: 6 },
  ];
  const PRESETS = [
    { label: '慢速', bpm: 60 },
    { label: '中速', bpm: 90 },
    { label: '常用', bpm: 120 },
    { label: '快速', bpm: 160 },
  ];

  const tool = {
    id: 'metronome',
    name: '节拍器',
    desc: '常用拍号速度可切换，适合练拍。',
    icon: '⏱️',
    cat: '节奏与伴奏',

    render(el, api) {
      const { AudioEngine } = api;

      /* ---------- 状态 ---------- */
      const st = {
        bpm: 90,
        sig: 2,        // TIME_SIGS 下标，默认 4/4
        subdiv: 1,     // 1=四分 2=八分
        playing: false,
        sched: null,
        taps: [],
      };

      /* ---------- 样式 ---------- */
      const style = document.createElement('style');
      style.textContent = `
        .mm-bpm-wrap { display:flex; align-items:baseline; justify-content:center; }
        .mm-dots { display:flex; justify-content:center; gap:14px; padding:14px 0 2px; }
        .mm-dots .beat-dot { width:16px; height:16px; }
        .mm-step-row { display:flex; gap:8px; }
        .mm-step-row .btn-mini { flex:1; padding:10px 0; font-variant-numeric:tabular-nums; font-weight:700; }
        .mm-tap { transition: transform .06s, background .12s; }
        .mm-tap.mm-flash { background: var(--gold-soft); border-color: var(--gold); }
        .mm-sig-name { text-align:center; font-size:12px; color:var(--ink-3); margin-top:8px; }
      `;
      el.appendChild(style);

      /* ---------- BPM 卡片 ---------- */
      const card1 = document.createElement('div');
      card1.className = 'card center';
      card1.innerHTML = `
        <div class="mm-bpm-wrap">
          <div class="big-number" id="mm-bpm">90<small>BPM</small></div>
        </div>
        <input type="range" id="mm-slider" min="40" max="208" step="1" value="90">
        <div class="mm-step-row mt8">
          <button class="btn-mini" data-d="-5">−5</button>
          <button class="btn-mini" data-d="-1">−1</button>
          <button class="btn-mini" data-d="1">+1</button>
          <button class="btn-mini" data-d="5">+5</button>
        </div>
        <div class="chip-row mt12" id="mm-presets"></div>
        <div class="mm-dots" id="mm-dots"></div>
        <div class="mm-sig-name" id="mm-signame"></div>
      `;
      el.appendChild(card1);

      /* ---------- 拍号 / 细分 ---------- */
      const card2 = document.createElement('div');
      card2.className = 'card';
      card2.innerHTML = `
        <div class="field-label">拍号</div>
        <div class="seg" id="mm-sig"></div>
        <div class="field-label mt12">细分</div>
        <div class="seg" id="mm-subdiv">
          <button data-v="1" class="active">四分音符</button>
          <button data-v="2">八分音符</button>
        </div>
      `;
      el.appendChild(card2);

      /* ---------- 测速 + 开始 ---------- */
      const card3 = document.createElement('div');
      card3.className = 'card';
      card3.innerHTML = `
        <button class="btn-ghost mm-tap" id="mm-tap">👆 击拍测速（连续点击）</button>
        <div class="hint" id="mm-tap-hint">还未测速，连点 3 次以上取平均</div>
        <button class="btn-primary mt12" id="mm-toggle">▶ 开始</button>
      `;
      el.appendChild(card3);

      /* ---------- 元素引用 ---------- */
      const bpmEl = card1.querySelector('#mm-bpm');
      const slider = card1.querySelector('#mm-slider');
      const dotsBox = card1.querySelector('#mm-dots');
      const sigNameEl = card1.querySelector('#mm-signame');
      const sigSeg = card2.querySelector('#mm-sig');
      const subdivSeg = card2.querySelector('#mm-subdiv');
      const tapBtn = card3.querySelector('#mm-tap');
      const tapHint = card3.querySelector('#mm-tap-hint');
      const toggleBtn = card3.querySelector('#mm-toggle');

      /* ---------- 拍号 seg ---------- */
      TIME_SIGS.forEach((s, i) => {
        const b = document.createElement('button');
        b.textContent = s.label;
        if (i === st.sig) b.classList.add('active');
        b.addEventListener('click', () => {
          st.sig = i;
          sigSeg.querySelectorAll('button').forEach((x) => x.classList.remove('active'));
          b.classList.add('active');
          buildDots();
          if (st.playing) restart();
        });
        sigSeg.appendChild(b);
      });

      subdivSeg.querySelectorAll('button').forEach((b) => {
        b.addEventListener('click', () => {
          st.subdiv = Number(b.dataset.v);
          subdivSeg.querySelectorAll('button').forEach((x) => x.classList.remove('active'));
          b.classList.add('active');
          if (st.playing) restart();
        });
      });

      /* ---------- 预设 chips ---------- */
      const presetBox = card1.querySelector('#mm-presets');
      PRESETS.forEach((p) => {
        const c = document.createElement('button');
        c.className = 'chip';
        c.textContent = `${p.label} ${p.bpm}`;
        c.addEventListener('click', () => setBpm(p.bpm));
        presetBox.appendChild(c);
      });

      /* ---------- BPM 控制 ---------- */
      function setBpm(v) {
        st.bpm = Math.min(208, Math.max(40, Math.round(v)));
        bpmEl.innerHTML = `${st.bpm}<small>BPM</small>`;
        slider.value = st.bpm;
        presetBox.querySelectorAll('.chip').forEach((c, i) =>
          c.classList.toggle('active', PRESETS[i].bpm === st.bpm));
        if (st.sched) st.sched.setBpm(st.bpm);
      }
      slider.addEventListener('input', () => setBpm(Number(slider.value)));
      card1.querySelectorAll('.mm-step-row .btn-mini').forEach((b) =>
        b.addEventListener('click', () => setBpm(st.bpm + Number(b.dataset.d))));

      /* ---------- 节拍点 ---------- */
      function beats() { return TIME_SIGS[st.sig].beats; }
      function buildDots() {
        dotsBox.innerHTML = '';
        for (let i = 0; i < beats(); i++) {
          const d = document.createElement('div');
          d.className = 'beat-dot';
          dotsBox.appendChild(d);
        }
        sigNameEl.textContent =
          `${TIME_SIGS[st.sig].label} 拍 · ${st.subdiv === 2 ? '八分细分' : '四分'} · 每小节 ${beats()} 拍`;
      }
      function lightDot(beat) {
        dotsBox.querySelectorAll('.beat-dot').forEach((d, i) => {
          d.classList.toggle('on', i === beat);
          d.classList.toggle('first', i === beat && beat === 0);
        });
      }

      /* ---------- 调度 ---------- */
      function makeScheduler() {
        const perBar = beats() * st.subdiv;
        const s = new AudioEngine.Scheduler({
          bpm: st.bpm,
          stepsPerBeat: st.subdiv,
          onStep(step, time) {
            const pos = step % perBar;
            const off = Math.max(0, time - AudioEngine.now());
            if (pos === 0) AudioEngine.click(off, true);                    // 重拍
            else if (pos % st.subdiv === 0) AudioEngine.click(off, false); // 正拍
            else AudioEngine.rim(off, 0.35);                               // 细分
          },
        });
        s.onUiStep = (step) => {
          const pos = step % perBar;
          if (pos % st.subdiv === 0) lightDot(pos / st.subdiv);
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
      function stopPlay() {
        if (st.sched) { st.sched.stop(); st.sched = null; }
        st.playing = false;
        toggleBtn.textContent = '▶ 开始';
        toggleBtn.classList.remove('danger');
        lightDot(-1);
      }
      function restart() { stopPlay(); start(); }
      toggleBtn.addEventListener('click', () => (st.playing ? stopPlay() : start()));

      /* ---------- 击拍测速 ---------- */
      tapBtn.addEventListener('click', () => {
        const t = performance.now();
        if (st.taps.length && t - st.taps[st.taps.length - 1] > 2000) st.taps = [];
        st.taps.push(t);
        if (st.taps.length > 6) st.taps.shift();
        tapBtn.classList.add('mm-flash');
        setTimeout(() => tapBtn.classList.remove('mm-flash'), 120);
        if (st.taps.length >= 3) {
          let sum = 0;
          for (let i = 1; i < st.taps.length; i++) sum += st.taps[i] - st.taps[i - 1];
          const avg = sum / (st.taps.length - 1);
          const bpm = Math.round(60000 / avg);
          setBpm(bpm);
          tapHint.textContent = `测得约 ${Math.min(208, Math.max(40, bpm))} BPM（点 ${st.taps.length} 次）`;
        } else {
          tapHint.textContent = `继续点…（已点 ${st.taps.length} 次）`;
        }
      });

      /* ---------- 初始化 ---------- */
      setBpm(90);
      buildDots();
      sigSeg.querySelectorAll('button')[st.sig].classList.add('active');

      _stop = () => stopPlay();
    },

    teardown() {
      if (_stop) { try { _stop(); } catch {} _stop = null; }
    },
  };

  Tools.register(tool);
})();
