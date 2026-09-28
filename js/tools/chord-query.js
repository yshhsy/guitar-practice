/* ============================================================
 * 和弦查询 🔍
 * 根音 × 性质 -> 所有把位指法图，可扫弦 / 琶音试听
 * ============================================================ */
(() => {
const tool = {
  id: 'chord-query',
  name: '和弦查询',
  desc: '常见和弦指法位置快速查。',
  icon: '🔍',
  cat: '乐理与工具',

  render(el, api) {
    const { AudioEngine, Theory, ChordLib, Diagram, Store } = api;

    const QUALS = [
      ['', '大'], ['m', 'm'], ['7', '7'], ['maj7', 'maj7'], ['m7', 'm7'],
      ['m7b5', 'm7b5'], ['sus2', 'sus2'], ['sus4', 'sus4'], ['add9', 'add9'],
      ['6', '6'], ['m6', 'm6'], ['dim', 'dim'], ['aug', 'aug'], ['5', '5'],
    ];

    const saved = Store.getJSON('chord_query_v1', {}) || {};
    let rootIdx = saved.rootIdx !== undefined ? saved.rootIdx : 0;
    let quality = saved.quality || '';
    let useFlat = saved.useFlat || false;

    /* 校验指法：每个音都必须属于该和弦（核心库对 sus2/dim 等会误配指型族，这里过滤） */
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
    function voicingsOf(name) {
      const c = Theory.parseChord(name);
      if (!c || !c.valid) return [];
      return ChordLib.getVoicings(name).filter((v) => matchTones(c, v.frets));
    }

    el.innerHTML = `
      <style>
        .cq-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        .cq-voicing{
          border:1px solid #e3d8bf;border-radius:14px;background:#fffdf7;
          padding:12px 8px 12px;text-align:center;
        }
        .cq-voicing .cq-label{font-size:12px;color:#6d6455;font-weight:600;margin-bottom:6px;min-height:16px;}
        .cq-voicing .cq-btns{display:flex;gap:6px;justify-content:center;margin-top:8px;}
        .cq-voicing .btn-mini{padding:6px 10px;font-size:12px;}
        .cq-empty{padding:28px 10px;text-align:center;color:#a29681;font-size:13.5px;line-height:1.9;}
      </style>

      <div class="card">
        <h2>直接输入和弦名</h2>
        <input type="text" id="cq-input" placeholder="如 F#m7，回车查询">
      </div>

      <div class="card">
        <div class="row between" style="margin-bottom:10px">
          <h2 style="margin:0">根音</h2>
          <div class="seg" style="width:110px;flex:none" id="cq-acc">
            <button data-f="0" class="${useFlat ? '' : 'active'}">♯ 升</button>
            <button data-f="1" class="${useFlat ? 'active' : ''}">♭ 降</button>
          </div>
        </div>
        <div class="chip-row" id="cq-roots"></div>
        <div class="field-label mt12" style="margin-bottom:8px">性质</div>
        <div class="chip-row" id="cq-quals"></div>
      </div>

      <div id="cq-out"></div>
    `;

    const rootsBox = el.querySelector('#cq-roots');
    const qualsBox = el.querySelector('#cq-quals');
    const outBox = el.querySelector('#cq-out');

    function chordName() { return Theory.name(rootIdx, useFlat) + quality; }

    function drawPickers() {
      rootsBox.innerHTML = Theory[useFlat ? 'FLAT' : 'SHARP']
        .map((n, i) => `<span class="chip ${i === rootIdx ? 'active' : ''}" data-r="${i}">${n}</span>`).join('');
      qualsBox.innerHTML = QUALS
        .map(([q, lab]) => `<span class="chip ${q === quality ? 'active' : ''}" data-q="${q}">${lab}</span>`).join('');
    }

    function drawOut() {
      const name = chordName();
      Store.setJSON('chord_query_v1', { rootIdx, quality, useFlat });
      const vs = voicingsOf(name);
      if (!vs.length) {
        outBox.innerHTML = `
          <div class="card">
            <div class="cq-empty">
              <div style="font-size:30px;margin-bottom:6px">🈳</div>
              暂时没有收录 <b style="color:#6d6455">${name}</b> 的可靠指法<br>
              换个性质试试，或先用「和弦衍化图」从常见和弦推导
            </div>
          </div>`;
        return;
      }
      outBox.innerHTML = `
        <div class="card">
          <div class="row between" style="margin-bottom:12px">
            <h2 style="margin:0">${name} <span style="font-size:12px;color:#a29681;font-weight:400">${Theory.parseChord(name).qualityCn}</span></h2>
            <span class="hint" style="margin:0">${vs.length} 个把位</span>
          </div>
          <div class="cq-grid">
            ${vs.map((v, i) => `
              <div class="cq-voicing">
                <div class="cq-label">${v.label || '把位 ' + (i + 1)}</div>
                ${Diagram.chord(v.frets, { fingers: v.fingers, barre: v.barre, baseFret: v.baseFret || 1, size: 104 })}
                <div class="cq-btns">
                  <button class="btn-mini" data-a="strum" data-i="${i}">▶ 扫弦</button>
                  <button class="btn-mini" data-a="arp" data-i="${i}">🎶 琶音</button>
                </div>
              </div>`).join('')}
          </div>
        </div>`;
      outBox.querySelectorAll('button[data-a]').forEach((b) => {
        b.addEventListener('click', () => {
          const freqs = ChordLib.chordFreqs(vs[+b.dataset.i].frets);
          if (b.dataset.a === 'strum') AudioEngine.strum(freqs);
          else AudioEngine.arpeggio(freqs, { gap: 0.14 });
        });
      });
    }

    rootsBox.addEventListener('click', (e) => {
      const c = e.target.closest('.chip'); if (!c) return;
      rootIdx = +c.dataset.r; drawPickers(); drawOut();
    });
    qualsBox.addEventListener('click', (e) => {
      const c = e.target.closest('.chip'); if (!c) return;
      quality = c.dataset.q; drawPickers(); drawOut();
    });
    el.querySelector('#cq-acc').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      useFlat = b.dataset.f === '1';
      el.querySelectorAll('#cq-acc button').forEach((x) => x.classList.toggle('active', x === b));
      drawPickers(); drawOut();
    });
    el.querySelector('#cq-input').addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const v = e.target.value.trim();
      const c = Theory.parseChord(v);
      if (c && c.valid) {
        rootIdx = c.rootIdx;
        quality = c.suffix;
        useFlat = c.root.includes('b');
        el.querySelectorAll('#cq-acc button').forEach((x) => x.classList.toggle('active', (x.dataset.f === '1') === useFlat));
        drawPickers(); drawOut();
        e.target.value = '';
        e.target.placeholder = `已查询 ${v}，继续输入可查其他`;
      } else {
        e.target.placeholder = '没认出来，试试如 F#m7 的写法';
        e.target.value = '';
      }
    });

    drawPickers();
    drawOut();
  },

  teardown() {},
};
Tools.register(tool);
})();
