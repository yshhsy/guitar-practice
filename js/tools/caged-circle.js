/* ============================================================
 * CAGED 和五度圈 caged-circle
 * CAGED 五形、指型平移与五度圈关系图
 * ============================================================ */
(function () {
  const ID = 'caged-circle';
  const GREEN = '#17614e';
  const GOLD = '#c99a3f';

  /* C 大和弦的五个标准 CAGED 把位（frets 下标 0 = 6 弦） */
  const CAGED = [
    { cn: 'C 形', pos: '开放把位', frets: [-1, 3, 2, 0, 1, 0], fingers: [-1, 3, 2, 0, 1, 0],
      barre: null, baseFret: 1, rootDesc: '根音在 5 弦 3 品',
      desc: '人人都会的 C 和弦本尊，CAGED 接力的第一棒。' },
    { cn: 'A 形', pos: '第 3 品', frets: [-1, 3, 5, 5, 4, 3], fingers: [-1, 1, 3, 4, 2, 1],
      barre: { fret: 3, from: 1, to: 5 }, baseFret: 3, rootDesc: '根音在 5 弦 3 品',
      desc: 'Am 指型＋食指横按，与 C 形共用同一个根音位置。' },
    { cn: 'G 形', pos: '第 5 品起', frets: [8, 7, 5, 5, 5, 8], fingers: [4, 3, 1, 1, 1, 4],
      barre: null, baseFret: 5, rootDesc: '根音在 6 弦 8 品',
      desc: '横跨 5-8 品的大跨度指型，完整按出较难，常拆开来用。' },
    { cn: 'E 形', pos: '第 8 品', frets: [8, 10, 10, 9, 8, 8], fingers: [1, 3, 4, 2, 1, 1],
      barre: { fret: 8, from: 0, to: 5 }, baseFret: 8, rootDesc: '根音在 6 弦 8 品',
      desc: 'E 指型＋整指横按，横按家族的主力，音色紧凑有力。' },
    { cn: 'D 形', pos: '第 10 品起', frets: [-1, -1, 10, 12, 13, 12], fingers: [-1, -1, 1, 3, 4, 2],
      barre: null, baseFret: 10, rootDesc: '根音在 4 弦 10 品',
      desc: '小巧的高把位指型，只按四根弦，明亮透亮。' },
  ];

  const SHIFT_KEYS = ['E', 'Em', 'A', 'Am'];
  const SUFFIX = { E: '', Em: 'm', A: '', Am: 'm' };
  /* getVoicings 能正确生成指型的性质（其余走琶音兜底） */
  const PLAYABLE = ['', 'm', '7', 'maj7', 'M7', 'm7', 'sus4', 'sus2', 'add9', '6'];

  function render(el, api) {
    const { AudioEngine, Theory, ChordLib, Diagram, Store } = api;
    let view = Store.getJSON('cc_view') || 'caged';
    let key = 'C';

    el.innerHTML = `
    <style>
      #${ID} .cc-p { font-size: 14px; line-height: 1.8; color: #2e2a22; }
      #${ID} .cc-p b { color: ${GREEN}; }
      #${ID} .cc-badge { display: inline-flex; align-items: center; justify-content: center;
        width: 22px; height: 22px; border-radius: 7px; background: #e4efe9; color: ${GREEN};
        font-size: 12px; font-weight: 800; margin-right: 6px; }
      #${ID} .cc-pos { font-size: 11.5px; color: #a29681; margin-left: 8px; }
      #${ID} .cc-shape-name { font-size: 15px; font-weight: 800; }
      #${ID} .cc-desc { flex: 1; font-size: 12.5px; color: #6d6455; line-height: 1.65; min-width: 0; }
      #${ID} .cc-fig { flex: none; }
      #${ID} .cc-shift { padding: 14px 0; border-bottom: 1px dashed #e3d8bf; }
      #${ID} .cc-shift:last-child { border-bottom: none; padding-bottom: 2px; }
      #${ID} .cc-chordname { font-size: 20px; font-weight: 800; color: ${GREEN}; min-width: 56px; text-align: right; }
      #${ID} .cc-deg-list { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 10px; }
      #${ID} .cc-deg { display: flex; align-items: center; gap: 8px; }
      #${ID} .cc-rn { width: 34px; text-align: right; font-size: 12.5px; font-weight: 700; color: #a29681; font-style: italic; }
      #${ID} .cc-keynote { font-size: 13px; line-height: 1.9; }
      #${ID} .cc-title { font-size: 12px; font-weight: 700; color: #6d6455; letter-spacing: 2px; margin: 2px 0 8px; }
    </style>
    <div id="${ID}">
      <div class="seg" data-part="seg">
        <button data-v="caged">CAGED 五形</button>
        <button data-v="circle">五度圈</button>
      </div>
      <div data-part="cagedView" style="display:none"></div>
      <div data-part="circleView" style="display:none"></div>
    </div>`;

    const $ = (sel) => el.querySelector(sel);
    const segBox = $('[data-part="seg"]');
    const cagedView = $('[data-part="cagedView"]');
    const circleView = $('[data-part="circleView"]');

    /* ---------- 通用：安全播放一个和弦 ---------- */
    function playChord(name) {
      AudioEngine.ensureCtx();
      const c = Theory.parseChord(name);
      if (!c) return;
      if (PLAYABLE.indexOf(c.suffix) >= 0) {
        const vs = ChordLib.getVoicings(name);
        if (vs.length) { AudioEngine.strum(ChordLib.chordFreqs(vs[0].frets)); return; }
      }
      const freqs = c.tones.map((t) =>
        Theory.freqOf((c.rootIdx + t) % 12, 3 + Math.floor((c.rootIdx + t) / 12)));
      AudioEngine.strum(freqs);
    }

    /* ================= CAGED 五形 ================= */
    function rootMarkers() {
      const markers = [];
      for (let s = 0; s < 6; s++) {
        for (let f = 0; f <= 12; f++) {
          if ((ChordLib.OPEN_NOTES[s] + f) % 12 === 0) markers.push({ string: s, fret: f, label: 'R', color: GOLD });
        }
      }
      return markers;
    }

    function renderCaged() {
      cagedView.style.display = '';
      circleView.style.display = 'none';
      cagedView.innerHTML = `
      <div class="card mt12">
        <h2>C 大和弦的五个把位</h2>
        <p class="cc-p">同一组音（C–E–G），在指板上却有 5 副面孔：<b>C、A、G、E、D</b> 五种指型沿指板向上接力——这就是 <b>CAGED 系统</b>。它也是记忆指板的一张地图。</p>
      </div>
      ${CAGED.map((c, i) => `
      <div class="card">
        <div class="row">
          <div>
            <span class="cc-badge">${i + 1}</span><span class="cc-shape-name">${c.cn}</span><span class="cc-pos">${c.pos}</span>
          </div>
        </div>
        <div class="row mt8">
          <div class="cc-fig">${Diagram.chord(c.frets, { fingers: c.fingers, barre: c.barre, baseFret: c.baseFret, size: 106 })}</div>
          <div class="cc-desc">${c.desc}<div style="color:${GREEN};font-weight:700;margin-top:6px">${c.rootDesc}</div></div>
        </div>
      </div>`).join('')}
      <div class="card">
        <div class="cc-title">根音地图 · C 在哪里</div>
        ${Diagram.fretboard({ fromFret: 0, toFret: 12, markers: rootMarkers(), width: 340 })}
        <div class="hint">五个金色 R 就是五个指型的根音出发点，正好铺满 0-12 品</div>
      </div>
      <div class="card">
        <h2>指型平移实验室</h2>
        <p class="cc-p"><b>E 指型向下平移 1 品（食指横按）就是 F 和弦</b>……拖动滑杆，看 4 个指型如何变出几十个和弦。</p>
        ${SHIFT_KEYS.map((k) => `
        <div class="cc-shift">
          <div class="row between">
            <span class="field-label" style="margin:0">${ChordLib.SHAPES[k].cn}（基准品）</span>
            <b class="cc-chordname" data-name="${k}"></b>
          </div>
          <input type="range" min="1" max="9" value="1" data-slider="${k}">
          <div class="row mt8">
            <div class="cc-fig" data-fig="${k}"></div>
            <button class="btn-mini" data-listen="${k}" style="flex:1">♪ 听听</button>
          </div>
        </div>`).join('')}
      </div>`;

      SHIFT_KEYS.forEach((k) => {
        const slider = cagedView.querySelector(`[data-slider="${k}"]`);
        const nameEl = cagedView.querySelector(`[data-name="${k}"]`);
        const figEl = cagedView.querySelector(`[data-fig="${k}"]`);
        let current = null;
        function update() {
          const v = ChordLib.shapeAt(k, +slider.value);
          current = v;
          nameEl.textContent = v.rootName + SUFFIX[k];
          figEl.innerHTML = Diagram.chord(v.frets, { fingers: v.fingers, barre: v.barre, baseFret: v.baseFret, size: 106 });
        }
        slider.addEventListener('input', update);
        cagedView.querySelector(`[data-listen="${k}"]`).addEventListener('click', () => {
          if (current) { AudioEngine.ensureCtx(); AudioEngine.strum(ChordLib.chordFreqs(current.frets)); }
        });
        update();
      });
    }

    /* ================= 五度圈 ================= */
    function circleSvg() {
      const cx = 170, cy = 170, R = 116;
      let s = `<svg viewBox="0 0 340 340" width="340" style="max-width:100%" xmlns="http://www.w3.org/2000/svg">`;
      s += `<defs><marker id="${ID}-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${GOLD}"/></marker></defs>`;
      s += `<circle cx="${cx}" cy="${cy}" r="152" fill="#f8f3e6" stroke="#e3d8bf"/>`;
      s += `<circle cx="${cx}" cy="${cy}" r="84" fill="none" stroke="#e3d8bf" stroke-dasharray="3 6"/>`;
      s += `<path d="M 300 95 A 152 152 0 0 1 300 245" fill="none" stroke="${GOLD}" stroke-width="2" marker-end="url(#${ID}-arrow)"/>`;
      for (let i = 0; i < 12; i++) {
        const k = Theory.CIRCLE[i];
        const a = (i * 30 - 90) * Math.PI / 180;
        const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
        const sel = k === key;
        s += `<g data-key="${k}" style="cursor:pointer">
          <circle cx="${x}" cy="${y}" r="24" fill="${sel ? GREEN : '#fffdf7'}" stroke="${sel ? GREEN : '#e3d8bf'}" stroke-width="${sel ? 2.5 : 1.5}"/>
          <text x="${x}" y="${y + 5}" text-anchor="middle" font-size="15" font-weight="700" fill="${sel ? '#f3efe4' : '#2e2a22'}" font-family="sans-serif">${k}</text>
        </g>`;
      }
      s += `<text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="18" font-weight="800" fill="#2e2a22" font-family="sans-serif">五度圈</text>`;
      s += `<text x="${cx}" y="${cy + 18}" text-anchor="middle" font-size="10" fill="#a29681" font-family="sans-serif">顺时针 · 上行纯五度</text>`;
      s += '</svg>';
      return s;
    }

    function renderCircle() {
      circleView.style.display = '';
      cagedView.style.display = 'none';
      circleView.innerHTML = `
      <div class="card mt12 center">
        ${circleSvg()}
        <div class="hint">点击圆周上任意调，查看它的顺阶和弦</div>
      </div>
      <div data-part="degCard"></div>
      <div class="card">
        <h2>圈上的小知识</h2>
        <div class="result-box cc-keynote">
          ① 顺时针走一步，根音<b>上行纯五度</b>（C→G→D……）；<br>
          ② <b>相邻两个调只差一个升降号</b>，离 C 越远记号越多——向右加 ♯、向左加 ♭；<br>
          ③ <b>I–IV–V 在圈上相邻</b>：逆时针一格是 IV，顺时针一格是 V，转调时它们最亲近。
        </div>
      </div>`;
      circleView.querySelectorAll('[data-key]').forEach((g) =>
        g.addEventListener('click', () => {
          key = g.dataset.key;
          circleView.querySelector('.card').innerHTML = circleSvg() + '<div class="hint">点击圆周上任意调，查看它的顺阶和弦</div>';
          circleView.querySelectorAll('[data-key]').forEach((g2) =>
            g2.addEventListener('click', () => { key = g2.dataset.key; renderCircle(); }));
          renderDeg();
        }));
      renderDeg();
    }

    const degCard = () => circleView.querySelector('[data-part="degCard"]');
    function renderDeg() {
      /* 核心库 DEGREE_QLT 将 vi 级标为 '7'（如 C 大调给出 A7），此处修正为小三和弦 */
      const degs = Theory.degreeChords(key).map((d, i) =>
        i === 5 ? { numeral: d.numeral, chord: d.chord.replace(/7$/, '') + 'm' } : d);
      degCard().innerHTML = `
      <div class="card">
        <h2>${key} 大调 · 顺阶和弦</h2>
        <div class="cc-deg-list">
          ${degs.map((d) => `
          <div class="cc-deg">
            <span class="cc-rn">${d.numeral}</span>
            <button class="chord-token" data-chord="${d.chord}">${d.chord}</button>
          </div>`).join('')}
        </div>
        <div class="hint">点击和弦试听（自动选择合适的把位）</div>
      </div>`;
      degCard().querySelectorAll('[data-chord]').forEach((c) =>
        c.addEventListener('click', () => playChord(c.dataset.chord)));
    }

    /* ---------- 顶部切换 ---------- */
    function drawSeg() {
      segBox.querySelectorAll('button').forEach((b) =>
        b.classList.toggle('active', b.dataset.v === view));
    }
    segBox.querySelectorAll('button').forEach((b) =>
      b.addEventListener('click', () => {
        view = b.dataset.v;
        Store.setJSON('cc_view', view);
        drawSeg();
        if (view === 'caged') renderCaged(); else renderCircle();
      }));

    drawSeg();
    if (view === 'caged') renderCaged(); else renderCircle();
  }

  const tool = {
    id: 'caged-circle',
    name: 'CAGED 和五度圈',
    desc: 'CAGED 五形、指型平移与五度圈关系图。',
    icon: '⭕',
    cat: '指板与曲谱',
    render,
    teardown() {},
  };
  Tools.register(tool);
})();
