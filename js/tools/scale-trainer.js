/* ============================================================
 * 指板音阶训练器 scale-trainer
 * 常见音阶的指板位置，边看边听
 * ============================================================ */
(function () {
  const ID = 'scale-trainer';
  const GREEN = '#17614e';
  const GOLD = '#c99a3f';

  const ROOTS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
  const POSITIONS = [
    { key: 'all', label: '全部', from: 0, to: 12 },
    { key: '1-4', label: '1-4品', from: 1, to: 4 },
    { key: '3-6', label: '3-6品', from: 3, to: 6 },
    { key: '5-8', label: '5-8品', from: 5, to: 8 },
    { key: '7-10', label: '7-10品', from: 7, to: 10 },
    { key: '9-12', label: '9-12品', from: 9, to: 12 },
  ];
  const DEGREE = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];
  const FLAVOR = {
    major: '明亮开阔、稳定向上，绝大多数流行歌曲的底色。',
    minor: '忧郁内敛，自带叙事感，民谣与摇滚的常驻嘉宾。',
    major_pent: '阳光甜美，没有半音碰撞，乡村与民谣旋律的第一选择。',
    minor_pent: 'Blues 与摇滚的根基——五个音就能开出一段即兴。',
    blues: '在小调五声里加一个“蓝调音”，味道立刻变咸。',
    dorian: '小调骨架里透出一点亮色，爵士与 Fusion 的即兴宠儿。',
    mixolydian: '大调但降了七级，摇滚与布鲁斯风味的大调。',
  };

  let _timers = [];
  function clearTimers() {
    _timers.forEach((t) => clearTimeout(t));
    _timers = [];
  }

  function render(el, api) {
    const { AudioEngine, Theory, ChordLib, Diagram, Store } = api;
    const saved = Store.getJSON('st_state') || {};
    const S = {
      root: saved.root || 'A',
      scale: saved.scale || 'minor_pent',
      labelMode: saved.labelMode || 'name',
      pos: 'all',
      playing: false,
    };
    const save = () => Store.setJSON('st_state', { root: S.root, scale: S.scale, labelMode: S.labelMode });

    el.innerHTML = `
    <style>
      #${ID} .st-title { font-size: 12px; font-weight: 700; color: #6d6455; letter-spacing: 2px; margin: 2px 0 8px; }
      #${ID} .st-legend { display: flex; justify-content: center; gap: 16px; margin-top: 10px; font-size: 12px; color: #6d6455; }
      #${ID} .st-legend i { display: inline-block; width: 11px; height: 11px; border-radius: 50%; margin-right: 5px; vertical-align: -1px; }
      #${ID} .st-legend i.ring { background: none; border: 2.4px solid ${GOLD}; width: 7px; height: 7px; }
      #${ID} .st-flavor { margin-top: 14px; font-size: 13px; }
      #${ID} .st-flavor b { color: #8a6414; }
    </style>
    <div id="${ID}">
      <div class="card">
        <div class="st-title">根 音</div>
        <div class="chip-row" data-part="roots"></div>
        <div class="st-title" style="margin-top:14px">音 阶</div>
        <div class="chip-row" data-part="scales"></div>
      </div>
      <div class="card">
        <div class="row between wrap">
          <div class="st-title" style="margin:0">把位筛选</div>
          <div class="seg" style="width:136px" data-part="mode">
            <button data-v="name">音名</button>
            <button data-v="degree">级数</button>
          </div>
        </div>
        <div class="chip-row" data-part="pos" style="margin-top:10px;justify-content:flex-start"></div>
        <div class="mt12" data-part="board"></div>
        <div class="st-legend">
          <span><i style="background:${GOLD}"></i>根音 R</span>
          <span><i style="background:${GREEN}"></i>音阶内音</span>
          <span><i class="ring"></i>正在播放</span>
        </div>
      </div>
      <div class="card">
        <button class="btn-primary" data-part="play">▶ 播放音阶 · 上行＋下行</button>
        <div class="st-title" style="margin-top:16px">构成音（点击试听）</div>
        <div class="chip-row" data-part="notes"></div>
        <div class="result-box st-flavor" data-part="flavor"></div>
      </div>
    </div>`;

    const $ = (sel) => el.querySelector(sel);
    const rootsBox = $('[data-part="roots"]');
    const scalesBox = $('[data-part="scales"]');
    const posBox = $('[data-part="pos"]');
    const modeBox = $('[data-part="mode"]');
    const boardBox = $('[data-part="board"]');
    const notesBox = $('[data-part="notes"]');
    const flavorBox = $('[data-part="flavor"]');
    const playBtn = $('[data-part="play"]');

    function posOf() { return POSITIONS.find((p) => p.key === S.pos); }
    function scaleInfo() { return { iv: Theory.SCALES[S.scale].iv, r: Theory.idx(S.root) }; }

    /* 指板上属于该音阶的所有点 */
    function scalePoints() {
      const { from, to } = posOf();
      const { iv, r } = scaleInfo();
      const pts = [];
      for (let s = 0; s < 6; s++) {
        for (let f = from; f <= to; f++) {
          const st = (((ChordLib.OPEN_NOTES[s] + f - r) % 12) + 12) % 12;
          if (iv.indexOf(st) >= 0) pts.push({ s, f, st });
        }
      }
      return pts;
    }

    function drawBoard(hlKey) {
      const { iv, r } = scaleInfo();
      const markers = scalePoints().map((p) => {
        const isRoot = p.st === 0;
        const isHl = hlKey === p.s + '-' + p.f;
        return {
          string: p.s, fret: p.f,
          color: isHl ? GOLD : (isRoot ? GOLD : GREEN),
          ring: isHl,
          label: isRoot ? 'R' : (S.labelMode === 'degree' ? DEGREE[p.st] : Theory.name(r + p.st)),
        };
      });
      boardBox.innerHTML = Diagram.fretboard({
        fromFret: posOf().from, toFret: posOf().to, markers, width: 340,
      });
    }

    function drawNotes() {
      const names = Theory.scaleNotes(S.root, S.scale);
      notesBox.innerHTML = names.map((n) =>
        `<button class="chip" data-note="${n}">${n}</button>`).join('');
      notesBox.querySelectorAll('[data-note]').forEach((c) =>
        c.addEventListener('click', () => {
          AudioEngine.ensureCtx();
          AudioEngine.pluck(Theory.freqOf(Theory.idx(c.dataset.note), 4), 0, 0.75);
        }));
    }

    function drawFlavor() {
      flavorBox.innerHTML = `<b>${Theory.SCALES[S.scale].cn}</b>：${FLAVOR[S.scale]}`;
    }

    function fillChips(box, items, active, onPick) {
      box.innerHTML = items.map((it) =>
        `<button class="chip${it.v === active ? ' active' : ''}" data-v="${it.v}">${it.t}</button>`).join('');
      box.querySelectorAll('.chip').forEach((c) =>
        c.addEventListener('click', () => onPick(c.dataset.v)));
    }

    function drawRoots() {
      fillChips(rootsBox, ROOTS.map((r) => ({ v: r, t: r })), S.root, (v) => {
        S.root = v; save(); drawRoots(); drawBoard(null); drawNotes(); drawFlavor(); stopPlay();
      });
    }

    function drawScales() {
      fillChips(scalesBox, Object.keys(Theory.SCALES).map((k) => ({ v: k, t: Theory.SCALES[k].cn })), S.scale, (v) => {
        S.scale = v; save(); drawScales(); drawBoard(null); drawNotes(); drawFlavor(); stopPlay();
      });
    }

    function drawPos() {
      fillChips(posBox, POSITIONS.map((p) => ({ v: p.key, t: p.label })), S.pos, (v) => {
        S.pos = v; drawPos(); drawBoard(null); stopPlay();
      });
    }

    function drawMode() {
      modeBox.querySelectorAll('button').forEach((b) =>
        b.classList.toggle('active', b.dataset.v === S.labelMode));
    }
    modeBox.querySelectorAll('button').forEach((b) =>
      b.addEventListener('click', () => {
        S.labelMode = b.dataset.v; save(); drawMode(); drawBoard(null);
      }));

    /* ---------- 播放：上行 + 下行 ---------- */
    function stopPlay() {
      clearTimers();
      if (S.playing) {
        S.playing = false;
        playBtn.textContent = '▶ 播放音阶 · 上行＋下行';
        drawBoard(null);
      }
    }

    function play() {
      if (S.playing) { stopPlay(); return; }
      AudioEngine.ensureCtx();
      S.playing = true;
      playBtn.textContent = '■ 停止播放';
      const notes = scalePoints()
        .map((p) => ({ ...p, freq: ChordLib.stringFreq(p.s, p.f) }))
        .sort((a, b) => a.freq - b.freq);
      const uniq = [];
      notes.forEach((n) => {
        if (!uniq.length || Math.round(n.freq * 10) !== Math.round(uniq[uniq.length - 1].freq * 10)) uniq.push(n);
      });
      const seq = uniq.concat(uniq.slice(1, -1).reverse());
      seq.forEach((n, i) => {
        _timers.push(setTimeout(() => {
          AudioEngine.pluck(n.freq, 0, 0.78);
          drawBoard(n.s + '-' + n.f);
        }, 160 + i * 350));
      });
      _timers.push(setTimeout(stopPlay, 160 + seq.length * 350 + 600));
    }
    playBtn.addEventListener('click', play);

    drawRoots(); drawScales(); drawPos(); drawMode();
    drawBoard(null); drawNotes(); drawFlavor();
  }

  const tool = {
    id: 'scale-trainer',
    name: '指板音阶训练器',
    desc: '常见音阶的指板位置，边看边听。',
    icon: '🎼',
    cat: '指板与曲谱',
    render,
    teardown() { clearTimers(); },
  };
  Tools.register(tool);
})();
