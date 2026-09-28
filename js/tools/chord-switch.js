/* ============================================================
 * 和弦切换计时器 —— 按拍交替 A/B，专练左手转换
 * id: chord-switch
 * ============================================================ */
(() => {
  let S = null;

  const tool = {
    id: 'chord-switch',
    name: '和弦切换计时器',
    desc: '按秒切换和弦，专练左手转换',
    icon: '🔁',
    cat: '练习与训练',

    render(el, api) {
      const { AudioEngine, ChordLib, Diagram } = api;

      // 可选和弦（开放优先，横按/七和弦补充，按名去重）
      const CHORDS = (() => {
        const L = ChordLib.LIBRARY;
        const map = new Map();
        [...L.open.chords, ...L.barre.chords, ...L.seventh.chords].forEach((c) => {
          if (!map.has(c.name)) map.set(c.name, c);
        });
        return [...map.values()];
      })();

      S = {
        a: 'C', b: 'G', beats: 2, bpm: 60,
        playing: false, sched: null,
        count: 0, firstAt: 0, maxRound: 1,
        clickOn: true, strumOn: true,
      };

      el.innerHTML = `
        <style>
          .csw-round { font-size: 12.5px; color: #9aa5b0; letter-spacing: 1px; margin-bottom: 6px; }
          .csw-cur { font-size: 62px; font-weight: 800; color: #0fa873; line-height: 1.05; min-width: 86px; }
          .csw-label { font-size: 11px; color: #9aa5b0; margin-top: 6px; letter-spacing: 2px; }
          .csw-next { font-size: 34px; font-weight: 700; color: #1b1f24; opacity: .32; min-width: 52px; }
          .csw-rate { font-size: 13px; color: #64707c; margin-top: 6px; font-weight: 600; }
          .csw-col { display: flex; flex-direction: column; align-items: center; justify-content: flex-start; }
        </style>

        <div class="card">
          <div class="grid2">
            <div>
              <div class="field-label">和弦 A</div>
              <select data-sel="0"></select>
            </div>
            <div>
              <div class="field-label">和弦 B</div>
              <select data-sel="1"></select>
            </div>
          </div>
          <div class="field-label mt12">常用组合</div>
          <div class="chip-row" data-pairs>
            <button class="chip" data-a="C" data-b="G">C–G</button>
            <button class="chip" data-a="C" data-b="F">C–F</button>
            <button class="chip" data-a="Am" data-b="G">Am–G</button>
            <button class="chip" data-a="G" data-b="D">G–D</button>
            <button class="chip" data-a="E" data-b="A">E–A</button>
            <button class="chip" data-a="Em" data-b="C">Em–C</button>
          </div>
        </div>

        <div class="card">
          <div class="row" style="gap:14px">
            <div style="width:108px">
              <div class="field-label">BPM</div>
              <input type="number" min="40" max="200" value="60" data-bpm>
            </div>
            <div style="flex:1">
              <div class="field-label">每个和弦</div>
              <div class="seg" data-beats>
                <button class="active" data-v="2">2 拍</button>
                <button data-v="4">4 拍</button>
              </div>
            </div>
          </div>
          <div class="row mt12" style="gap:8px">
            <button class="btn-mini on" data-click>🥁 节拍</button>
            <button class="btn-mini on" data-strum>🎸 示范扫弦</button>
          </div>
        </div>

        <div class="card center">
          <div class="csw-round" data-round>未开始 · 第 1 轮</div>
          <div class="row" style="justify-content:center;align-items:flex-start;gap:16px">
            <div class="csw-col">
              <div class="csw-cur" data-cur>C</div>
              <div class="csw-label">当前</div>
            </div>
            <div data-diagram></div>
            <div class="csw-col">
              <div class="csw-next" data-next>G</div>
              <div class="csw-label">接下来</div>
            </div>
          </div>
          <div class="row mt12" style="justify-content:center;gap:9px" data-dots></div>
        </div>

        <button class="btn-primary" data-toggle>▶ 开始</button>

        <div class="grid2 mt12">
          <button class="btn-ghost" data-complete>✅ 完成一次</button>
          <button class="btn-ghost" data-reset>↩ 重置</button>
        </div>

        <div class="card center mt12">
          <div class="big-number"><span data-rate>—</span><small>次 / 分钟</small></div>
          <div class="csw-rate" data-rating>跟着节拍练，每完成一次切换就点一下「完成一次」</div>
          <div class="hint" data-cnt>已手动完成 0 次</div>
        </div>
      `;

      const $ = (sel) => el.querySelector(sel);
      const curEl = $('[data-cur]'), nextEl = $('[data-next]'),
            diaEl = $('[data-diagram]'), dotsEl = $('[data-dots]'),
            roundEl = $('[data-round]'), rateEl = $('[data-rate]'),
            ratingEl = $('[data-rating]'), cntEl = $('[data-cnt]'),
            toggleBtn = $('[data-toggle]');

      function entry(name) { return CHORDS.find((c) => c.name === name) || CHORDS[0]; }
      function freqs(name) { return ChordLib.chordFreqs(entry(name).frets); }

      function baseFretOf(frets) {
        const pos = frets.filter((f) => f > 0);
        if (!pos.length) return 1;
        const min = Math.min(...pos), max = Math.max(...pos);
        if (max <= 4) return 1;
        return max - min >= 4 ? max - 3 : min;
      }

      function drawStatic() {
        const c = entry(S.a);
        curEl.textContent = S.a;
        nextEl.textContent = S.b;
        diaEl.innerHTML = Diagram.chord(c.frets, {
          fingers: c.fingers, barre: c.barre, baseFret: baseFretOf(c.frets), size: 150,
        });
        drawDots(-1);
        roundEl.textContent = (S.playing ? '' : '未开始 · ') + `第 ${S.maxRound} 轮`;
      }

      function drawDots(on) {
        dotsEl.innerHTML = '';
        for (let i = 0; i < S.beats; i++) {
          const d = document.createElement('div');
          d.className = 'beat-dot' + (i === on ? ' on' : '') + (i === 0 && on === 0 ? ' first' : '');
          dotsEl.appendChild(d);
        }
      }

      function updateRate() {
        cntEl.textContent = `已手动完成 ${S.count} 次`;
        if (!S.count || !S.firstAt) { rateEl.textContent = '—'; return; }
        const mins = Math.max(10 / 60, (performance.now() - S.firstAt) / 60000);
        const r = Math.round(S.count / mins);
        rateEl.textContent = r;
        ratingEl.textContent =
          r >= 15 ? '🏆 优秀！切换如行云流水' :
          r >= 10 ? '👍 良好，离高手只差一点' :
          r >= 6  ? '💪 及格，还能更快' : '🐢 先求按准，再求按快';
      }

      function start() {
        if (S.sched) { try { S.sched.stop(); } catch (e) {} }
        S.playing = true;
        const total = S.beats * 2;
        const sched = new AudioEngine.Scheduler({
          bpm: S.bpm, stepsPerBeat: 1,
          onStep(step, time) {
            const off = Math.max(0, time - AudioEngine.now());
            const pos = ((step % total) + total) % total;
            const idx = Math.floor(pos / S.beats);      // 0 = A, 1 = B
            const beatIn = pos % S.beats;               // 和弦内第几拍
            if (S.clickOn) AudioEngine.click(off, beatIn === 0);
            if (beatIn === 0 && S.strumOn) {
              AudioEngine.strum(freqs(idx === 0 ? S.a : S.b), { when: off, gain: 0.45 });
            }
          },
        });
        sched.onUiStep = (u) => {
          const total2 = S.beats * 2;
          const pos = ((u % total2) + total2) % total2;
          const idx = Math.floor(pos / S.beats);
          const name = idx === 0 ? S.a : S.b;
          if (curEl.textContent !== name) {
            curEl.textContent = name;
            nextEl.textContent = idx === 0 ? S.b : S.a;
            const c = entry(name);
            diaEl.innerHTML = Diagram.chord(c.frets, {
              fingers: c.fingers, barre: c.barre, baseFret: baseFretOf(c.frets), size: 150,
            });
          }
          drawDots(pos % S.beats);
          const round = Math.floor(u / total2) + 1;
          if (round > S.maxRound) S.maxRound = round;
          roundEl.textContent = `第 ${S.maxRound} 轮`;
        };
        S.sched = sched;
        sched.start();
        toggleBtn.textContent = '⏸ 暂停';
        roundEl.textContent = `第 ${S.maxRound} 轮`;
      }

      function stop() {
        S.playing = false;
        if (S.sched) { try { S.sched.stop(); } catch (e) {} }
        toggleBtn.textContent = '▶ 继续';
        drawDots(-1);
        roundEl.textContent = `已暂停 · 第 ${S.maxRound} 轮`;
      }

      /* ---- 事件 ---- */
      CHORDS.forEach((c) => {
        [0, 1].forEach((i) => {
          const o = document.createElement('option');
          o.value = c.name; o.textContent = c.name + (c.diff !== '入门' ? '（' + c.diff + '）' : '');
          el.querySelector(`[data-sel="${i}"]`).appendChild(o);
        });
      });
      el.querySelector('[data-sel="0"]').value = S.a;
      el.querySelector('[data-sel="1"]').value = S.b;

      el.querySelectorAll('[data-sel]').forEach((sel) => {
        sel.addEventListener('change', () => {
          if (sel.dataset.sel === '0') S.a = sel.value; else S.b = sel.value;
          drawStatic();
        });
      });

      el.querySelector('[data-pairs]').addEventListener('click', (e) => {
        const b = e.target.closest('[data-a]');
        if (!b) return;
        S.a = b.dataset.a; S.b = b.dataset.b;
        el.querySelector('[data-sel="0"]').value = S.a;
        el.querySelector('[data-sel="1"]').value = S.b;
        drawStatic();
      });

      $('[data-bpm]').addEventListener('change', (e) => {
        S.bpm = Math.min(200, Math.max(40, +e.target.value || 60));
        e.target.value = S.bpm;
        if (S.sched) S.sched.setBpm(S.bpm);
      });

      el.querySelector('[data-beats]').addEventListener('click', (e) => {
        const b = e.target.closest('[data-v]');
        if (!b) return;
        S.beats = +b.dataset.v;
        el.querySelectorAll('[data-beats] button').forEach((x) => x.classList.toggle('active', x === b));
        drawDots(-1);
      });

      $('[data-click]').addEventListener('click', (e) => {
        S.clickOn = !S.clickOn;
        e.currentTarget.classList.toggle('on', S.clickOn);
      });
      $('[data-strum]').addEventListener('click', (e) => {
        S.strumOn = !S.strumOn;
        e.currentTarget.classList.toggle('on', S.strumOn);
        if (S.strumOn && !S.playing) AudioEngine.strum(freqs(S.a), { gain: 0.5 });
      });

      toggleBtn.addEventListener('click', () => { S.playing ? stop() : start(); });

      $('[data-complete]').addEventListener('click', () => {
        S.count += 1;
        if (!S.firstAt) S.firstAt = performance.now();
        updateRate();
        const c = S.playing ? (curEl.textContent) : S.a;
        AudioEngine.strum(freqs(c), { gain: 0.55 });
      });

      $('[data-reset]').addEventListener('click', () => {
        stop();
        S.count = 0; S.firstAt = 0; S.maxRound = 1;
        updateRate();
        ratingEl.textContent = '跟着节拍练，每完成一次切换就点一下「完成一次」';
        drawStatic();
      });

      drawStatic();
      updateRate();
    },

    teardown() {
      if (S) {
        if (S.sched) { try { S.sched.stop(); } catch (e) {} }
        S = null;
      }
    },
  };

  Tools.register(tool);
})();
