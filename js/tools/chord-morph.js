/* ============================================================
 * 和弦衍化图 🧬
 * 动一个音变成新和弦，看图谱、听对比
 * ============================================================ */
(() => {
const tool = {
  id: 'chord-morph',
  name: '和弦衍化图',
  desc: '动一个音变成新和弦，看图谱听对比。',
  icon: '🧬',
  cat: '乐理与工具',

  render(el, api) {
    const { AudioEngine, Theory, ChordLib, Diagram, Store } = api;

    const saved = Store.getJSON('chord_morph_v1', {}) || {};
    let rootIdx = saved.rootIdx !== undefined ? saved.rootIdx : 0;
    let minor = saved.minor || false;
    let useFlat = saved.useFlat || false;
    let activeCard = -1;

    const DEG = {
      0: '根音', 1: '小二音', 2: '二音', 3: '小三音', 4: '大三音', 5: '四音',
      6: '减五音', 7: '五音', 8: '增五音', 9: '六音', 10: '小七音', 11: '大七音',
    };

    /* ---- 校验指法，过滤核心库误配的指型族 ---- */
    function matchTones(c, frets) {
      const tones = new Set(c.tones.map((t) => ((c.rootIdx + t) % 12 + 12) % 12));
      let played = 0, hasRoot = false;
      for (let i = 0; i < 6; i++) {
        const f = frets[i];
        if (f < 0) continue;
        played++;
        const pc = (ChordLib.OPEN_NOTES[i] + f) % 12;
        if (!tones.has(pc)) return false;
        if (pc === c.rootIdx) hasRoot = true;
      }
      return played >= 3 && hasRoot;
    }
    function firstVoicing(name) {
      const c = Theory.parseChord(name);
      if (!c || !c.valid) return null;
      return ChordLib.getVoicings(name).find((v) => matchTones(c, v.frets)) || null;
    }
    function freqsOf(name) {
      const v = firstVoicing(name);
      if (v) return ChordLib.chordFreqs(v.frets);
      const c = Theory.parseChord(name);
      const out = [];
      let oct = 3, prev = 0;
      c.tones.forEach((t) => {
        const pc = (c.rootIdx + t) % 12;
        let f = Theory.freqOf(pc, oct);
        if (f < prev) f = Theory.freqOf(pc, ++oct);
        prev = f; out.push(f);
      });
      return out;
    }

    /* ---- 音变化的人话描述 ---- */
    function describe(baseQ, q, rIdx) {
      const n = (iv) => Theory.name(rIdx + iv, useFlat);
      if (q === baseQ) return '原位和弦，作为对比的基准。';
      const key = baseQ + '>' + q;
      const M = {
        '>m': `三音 ${n(4)} 降半音成 ${n(3)}，大变小，色彩转忧郁`,
        'm>': `小三音 ${n(3)} 升半音成 ${n(4)}，小变大，色彩转明亮`,
        '>7': `加入小七音 ${n(10)}，制造想要解决的紧张感`,
        'm>7': `小三音 ${n(3)} 升回 ${n(4)}，再加入小七音 ${n(10)}，小调变属七`,
        '>maj7': `加入大七音 ${n(11)}，氛围慵懒、带点爵士味`,
        'm>maj7': `小三音 ${n(3)} 升回 ${n(4)}，再加入大七音 ${n(11)}，忧郁变慵懒`,
        '>m7': `三音 ${n(4)} 降半音，再加入小七音 ${n(10)}，温柔又松弛`,
        'm>m7': `加入小七音 ${n(10)}，温柔又松弛`,
        '>sus2': `三音 ${n(4)} 换成二音 ${n(2)}，空旷悬空`,
        'm>sus2': `小三音 ${n(3)} 换成二音 ${n(2)}，空旷悬空`,
        '>sus4': `三音 ${n(4)} 换成四音 ${n(5)}，悬而未决、想回到原位`,
        'm>sus4': `小三音 ${n(3)} 换成四音 ${n(5)}，悬而未决、想回到原位`,
        '>add9': `加入九音 ${n(2)}，更空灵通透`,
        'm>add9': `加入九音 ${n(2)}，忧郁里多一层空灵`,
        '>6': `加入六音 ${n(9)}，复古甜美`,
        'm>6': `三音 ${n(3)} 升回 ${n(4)}，加入六音 ${n(9)}，复古甜美`,
      };
      if (M[key]) return M[key];
      // 通用兜底：对比音程集合
      const b = Theory.QUALITIES[baseQ].iv.map((x) => x % 12);
      const t = Theory.QUALITIES[q].iv.map((x) => x % 12);
      const added = t.filter((x) => !b.includes(x));
      const removed = b.filter((x) => !t.includes(x));
      const parts = [];
      if (removed.length) parts.push(`去掉${removed.map((x) => DEG[x] || '音').join('、')}`);
      if (added.length) parts.push(`加入${added.map((x) => `${DEG[x] || '音'} ${n(x)}`).join('、')}`);
      return parts.length ? parts.join('，') : '音的组合略有变化';
    }

    el.innerHTML = `
      <style>
        .cm-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        .cm-card{
          border:1.5px solid #e3e8ee;border-radius:14px;background:#ffffff;
          padding:12px 8px;text-align:center;transition:border-color .15s;
        }
        .cm-card.on{border-color:#0fa873;box-shadow:0 0 0 1px #0fa873;}
        .cm-card .cm-name{font-size:19px;font-weight:800;color:#1b1f24;}
        .cm-card .cm-desc{font-size:11px;color:#64707c;line-height:1.6;min-height:34px;margin:6px 0 8px;}
        .cm-card .cm-nodiag{font-size:11px;color:#9aa5b0;padding:30px 0;}
        .cm-card .cm-btns{display:flex;gap:6px;justify-content:center;margin-top:8px;}
        .cm-card .btn-mini{padding:6px 8px;font-size:11.5px;}
      </style>

      <div class="card">
        <div class="row between" style="margin-bottom:10px">
          <h2 style="margin:0">选一个基础和弦</h2>
          <div class="seg" style="width:110px;flex:none" id="cm-acc">
            <button data-f="0" class="${useFlat ? '' : 'active'}">♯</button>
            <button data-f="1" class="${useFlat ? 'active' : ''}">♭</button>
          </div>
        </div>
        <div class="chip-row" id="cm-roots"></div>
        <div class="seg mt12" id="cm-mm">
          <button data-m="0" class="${minor ? '' : 'active'}">大和弦</button>
          <button data-m="1" class="${minor ? 'active' : ''}">小和弦</button>
        </div>
      </div>

      <div id="cm-out"></div>

      <div class="card">
        <h2>和弦情绪地图</h2>
        <div style="font-size:13.5px;line-height:2;color:#64707c">
          <b style="color:#0fa873">大和弦</b>＝明亮坚定 ·
          <b style="color:#0fa873">小和弦</b>＝忧郁内敛 ·
          <b style="color:#f0a22e">7</b>＝紧张、想解决 ·
          <b style="color:#f0a22e">maj7</b>＝慵懒微醺 ·
          <b style="color:#f0a22e">m7</b>＝温柔松弛 ·
          <b style="color:#e05d4d">sus</b>＝悬空未定 ·
          <b style="color:#0fa873">add9 / 6</b>＝加一层颜色，情绪不变
        </div>
      </div>
    `;

    const rootsBox = el.querySelector('#cm-roots');
    const outBox = el.querySelector('#cm-out');

    function baseName() { return Theory.name(rootIdx, useFlat) + (minor ? 'm' : ''); }

    function drawRoots() {
      rootsBox.innerHTML = Theory[useFlat ? 'FLAT' : 'SHARP']
        .map((nm, i) => `<span class="chip ${i === rootIdx ? 'active' : ''}" data-r="${i}">${nm}</span>`).join('');
    }

    function drawOut() {
      Store.setJSON('chord_morph_v1', { rootIdx, minor, useFlat });
      const baseQ = minor ? 'm' : '';
      const root = Theory.name(rootIdx, useFlat);
      // 衍生族：原位 / 大小互换 / 7 / maj7 / m7 / sus2 / sus4 / add9 / 6
      const fam = [
        { q: baseQ, tag: '原位' },
        { q: minor ? '' : 'm', tag: minor ? '变大' : '变小' },
        { q: '7', tag: '属七' },
        { q: 'maj7', tag: '大七' },
        { q: 'm7', tag: '小七' },
        { q: 'sus2', tag: '挂二' },
        { q: 'sus4', tag: '挂四' },
        { q: 'add9', tag: '加九' },
        { q: '6', tag: '六和弦' },
      ];
      const cards = fam.map((f) => {
        const name = root + f.q;
        const v = firstVoicing(name);
        return {
          ...f, name, voicing: v,
          desc: describe(baseQ, f.q, rootIdx),
        };
      });

      outBox.innerHTML = `
        <div class="card">
          <h2>${baseName()} 的衍化族</h2>
          <div class="cm-grid">
            ${cards.map((c, i) => `
              <div class="cm-card ${i === activeCard ? 'on' : ''}" data-i="${i}">
                <div class="cm-name">${c.name}</div>
                <div class="field-label" style="margin:2px 0 0">${c.tag}</div>
                ${c.voicing
                  ? Diagram.chord(c.voicing.frets, { fingers: c.voicing.fingers, barre: c.voicing.barre, baseFret: c.voicing.baseFret || 1, size: 92 })
                  : '<div class="cm-nodiag">暂无指法图</div>'}
                <div class="cm-desc">${c.desc}</div>
                <div class="cm-btns">
                  <button class="btn-mini" data-a="base">▶ 原和弦</button>
                  <button class="btn-mini ${i === activeCard ? 'on' : ''}" data-a="this">▶ 此和弦</button>
                </div>
              </div>`).join('')}
          </div>
          <p class="hint">点「原和弦 / 此和弦」来回对比，体会一个音带来的情绪变化</p>
        </div>`;

      outBox.querySelectorAll('.cm-card').forEach((card) => {
        const i = +card.dataset.i;
        card.querySelector('[data-a="base"]').addEventListener('click', () => {
          AudioEngine.strum(freqsOf(baseName()));
        });
        card.querySelector('[data-a="this"]').addEventListener('click', () => {
          activeCard = i;
          AudioEngine.strum(freqsOf(cards[i].name));
          outBox.querySelectorAll('.cm-card').forEach((x, j) => {
            x.classList.toggle('on', j === i);
            x.querySelector('[data-a="this"]').classList.toggle('on', j === i);
          });
        });
      });
    }

    rootsBox.addEventListener('click', (e) => {
      const c = e.target.closest('.chip'); if (!c) return;
      rootIdx = +c.dataset.r; activeCard = -1;
      drawRoots(); drawOut();
    });
    el.querySelector('#cm-mm').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      minor = b.dataset.m === '1'; activeCard = -1;
      el.querySelectorAll('#cm-mm button').forEach((x) => x.classList.toggle('active', x === b));
      drawOut();
    });
    el.querySelector('#cm-acc').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      useFlat = b.dataset.f === '1'; activeCard = -1;
      el.querySelectorAll('#cm-acc button').forEach((x) => x.classList.toggle('active', x === b));
      drawRoots(); drawOut();
    });

    drawRoots();
    drawOut();
  },

  teardown() {},
};
Tools.register(tool);
})();
