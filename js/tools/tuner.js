/* ============================================================
 * 调音器 🎵
 * - 听音模式：选弦播放标准参考音，跟着拧弦钮
 * - 麦克风模式：自相关基频检测 + 音分仪表
 * ============================================================ */
(() => {
const tool = (() => {
  let micStop = null; // 停止麦克风的一切资源

  function stopMic() {
    if (micStop) { micStop(); micStop = null; }
  }

  return {
    id: 'tuner',
    name: '调音器',
    desc: '选弦后开始调音，新手上手快。',
    icon: '🎵',
    cat: '乐理与工具',

    render(el, api) {
      const { AudioEngine, Theory, ChordLib } = api;

      // 6 根弦：下标 0 = 6弦(低音E) ... 5 = 1弦(高音e)
      const STRS = [0, 1, 2, 3, 4, 5].map((i) => ({
        idx: i,
        no: 6 - i,
        note: Theory.name(ChordLib.OPEN_NOTES[i]) + (i === 5 ? '' : ''),
        disp: (i === 5 ? 'e' : Theory.name(ChordLib.OPEN_NOTES[i])),
        freq: ChordLib.stringFreq(i, 0),
      }));

      let mode = 'listen';
      let selString = 0;

      el.innerHTML = `
        <style>
          .tuner-str-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
          .tuner-str{
            border:1px solid #e3e8ee;border-radius:14px;background:#ffffff;
            padding:13px 6px 11px;text-align:center;cursor:pointer;transition:all .12s;
          }
          .tuner-str:active{transform:scale(.96);}
          .tuner-str.on{border-color:#0fa873;background:#e2f6ee;box-shadow:0 0 0 1px #0fa873 inset;}
          .tuner-str .ts-no{font-size:11px;color:#9aa5b0;}
          .tuner-str .ts-note{font-size:24px;font-weight:800;color:#1b1f24;margin:2px 0;}
          .tuner-str.on .ts-note{color:#0fa873;}
          .tuner-str .ts-freq{font-size:10.5px;color:#9aa5b0;font-variant-numeric:tabular-nums;}
          .tuner-gauge{position:relative;height:64px;margin:16px 8px 2px;}
          .tuner-gauge-track{position:absolute;left:0;right:0;top:26px;height:10px;border-radius:6px;
            background:linear-gradient(90deg,#e05d4d 0%,#f0a22e 32%,#0fa873 50%,#f0a22e 68%,#e05d4d 100%);}
          .tuner-gauge-center{position:absolute;left:50%;top:16px;width:2px;height:30px;background:#1b1f24;transform:translateX(-50%);}
          .tuner-gauge-ptr{position:absolute;top:14px;left:50%;width:5px;height:34px;border-radius:3px;
            background:#1b1f24;transform:translateX(-50%);transition:left .1s linear;}
          .tuner-gauge-labels{display:flex;justify-content:space-between;font-size:10.5px;color:#9aa5b0;padding:0 8px;}
          .tuner-note-row{display:flex;align-items:baseline;justify-content:center;gap:10px;}
          .tuner-status{font-size:15px;font-weight:700;text-align:center;margin-top:6px;min-height:22px;}
          .tuner-guide{font-size:13.5px;line-height:2;color:#64707c;text-align:left;}
          .tuner-guide b{color:#1b1f24;}
          .tuner-mic-ico{font-size:40px;text-align:center;margin-bottom:8px;}
        </style>
        <div class="seg" id="tuner-seg">
          <button data-m="listen" class="active">听音调弦</button>
          <button data-m="mic">麦克风调音</button>
        </div>
        <div class="mt12" id="tuner-body"></div>
      `;

      const body = el.querySelector('#tuner-body');
      const seg = el.querySelector('#tuner-seg');

      seg.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        seg.querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b));
        mode = b.dataset.m;
        stopMic();
        draw();
      });

      /* ---------------- 听音模式 ---------------- */
      function drawListen() {
        body.innerHTML = `
          <div class="card">
            <h2>标准调弦 · 点弦听音</h2>
            <div class="tuner-str-grid">
              ${STRS.map((s, i) => `
                <div class="tuner-str ${i === selString ? 'on' : ''}" data-i="${i}">
                  <div class="ts-no">${s.no} 弦</div>
                  <div class="ts-note">${s.disp}</div>
                  <div class="ts-freq">${s.freq.toFixed(2)} Hz</div>
                </div>`).join('')}
            </div>
            <button class="btn-ghost mt12" id="tuner-play-all">从 6 弦到 1 弦依次播放</button>
          </div>
          <div class="card">
            <h2>怎么调</h2>
            <div class="tuner-guide">
              ① 点上面的弦，记住它的音高；<br>
              ② 拨响吉他上同一根弦，对比高低；<br>
              ③ 弦声<b>偏低</b>就拧紧弦钮，<b>偏高</b>就放松；<br>
              ④ 边拧边拨，直到两个音完全重合。
            </div>
          </div>
          <p class="hint">点任意琴弦即可反复听参考音</p>
        `;
        body.querySelectorAll('.tuner-str').forEach((c) => {
          c.addEventListener('click', () => {
            selString = +c.dataset.i;
            body.querySelectorAll('.tuner-str').forEach((x) => x.classList.toggle('on', x === c));
            AudioEngine.pluck(STRS[selString].freq, 0, 0.9);
          });
        });
        body.querySelector('#tuner-play-all').addEventListener('click', () => {
          STRS.forEach((s, i) => AudioEngine.pluck(s.freq, i * 0.7, 0.9));
        });
      }

      /* ---------------- 麦克风模式 ---------------- */
      function guideCard(title, lines) {
        return `
          <div class="card center">
            <div class="tuner-mic-ico">🎤</div>
            <h2 style="margin-bottom:8px">${title}</h2>
            <div class="tuner-guide">${lines}</div>
            <button class="btn-primary mt16" id="tuner-back-listen">回到听音模式</button>
          </div>`;
      }

      function bindBackListen() {
        const b = body.querySelector('#tuner-back-listen');
        if (b) b.addEventListener('click', () => {
          mode = 'listen';
          seg.querySelectorAll('button').forEach((x) => x.classList.toggle('active', x.dataset.m === 'listen'));
          draw();
        });
      }

      function drawMic() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          body.innerHTML = guideCard('当前环境不支持麦克风', `
            浏览器没有开放麦克风接口，通常是以下原因：<br>
            ① 页面不是 <b>HTTPS</b> 或 localhost 环境；<br>
            ② 浏览器版本过旧。<br>
            别担心，听音模式一样能把弦调准。`);
          bindBackListen();
          return;
        }
        body.innerHTML = `
          <div class="card center">
            <div class="tuner-mic-ico">🎤</div>
            <h2 style="margin-bottom:8px">麦克风调音</h2>
            <div class="tuner-guide" style="text-align:center">
              授权后拨响一根弦，仪表会告诉你<br>音偏高还是偏低、该往哪边拧。
            </div>
            <button class="btn-primary mt16" id="tuner-mic-start">开启麦克风</button>
          </div>`;
        body.querySelector('#tuner-mic-start').addEventListener('click', startMic);
      }

      async function startMic() {
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
          });
        } catch (err) {
          body.innerHTML = guideCard('麦克风没有授权', `
            调音需要听到你的吉他声：<br>
            ① 点击地址栏左侧的<b>锁形/设置图标</b>；<br>
            ② 把麦克风权限改为「<b>允许</b>」；<br>
            ③ 刷新页面后重试。<br>
            （需要 HTTPS 或 localhost 环境才能授权）`);
          bindBackListen();
          return;
        }

        const ctx = AudioEngine.ensureCtx();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        const buf = new Float32Array(analyser.fftSize);
        let raf = 0;
        let dead = false;

        micStop = () => {
          dead = true;
          cancelAnimationFrame(raf);
          try { source.disconnect(); } catch (e) {}
          try { analyser.disconnect(); } catch (e) {}
          stream.getTracks().forEach((t) => t.stop());
        };

        body.innerHTML = `
          <div class="card center">
            <div class="tuner-note-row">
              <span class="big-number" id="tuner-note">--</span>
              <span class="field-label" id="tuner-strno" style="font-size:15px;margin:0"></span>
            </div>
            <div class="hint" id="tuner-hz" style="margin-top:4px">拨响一根弦试试</div>
            <div class="tuner-gauge">
              <div class="tuner-gauge-track"></div>
              <div class="tuner-gauge-center"></div>
              <div class="tuner-gauge-ptr" id="tuner-ptr"></div>
            </div>
            <div class="tuner-gauge-labels"><span>-50</span><span>0</span><span>+50</span></div>
            <div class="tuner-status" id="tuner-status"></div>
            <button class="btn-ghost mt12" id="tuner-mic-stop">停止调音</button>
          </div>
          <p class="hint">仪表左偏 = 音偏低（拧紧 ↑），右偏 = 音偏高（放松 ↓）</p>`;

        const noteEl = body.querySelector('#tuner-note');
        const strEl = body.querySelector('#tuner-strno');
        const hzEl = body.querySelector('#tuner-hz');
        const ptrEl = body.querySelector('#tuner-ptr');
        const stEl = body.querySelector('#tuner-status');
        body.querySelector('#tuner-mic-stop').addEventListener('click', () => { stopMic(); drawMic(); });

        function autoCorrelate(b, sr) {
          let SIZE = b.length;
          let rms = 0;
          for (let i = 0; i < SIZE; i++) rms += b[i] * b[i];
          rms = Math.sqrt(rms / SIZE);
          if (rms < 0.012) return -1;
          let r1 = 0, r2 = SIZE - 1;
          const th = 0.2;
          for (let i = 0; i < SIZE / 2; i++) if (Math.abs(b[i]) < th) { r1 = i; break; }
          for (let i = 1; i < SIZE / 2; i++) if (Math.abs(b[SIZE - i]) < th) { r2 = SIZE - i; break; }
          const bb = b.slice(r1, r2);
          SIZE = bb.length;
          if (SIZE < 32) return -1;
          const c = new Float32Array(SIZE);
          for (let i = 0; i < SIZE; i++) {
            let s = 0;
            for (let j = 0; j < SIZE - i; j++) s += bb[j] * bb[j + i];
            c[i] = s;
          }
          let d = 0;
          while (d < SIZE - 1 && c[d] > c[d + 1]) d++;
          let maxval = -1, maxpos = -1;
          for (let i = d; i < SIZE; i++) if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
          let T0 = maxpos;
          if (T0 > 0 && T0 < SIZE - 1) {
            const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
            const a = (x1 + x3 - 2 * x2) / 2, bb2 = (x3 - x1) / 2;
            if (a) T0 = T0 - bb2 / (2 * a);
          }
          if (T0 <= 0) return -1;
          return sr / T0;
        }

        function loop() {
          if (dead) return;
          raf = requestAnimationFrame(loop);
          analyser.getFloatTimeDomainData(buf);
          const f = autoCorrelate(buf, ctx.sampleRate);
          if (f < 60 || f > 1400) return;
          // 找最接近的弦
          let best = null, bestCents = 1e9;
          STRS.forEach((s) => {
            const cents = 1200 * Math.log2(f / s.freq);
            if (Math.abs(cents) < Math.abs(bestCents)) { bestCents = cents; best = s; }
          });
          if (!best || Math.abs(bestCents) > 120) return;
          const cents = Math.max(-50, Math.min(50, bestCents));
          noteEl.textContent = best.disp;
          strEl.textContent = `${best.no} 弦`;
          hzEl.textContent = `检测 ${f.toFixed(1)} Hz · 标准 ${best.freq.toFixed(2)} Hz · ${bestCents >= 0 ? '+' : ''}${bestCents.toFixed(0)} 音分`;
          ptrEl.style.left = `${50 + (cents / 50) * 48}%`;
          const ac = Math.abs(bestCents);
          if (ac <= 5) {
            stEl.textContent = '音准了！';
            stEl.style.color = '#0fa873';
            ptrEl.style.background = '#0fa873';
          } else if (bestCents < 0) {
            stEl.textContent = ac > 15 ? '偏低很多，拧紧 ↑' : '略低，轻轻拧紧 ↑';
            stEl.style.color = ac > 15 ? '#e05d4d' : '#f0a22e';
            ptrEl.style.background = ac > 15 ? '#e05d4d' : '#f0a22e';
          } else {
            stEl.textContent = ac > 15 ? '偏高很多，放松 ↓' : '略高，轻轻放松 ↓';
            stEl.style.color = ac > 15 ? '#e05d4d' : '#f0a22e';
            ptrEl.style.background = ac > 15 ? '#e05d4d' : '#f0a22e';
          }
        }
        loop();
      }

      function draw() {
        stopMic();
        if (mode === 'listen') drawListen(); else drawMic();
      }
      draw();
    },

    teardown() { stopMic(); },
  };
})();
Tools.register(tool);
})();
