/* ============================================================
 * 弹唱选调助手 🎯
 * 按音域和顺手按法，推荐变调夹 + 指法调组合
 * ============================================================ */
(() => {
const tool = {
  id: 'key-helper',
  name: '弹唱选调助手',
  desc: '按音域和按法推荐弹唱调。',
  icon: '🎯',
  cat: '乐理与工具',

  render(el, api) {
    const { AudioEngine, Theory, ChordLib, Store } = api;

    const KN = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
    const keyName = (i) => KN[((i % 12) + 12) % 12];
    const SHAPE_KEYS = ['C', 'G', 'D', 'A', 'E'];
    const RANK = { C: 0, G: 1, D: 2, A: 3, E: 4 }; // 指法简单度

    const saved = Store.getJSON('key_helper_v1', {}) || {};
    let origKey = saved.origKey || 'D';
    let drop = saved.drop !== undefined ? saved.drop : 2;
    let favs = saved.favs || ['C', 'G'];

    /* ---- 发音辅助 ---- */
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
    function playChord(name) {
      const c = Theory.parseChord(name);
      if (!c) return;
      const v = ChordLib.getVoicings(name).find((x) => matchTones(c, x.frets));
      if (v) AudioEngine.strum(ChordLib.chordFreqs(v.frets));
    }

    el.innerHTML = `
      <style>
        .kh-step{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
        .kh-step-no{
          width:26px;height:26px;flex:none;border-radius:50%;
          background:#17614e;color:#f3efe4;font-size:13px;font-weight:800;
          display:flex;align-items:center;justify-content:center;
        }
        .kh-rec{
          border:1px solid #e3d8bf;border-radius:12px;background:#fffdf7;
          padding:12px 14px;margin-top:10px;font-size:14.5px;line-height:1.6;
        }
        .kh-rec.kh-best{border-color:#c99a3f;background:#f6ead0;}
        .kh-rec .kh-tag{
          float:right;font-size:11px;font-weight:800;color:#8a6414;
          border:1px solid #c99a3f;border-radius:999px;padding:2px 9px;background:#fffdf7;
        }
        .kh-deg{font-size:11px;color:#a29681;display:block;margin-top:2px;}
        .kh-drop-label{font-size:17px;font-weight:800;color:#17614e;text-align:center;margin-top:2px;}
      </style>

      <div class="card">
        <div class="kh-step"><span class="kh-step-no">1</span><h2 style="margin:0">这首歌原调是什么？</h2></div>
        <select id="kh-orig"></select>
      </div>

      <div class="card">
        <div class="kh-step"><span class="kh-step-no">2</span><h2 style="margin:0">唱着费劲吗？</h2></div>
        <input type="range" id="kh-drop" min="0" max="7" step="1" value="${drop}">
        <div class="kh-drop-label" id="kh-drop-label"></div>
      </div>

      <div class="card">
        <div class="kh-step"><span class="kh-step-no">3</span><h2 style="margin:0">你顺手的指法调（多选）</h2></div>
        <div class="chip-row" id="kh-favs">
          ${SHAPE_KEYS.map((k) => `<span class="chip ${favs.includes(k) ? 'active' : ''}" data-k="${k}">${k} 调指法</span>`).join('')}
        </div>
      </div>

      <div id="kh-out"></div>

      <div class="card">
        <h2>为什么降了调还要夹变调夹？</h2>
        <div style="font-size:13.5px;line-height:1.9;color:#6d6455">
          降调只是确定「你实际要唱多高」。但如果直接用目标调的原位和弦按，
          往往会遇到一堆横按。变调夹的意义是：<b style="color:#2e2a22">让你继续用熟悉的开放指法的手型，
          而发出的音高整体抬高到目标调</b>。手不变，音对了，两全其美。
        </div>
      </div>
    `;

    const origSel = el.querySelector('#kh-orig');
    Theory.MAJOR_KEYS.forEach((k) => origSel.add(new Option(k + ' 调', k)));
    origSel.value = origKey;

    function update() {
      origKey = origSel.value;
      drop = +el.querySelector('#kh-drop').value;
      Store.setJSON('key_helper_v1', { origKey, drop, favs });

      el.querySelector('#kh-drop-label').textContent =
        drop === 0 ? '不降，正好 😌' : `降 ${drop} 个半音 ${drop >= 5 ? '😰 原调真高' : drop >= 3 ? '😅 有点够不着' : '🙂 稍微松一点'}`;

      const targetIdx = Theory.idx(origKey) - drop;
      const target = keyName(targetIdx);

      // 计算推荐
      const recs = favs.map((k) => ({ key: k, capo: Theory.keyDistance(k, target) }))
        .sort((a, b) => (a.capo - b.capo) || (RANK[a.key] - RANK[b.key]));
      const ok = recs.filter((r) => r.capo <= 5);
      const best = ok[0] || null;

      let html = '<div class="card"><h2>推荐方案</h2>';
      if (!favs.length) {
        html += '<p class="hint" style="margin-top:0">先在第 ③ 步选几个顺手的指法调</p>';
      } else if (!ok.length) {
        html += `<p class="hint" style="margin-top:0">你选的指法调都要夹 5 品以上，建议多勾一个指法调试试</p>`;
      }
      recs.forEach((r) => {
        if (r.capo > 5) return;
        const isBest = best && r.key === best.key && r.capo === best.capo;
        html += `<div class="kh-rec ${isBest ? 'kh-best' : ''}">
          ${isBest ? '<span class="kh-tag">最省力</span>' : ''}
          ${r.capo === 0 ? '不用变调夹' : `夹 <b>${r.capo}</b> 品`} · 用 <b>${r.key}</b> 调指法 · 实际唱 <b>${target}</b> 调
        </div>`;
      });
      if (best) {
        html += `<div class="result-box mt12">
          这首歌原调 <b>${origKey}</b>${drop === 0 ? '，不降调' : `，降 <b>${drop}</b> 个半音后是 <b>${target}</b> 调`}。
          ${best.capo === 0
            ? `直接用 <b>${best.key}</b> 调指法弹就行，连变调夹都省了。`
            : `变调夹夹 <b>${best.capo}</b> 品，用你最顺手的 <b>${best.key}</b> 调指法，唱出来正好是 <b>${target}</b> 调。`}
        </div>`;
      }
      html += '</div>';

      // 目标调顺阶和弦
      const degs = Theory.degreeChords(target);
      html += `<div class="card">
        <h2>${target} 调顺阶和弦（参考）</h2>
        <div class="row wrap center" style="justify-content:center">
          ${degs.map((d) => `<span style="display:inline-block;text-align:center;margin:3px">
            <span class="chord-token" data-c="${d.chord}" style="display:block">${d.chord}</span>
            <span class="kh-deg">${d.numeral}</span></span>`).join('')}
        </div>
        <p class="hint">点击可试听</p>
      </div>`;

      el.querySelector('#kh-out').innerHTML = html;
      el.querySelectorAll('#kh-out .chord-token').forEach((tk) => {
        tk.addEventListener('click', () => playChord(tk.dataset.c));
      });
    }

    origSel.addEventListener('change', update);
    el.querySelector('#kh-drop').addEventListener('input', update);
    el.querySelector('#kh-favs').addEventListener('click', (e) => {
      const c = e.target.closest('.chip'); if (!c) return;
      const k = c.dataset.k;
      if (favs.includes(k)) favs = favs.filter((x) => x !== k);
      else favs.push(k);
      c.classList.toggle('active');
      update();
    });

    update();
  },

  teardown() {},
};
Tools.register(tool);
})();
