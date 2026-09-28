/* ============================================================
 * 和弦随机练习器 —— 随机出和弦，练反应速度
 * id: chord-random
 * ============================================================ */
(() => {
  let S = null; // 本次渲染的状态

  const tool = {
    id: 'chord-random',
    name: '和弦随机练习器',
    desc: '随机出和弦，手动切换练反应',
    icon: '🎲',
    cat: '练习与训练',

    render(el, api) {
      const { ChordLib, Diagram, AudioEngine } = api;

      S = {
        pool: 'open', cur: null, count: 0, seen: new Set(),
        auto: false, autoPlay: true, interval: 5,
        elapsed: 0, tick: null,
      };

      el.innerHTML = `
        <style>
          .crx-name { font-size: 58px; font-weight: 800; color: #0fa873; letter-spacing: 2px; line-height: 1.15; }
          .crx-diff { display: inline-block; padding: 3px 13px; border-radius: 999px; font-size: 12px; font-weight: 700; margin-top: 4px;
            background: #fdf3e0; border: 1px solid #f6e3bd; color: #9a6a10; letter-spacing: 2px; }
          .crx-diff.hard { background: #fceae6; border-color: #f3cfc9; color: #e05d4d; }
          .crx-tip { font-size: 12.5px; color: #64707c; line-height: 1.75; margin-top: 10px; text-align: justify; }
          .crx-bar { height: 8px; border-radius: 999px; background: #e9edf1; overflow: hidden; margin-top: 12px; }
          .crx-bar > i { display: block; height: 100%; width: 0%; background: linear-gradient(90deg, #f0a22e, #e05d4d); border-radius: 999px; transition: width .05s linear; }
          .crx-stat { font-size: 12.5px; color: #64707c; }
          .crx-stat b { color: #0fa873; font-size: 16px; font-variant-numeric: tabular-nums; }
        </style>

        <div class="card">
          <div class="chip-row" data-pool>
            <button class="chip active" data-p="open">开放和弦</button>
            <button class="chip" data-p="barre">横按和弦</button>
            <button class="chip" data-p="seventh">七和弦</button>
            <button class="chip" data-p="all">全部混合</button>
          </div>
        </div>

        <div class="card center">
          <div class="crx-name" data-name>—</div>
          <div><span class="crx-diff" data-diff>准备</span></div>
          <div class="mt8" data-diagram></div>
          <p class="crx-tip" data-tip>点下方「换一个」开始抽和弦。</p>
          <button class="btn-mini mt12" data-autoplay>🔊 出现时自动示范：开</button>
        </div>

        <button class="btn-primary" data-next>🎲 换一个</button>

        <div class="card mt12">
          <div class="row between wrap">
            <button class="btn-mini" data-auto>⏱ 自动模式：关</button>
            <div class="row" style="gap:6px">
              <span style="font-size:12px;color:#64707c">切换间隔</span>
              <b data-sec style="color:#0fa873;min-width:36px;text-align:right;font-variant-numeric:tabular-nums">5s</b>
            </div>
          </div>
          <input type="range" min="2" max="10" step="1" value="5" data-slider>
          <div class="crx-bar"><i data-bar></i></div>
          <p class="hint" data-autohint style="margin-top:10px">开启后按间隔自动换和弦，配合倒计时练反应</p>
        </div>

        <div class="row between mt12" style="padding:2px 4px">
          <span class="crx-stat" data-stat>本轮已练 <b>0</b> 个 · 覆盖 <b>0</b> 个不同和弦</span>
          <button class="btn-mini" data-reset>清零</button>
        </div>
      `;

      const $ = (sel) => el.querySelector(sel);
      const nameEl = $('[data-name]'), diffEl = $('[data-diff]'),
            diaEl = $('[data-diagram]'), tipEl = $('[data-tip]'),
            statEl = $('[data-stat]'), barEl = $('[data-bar]'),
            secEl = $('[data-sec]'), autoBtn = $('[data-auto]'),
            autoHint = $('[data-autohint]');

      function poolList() {
        const L = ChordLib.LIBRARY;
        return S.pool === 'all'
          ? [...L.open.chords, ...L.barre.chords, ...L.seventh.chords]
          : [...L[S.pool].chords];
      }

      function baseFretOf(frets) {
        const pos = frets.filter((f) => f > 0);
        if (!pos.length) return 1;
        const min = Math.min(...pos), max = Math.max(...pos);
        if (max <= 4) return 1;
        return max - min >= 4 ? max - 3 : min;
      }

      function draw() {
        const c = S.cur;
        if (!c) {
          nameEl.textContent = '—';
          return;
        }
        nameEl.textContent = c.name;
        diffEl.textContent = c.diff;
        diffEl.classList.toggle('hard', c.diff !== '入门');
        diaEl.innerHTML = Diagram.chord(c.frets, {
          fingers: c.fingers, barre: c.barre, baseFret: baseFretOf(c.frets), size: 176,
        });
        tipEl.textContent = '💡 ' + c.tip;
        statEl.innerHTML = `本轮已练 <b>${S.count}</b> 个 · 覆盖 <b>${S.seen.size}</b> 个不同和弦`;
      }

      function playCur() {
        if (!S.cur) return;
        AudioEngine.strum(ChordLib.chordFreqs(S.cur.frets), { gain: 0.62 });
      }

      function resetCountdown() {
        S.elapsed = 0;
        if (barEl) barEl.style.width = '0%';
      }

      function pick() {
        const list = poolList();
        let c = list[Math.floor(Math.random() * list.length)];
        if (list.length > 1 && S.cur) {
          let guard = 0;
          while (c.name === S.cur.name && guard++ < 8) {
            c = list[Math.floor(Math.random() * list.length)];
          }
        }
        S.cur = c;
        S.count += 1;
        S.seen.add(c.name);
        draw();
        if (S.autoPlay) playCur();
        resetCountdown();
      }

      function stopTick() {
        if (S.tick) { clearInterval(S.tick); S.tick = null; }
      }

      function startTick() {
        stopTick();
        resetCountdown();
        S.tick = setInterval(() => {
          if (!S.auto) return;
          S.elapsed += 50;
          const total = S.interval * 1000;
          barEl.style.width = Math.min(100, (S.elapsed / total) * 100) + '%';
          if (S.elapsed >= total) pick();
        }, 50);
      }

      /* ---- 事件 ---- */
      el.querySelector('[data-pool]').addEventListener('click', (e) => {
        const b = e.target.closest('[data-p]');
        if (!b) return;
        S.pool = b.dataset.p;
        el.querySelectorAll('[data-p]').forEach((x) => x.classList.toggle('active', x === b));
      });

      $('[data-next]').addEventListener('click', () => { pick(); });

      $('[data-autoplay]').addEventListener('click', (e) => {
        S.autoPlay = !S.autoPlay;
        e.currentTarget.classList.toggle('on', S.autoPlay);
        e.currentTarget.textContent = `🔊 出现时自动示范：${S.autoPlay ? '开' : '关'}`;
        if (S.autoPlay && S.cur) playCur();
      });

      autoBtn.addEventListener('click', (e) => {
        S.auto = !S.auto;
        e.currentTarget.classList.toggle('on', S.auto);
        e.currentTarget.textContent = `⏱ 自动模式：${S.auto ? '开' : '关'}`;
        autoHint.textContent = S.auto
          ? '自动进行中……跟上演示，倒计时结束就换下一个'
          : '开启后按间隔自动换和弦，配合倒计时练反应';
        resetCountdown();
      });

      $('[data-slider]').addEventListener('input', (e) => {
        S.interval = +e.target.value;
        secEl.textContent = S.interval + 's';
      });

      $('[data-reset]').addEventListener('click', () => {
        S.count = 0;
        S.seen = new Set();
        if (S.cur) S.seen.add(S.cur.name);
        draw();
      });

      draw();
      startTick();
    },

    teardown() {
      if (S) {
        if (S.tick) clearInterval(S.tick);
        S = null;
      }
    },
  };

  Tools.register(tool);
})();
