/* ============================================================
 * 即兴伴奏机 🎶
 * 选调选走向选风格，循环伴奏跟着练。
 * ============================================================ */
(() => {
  let _stop = null;

  const PROGS = [
    { name: 'I-V-vi-IV', degrees: [0, 4, 5, 3] },
    { name: 'I-vi-IV-V', degrees: [0, 5, 3, 4] },
    { name: 'ii-V-I-IV', degrees: [1, 4, 0, 3] },
    { name: '12小节布鲁斯', blues: true },
  ];

  const STYLES = [
    { key: 'folk',  name: '民谣',   hint: '分解和弦琶音，清淡铺底' },
    { key: 'slow',  name: '慢摇',   hint: '扫弦 + 鼓，律动明显' },
    { key: 'blues', name: '布鲁斯', hint: 'Shuffle 鼓 + 短促扫弦' },
  ];

  const STEPS = 16;

  const tool = {
    id: 'backing',
    name: '即兴伴奏机',
    desc: '选调选走向，循环伴奏跟着练。',
    icon: '🎶',
    cat: '节奏与伴奏',

    render(el, api) {
      const { AudioEngine, ChordLib, Diagram, Theory } = api;
      const st = { key: 'C', prog: 0, style: 0, bpm: 84, playing: false, sched: null };

      /* ---------- 样式 ---------- */
      const style = document.createElement('style');
      style.textContent = `
        .bk-keys { display:flex; gap:8px; overflow-x:auto; padding:2px; }
        .bk-keys .chip { flex:none; }
        .bk-timeline { display:flex; gap:8px; overflow-x:auto; padding:4px 2px; }
        .bk-tl {
          flex:none; min-width:64px; text-align:center; padding:10px 8px 8px;
          background:var(--card); border:1px solid var(--line); border-radius:12px;
          transition: all .15s;
        }
        .bk-tl .t1 { font-size:17px; font-weight:800; color:var(--green-deep); }
        .bk-tl .t2 { font-size:10px; color:var(--ink-3); margin-top:3px; }
        .bk-tl.cur { background:var(--green); border-color:var(--green); transform:scale(1.06); box-shadow:var(--shadow); }
        .bk-tl.cur .t1, .bk-tl.cur .t2 { color:#f3efe4; }
        .bk-now { display:flex; align-items:center; gap:14px; }
        .bk-now-name { font-size:38px; font-weight:800; color:var(--green-deep); line-height:1.1; }
        .bk-now-sub { font-size:12px; color:var(--ink-3); margin-top:5px; }
        .bk-diag { flex:none; background:var(--paper); border:1px solid var(--line-soft); border-radius:12px; padding:6px; }
      `;
      el.appendChild(style);

      /* ---------- 选调 / 进行 / 风格 ---------- */
      const card1 = document.createElement('div');
      card1.className = 'card';
      card1.innerHTML = `
        <div class="field-label">调（Key）</div>
        <div class="bk-keys" id="bk-keys"></div>
        <div class="field-label mt12">进行模板</div>
        <div class="chip-row" id="bk-progs"></div>
        <div class="field-label mt12">伴奏风格</div>
        <div class="seg" id="bk-styles"></div>
        <div class="hint" id="bk-style-hint" style="margin-top:8px"></div>
      `;
      el.appendChild(card1);
      const keysBox = card1.querySelector('#bk-keys');
      const progsBox = card1.querySelector('#bk-progs');
      const stylesSeg = card1.querySelector('#bk-styles');
      const styleHint = card1.querySelector('#bk-style-hint');

      /* ---------- 舞台 ---------- */
      const card2 = document.createElement('div');
      card2.className = 'card';
      card2.innerHTML = `
        <div class="bk-now">
          <div style="flex:1;min-width:0">
            <div class="bk-now-name" id="bk-name">—</div>
            <div class="bk-now-sub" id="bk-sub"></div>
          </div>
          <div class="bk-diag" id="bk-diag"></div>
        </div>
        <div class="bk-timeline mt12" id="bk-tl"></div>
      `;
      el.appendChild(card2);
      const nameEl = card2.querySelector('#bk-name');
      const subEl = card2.querySelector('#bk-sub');
      const diagEl = card2.querySelector('#bk-diag');
      const tlEl = card2.querySelector('#bk-tl');

      /* ---------- 播放控制 ---------- */
      const card3 = document.createElement('div');
      card3.className = 'card';
      card3.innerHTML = `
        <div class="row between">
          <span class="field-label" style="margin:0">速度</span>
          <span style="font-size:22px;font-weight:600;font-variant-numeric:tabular-nums" id="bk-bpm">84<small style="font-size:12px;color:var(--ink-3)"> BPM</small></span>
        </div>
        <input type="range" id="bk-slider" min="50" max="160" step="1" value="84">
        <button class="btn-primary mt8" id="bk-toggle">▶ 开始伴奏</button>
      `;
      el.appendChild(card3);
      const bpmEl = card3.querySelector('#bk-bpm');
      const slider = card3.querySelector('#bk-slider');
      const toggleBtn = card3.querySelector('#bk-toggle');

      /* ---------- 和弦计算 ---------- */
      // 返回 [{chord, numeral}]
      function chordList() {
        const p = PROGS[st.prog];
        const useFlat = st.key.includes('b');
        if (p.blues) {
          const r = Theory.idx(st.key);
          const I7 = Theory.name(r, useFlat) + '7';
          const IV7 = Theory.name(r + 5, useFlat) + '7';
          const V7 = Theory.name(r + 7, useFlat) + '7';
          return [I7, I7, I7, I7, IV7, IV7, I7, I7, V7, IV7, I7, V7]
            .map((c, i) => ({ chord: c, numeral: `第${i + 1}小节` }));
        }
        const degs = Theory.degreeChords(st.key);
        return p.degrees.map((d) => ({ chord: degs[d].chord, numeral: degs[d].numeral }));
      }

      function voicingOf(name) {
        const vs = ChordLib.getVoicings(name);
        if (vs.length) return vs[0];
        const c = Theory.parseChord(name);
        if (!c) return null;
        const base = Theory.freqOf(c.rootIdx, 2);
        return { frets: null, freqs: c.tones.map((t) => base * Math.pow(2, t / 12)) };
      }
      function freqsOf(name) {
        const v = voicingOf(name);
        if (!v) return [130.81, 164.81, 196.0];
        return v.frets ? ChordLib.chordFreqs(v.frets) : v.freqs;
      }

      /* ---------- 选择控件 ---------- */
      Theory.CIRCLE.forEach((k) => {
        const c = document.createElement('button');
        c.className = 'chip' + (k === st.key ? ' active' : '');
        c.textContent = k;
        c.addEventListener('click', () => {
          st.key = k;
          keysBox.querySelectorAll('.chip').forEach((x) => x.classList.toggle('active', x.textContent === k));
          buildTimeline(); showChord(0);
          if (st.playing) { stopPlay(true); start(); }
        });
        keysBox.appendChild(c);
      });
      PROGS.forEach((p, i) => {
        const c = document.createElement('button');
        c.className = 'chip' + (i === st.prog ? ' active' : '');
        c.textContent = p.name;
        c.addEventListener('click', () => {
          st.prog = i;
          progsBox.querySelectorAll('.chip').forEach((x, j) => x.classList.toggle('active', j === i));
          buildTimeline(); showChord(0);
          if (st.playing) { stopPlay(true); start(); }
        });
        progsBox.appendChild(c);
      });
      STYLES.forEach((s, i) => {
        const b = document.createElement('button');
        b.textContent = s.name;
        if (i === st.style) b.classList.add('active');
        b.addEventListener('click', () => {
          st.style = i;
          stylesSeg.querySelectorAll('button').forEach((x) => x.classList.remove('active'));
          b.classList.add('active');
          styleHint.textContent = s.hint;
        });
        stylesSeg.appendChild(b);
      });
      styleHint.textContent = STYLES[st.style].hint;

      /* ---------- 时间线 / 舞台 ---------- */
      let tlItems = [];
      function buildTimeline() {
        tlEl.innerHTML = '';
        tlItems = chordList().map((c, i) => {
          const d = document.createElement('div');
          d.className = 'bk-tl';
          d.innerHTML = `<div class="t1">${c.chord}</div><div class="t2">${c.numeral}</div>`;
          tlEl.appendChild(d);
          return d;
        });
      }
      function showChord(idx, pos) {
        const list = chordList();
        const cur = list[idx % list.length];
        nameEl.textContent = cur.chord;
        subEl.textContent = `${st.key} 调 · ${cur.numeral} · ${PROGS[st.prog].name}`;
        const v = voicingOf(cur.chord);
        diagEl.innerHTML = v && v.frets
          ? Diagram.chord(v.frets, { fingers: v.fingers, barre: v.barre, baseFret: v.baseFret || 1, size: 86 })
          : '<div class="hint" style="margin:0;padding:14px 6px">无指法图</div>';
        tlItems.forEach((t, i) => t.classList.toggle('cur', i === idx % list.length));
        const curEl = tlItems[idx % list.length];
        if (curEl && curEl.scrollIntoView)
          curEl.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      }

      /* ---------- 各风格发声 ---------- */
      function playStyle(styleKey, freqs, pos, off) {
        if (styleKey === 'folk') {
          // 民谣：根音铺底 + 分解琶音（八分）
          if (pos === 0) AudioEngine.pluck(freqs[0] / 2, off, 0.7);            // 低音根音
          if (pos === 8) AudioEngine.pluck(freqs[0] / 2, off, 0.5);
          if (pos % 2 === 0) {
            const picks = freqs.slice(1);
            if (picks.length) {
              const n = pos / 2;
              AudioEngine.pluck(picks[n % picks.length], off, 0.55);
            }
          }
        } else if (styleKey === 'slow') {
          // 慢摇：扫弦 + 鼓
          if (pos === 0) AudioEngine.strum(freqs, { gap: 0.034, gain: 0.62, dir: 'down', when: off });
          if (pos === 10) AudioEngine.strum(freqs, { gap: 0.03, gain: 0.5, dir: 'down', when: off });
          if (pos === 14) AudioEngine.strum(freqs, { gap: 0.026, gain: 0.42, dir: 'up', when: off });
          if (pos === 0 || pos === 8) AudioEngine.kick(off, 0.9);
          if (pos === 4 || pos === 12) AudioEngine.snare(off, 0.7);
          if (pos % 2 === 0) AudioEngine.hihat(off, { gain: 0.25 });
        } else {
          // 布鲁斯：shuffle 鼓 + 短扫
          if (pos === 0) AudioEngine.strum(freqs, { gap: 0.02, gain: 0.6, dir: 'down', when: off });
          if (pos === 6) AudioEngine.strum(freqs, { gap: 0.02, gain: 0.45, dir: 'down', when: off });
          if (pos === 8) AudioEngine.strum(freqs, { gap: 0.02, gain: 0.55, dir: 'down', when: off });
          if (pos === 0 || pos === 8) AudioEngine.kick(off, 0.95);
          if (pos === 4 || pos === 12) AudioEngine.snare(off, 0.75);
          if ([0, 3, 4, 6, 8, 11, 12, 14].includes(pos)) AudioEngine.hihat(off, { gain: 0.3 });
        }
      }

      /* ---------- 调度 ---------- */
      function makeScheduler() {
        const s = new AudioEngine.Scheduler({
          bpm: st.bpm,
          stepsPerBeat: 4,
          onStep(step, time) {
            const list = chordList();
            const bar = Math.floor(step / STEPS) % list.length;
            const pos = step % STEPS;
            const off = Math.max(0, time - AudioEngine.now());
            playStyle(STYLES[st.style].key, freqsOf(list[bar].chord), pos, off);
          },
        });
        s.onUiStep = (step) => {
          const list = chordList();
          const bar = Math.floor(step / STEPS) % list.length;
          const pos = step % STEPS;
          if (pos === 0 || showChord._last !== bar) {
            showChord._last = bar;
            showChord(bar, pos);
          }
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
          toggleBtn.textContent = '▶ 开始伴奏';
          toggleBtn.classList.remove('danger');
        }
      }
      toggleBtn.addEventListener('click', () => (st.playing ? stopPlay() : start()));

      function setBpm(v) {
        st.bpm = Math.min(160, Math.max(50, Math.round(v)));
        bpmEl.innerHTML = `${st.bpm}<small style="font-size:12px;color:var(--ink-3)"> BPM</small>`;
        slider.value = st.bpm;
        if (st.sched) st.sched.setBpm(st.bpm);
      }
      slider.addEventListener('input', () => setBpm(Number(slider.value)));

      /* ---------- 初始化 ---------- */
      buildTimeline();
      showChord(0);
      setBpm(84);
      _stop = () => stopPlay();
    },

    teardown() {
      if (_stop) { try { _stop(); } catch {} _stop = null; }
    },
  };

  Tools.register(tool);
})();
