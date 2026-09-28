/* ============================================================
 * 自制吉他谱 —— ChordPro 风格，随编随练
 * id: my-tabs
 * ============================================================ */
(() => {
  let S = null;

  const SAMPLE = {
    id: 'sample-star',
    title: '小星星（示例）',
    body: '[C]一闪一闪 [F]亮晶晶\n[C]满天都是 [G]小星星\n[C]挂在天上 [F]放光明\n[C]好像许多 [G]小眼睛\n[C]一闪一闪 [F]亮晶晶\n[C]满天都是 [G]小星[C]星',
    updated: Date.now(),
  };

  const fmtTime = (t) => {
    const d = new Date(t);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  // 一行歌词拆成 {chord, text} 段序列
  function parseLine(line) {
    const parts = line.split(/(\[[^\]]*\])/);
    const segs = [];
    let cur = { chord: null, text: '' };
    for (const p of parts) {
      if (!p) continue;
      const m = p.match(/^\[([^\]]*)\]$/);
      if (m) {
        if (cur.chord !== null || cur.text) segs.push(cur);
        cur = { chord: m[1], text: '' };
      } else {
        cur.text += p;
      }
    }
    if (cur.chord !== null || cur.text) segs.push(cur);
    return segs;
  }

  function lineInfo(line) {
    const chords = [];
    const segs = parseLine(line);
    segs.forEach((s) => { if (s.chord && !chords.includes(s.chord)) chords.push(s.chord); });
    return { segs, chords };
  }

  function sheetInfo(body) {
    const lines = body.split('\n').filter((l) => l.trim());
    const uniq = [];
    lines.forEach((l) => {
      lineInfo(l).chords.forEach((c) => { if (!uniq.includes(c)) uniq.push(c); });
    });
    return { lineCount: lines.length, chords: uniq };
  }

  const tool = {
    id: 'my-tabs',
    name: '自制吉他谱',
    desc: '做自己的吉他谱，随编随练',
    icon: '📝',
    cat: '指板与曲谱',

    render(el, api) {
      const { Store, Theory, ChordLib, AudioEngine } = api;

      // 首次使用：写入示例谱
      if (!Store.getJSON('tabs', null)) Store.setJSON('tabs', [SAMPLE]);

      S = { view: 'list', editing: null, timer: null, playing: false, gap: 1.2 };

      const load = () => Store.getJSON('tabs', []) || [];
      const save = (list) => Store.setJSON('tabs', list);

      const validChord = (c) => { const p = Theory.parseChord(c); return !!(p && p.valid); };
      const voicingOf = (c) => {
        const v = ChordLib.getVoicings(c);
        return v.length ? v[0] : null;
      };
      const strumChord = (c) => {
        const v = voicingOf(c);
        if (v) AudioEngine.strum(ChordLib.chordFreqs(v.frets), { gain: 0.62 });
      };

      /* ================= 列表页 ================= */
      function drawList() {
        stopPlay();
        S.view = 'list';
        const tabs = load();
        let html = `
          <style>
            .mtx-card { cursor: pointer; }
            .mtx-card .mtx-title { font-size: 16px; font-weight: 800; }
            .mtx-card .mtx-meta { font-size: 11.5px; color: #a29681; margin-top: 5px; }
            .mtx-empty { text-align: center; padding: 30px 0 22px; }
            .mtx-empty .mtx-emoji { font-size: 46px; }
            .mtx-empty .mtx-t { font-size: 15.5px; font-weight: 800; margin-top: 10px; color: #2e2a22; }
          </style>
        `;
        if (!tabs.length) {
          html += `
            <div class="card">
              <div class="mtx-empty">
                <div class="mtx-emoji">📝</div>
                <div class="mtx-t">还没有自制谱</div>
                <p class="hint">点下方「＋ 新建吉他谱」<br>用 [C] 和弦标记，把喜欢的歌词变成可跟弹的谱</p>
              </div>
            </div>
            <button class="btn-primary" data-new>＋ 新建吉他谱</button>
          `;
        } else {
          html += `<div data-cards></div><button class="btn-primary" data-new>＋ 新建吉他谱</button>`;
        }
        el.innerHTML = html;

        const box = el.querySelector('[data-cards]');
        if (box) {
          tabs.forEach((t) => {
            const info = sheetInfo(t.body);
            const card = document.createElement('div');
            card.className = 'card mtx-card';
            card.innerHTML = `
              <div class="row between" style="align-items:flex-start">
                <div>
                  <div class="mtx-title">${escapeHtml(t.title || '未命名')}</div>
                  <div class="mtx-meta">更新于 ${fmtTime(t.updated)} · ${info.lineCount} 行 · ${info.chords.length} 个和弦</div>
                </div>
                <div class="row" style="gap:6px;flex:none">
                  <button class="btn-mini" data-edit="${t.id}">编辑</button>
                  <button class="btn-mini" data-del="${t.id}">删除</button>
                </div>
              </div>
            `;
            card.addEventListener('click', (e) => {
              if (e.target.closest('button')) return;
              openView(t.id);
            });
            box.appendChild(card);
          });
          const hint = document.createElement('p');
          hint.className = 'hint';
          hint.textContent = `共 ${tabs.length} 份谱 · 点卡片进入查看`;
          box.appendChild(hint);
        }

        const newBtn = el.querySelector('[data-new]');
        if (newBtn) newBtn.addEventListener('click', () => openEdit(null));

        el.querySelectorAll('[data-edit]').forEach((b) =>
          b.addEventListener('click', (e) => { e.stopPropagation(); openEdit(b.dataset.edit); }));
        el.querySelectorAll('[data-del]').forEach((b) =>
          b.addEventListener('click', (e) => {
            e.stopPropagation();
            const t = load().find((x) => x.id === b.dataset.del);
            if (confirm(`确定删除「${(t && t.title) || '未命名'}」吗？删除后无法恢复。`)) {
              save(load().filter((x) => x.id !== b.dataset.del));
              drawList();
            }
          }));
      }

      function escapeHtml(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }

      /* ================= 编辑页 ================= */
      function openEdit(id) {
        stopPlay();
        S.view = 'edit';
        S.editing = id;
        const t = id ? load().find((x) => x.id === id) : null;
        el.innerHTML = `
          <div style="margin-bottom:10px"><button class="btn-mini" data-back>← 返回</button></div>
          <div class="card">
            <div class="field-label">标题</div>
            <input type="text" data-title placeholder="给这份谱起个名字" value="${escapeHtml(t ? t.title : '')}">
            <div class="field-label mt12">谱子内容（ChordPro 格式）</div>
            <textarea data-body rows="12" placeholder="[C]在这里写下歌词与和弦…"></textarea>
            <p class="hint" style="text-align:left;margin-top:10px">
              💡 在歌词里用方括号标记和弦，和文字的位置就是它的落点，例如：<br>
              <b style="color:#17614e">[C]一闪一闪 [F]亮晶晶</b><br>
              保存后查看时会自动把和弦对齐到歌词上方。
            </p>
          </div>
          <button class="btn-primary" data-save>💾 保存</button>
        `;
        el.querySelector('[data-back]').addEventListener('click', drawList);
        const bodyEl = el.querySelector('[data-body]');
        bodyEl.value = t ? t.body : '[C]在这里写第一句\n[F]和弦会显示在文字上方\n[G]换行自动分段\n[C]就这样写完一整首';
        el.querySelector('[data-save]').addEventListener('click', () => {
          const title = el.querySelector('[data-title]').value.trim() || '未命名';
          const body = bodyEl.value;
          const list = load();
          if (S.editing) {
            const i = list.findIndex((x) => x.id === S.editing);
            if (i >= 0) { list[i].title = title; list[i].body = body; list[i].updated = Date.now(); }
          } else {
            list.push({ id: 'tab-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), title, body, updated: Date.now() });
          }
          save(list);
          openView(S.editing || list[list.length - 1].id);
        });
      }

      /* ================= 查看页 ================= */
      function openView(id) {
        stopPlay();
        S.view = 'view';
        const t = load().find((x) => x.id === id);
        if (!t) { drawList(); return; }
        const info = sheetInfo(t.body);

        el.innerHTML = `
          <style>
            .mtx-sheet { font-family: 'SF Mono', Menlo, Consolas, monospace; font-size: 13.5px; line-height: 2.05; color: #2e2a22; }
            .mtx-line { margin-top: 10px; min-height: 1.6em; }
            .mtx-line.first { margin-top: 2px; }
            .mtx-line.has-chord { margin-top: 20px; }
            .mtx-seg { position: relative; display: inline-block; white-space: pre-wrap; }
            .mtx-chord { position: absolute; top: -1.42em; left: 0; font-style: normal;
              color: #17614e; font-weight: 700; font-size: 12.5px; letter-spacing: .5px; white-space: nowrap; }
            .mtx-chord.bad { color: #b4503c; }
            .mtx-token { transition: all .12s; }
            .mtx-token.cur { background: #17614e; border-color: #17614e; color: #fff; }
            .mtx-token.bad { color: #b4503c; border-color: #e3c3b8; background: #f3e0da; }
          </style>
          <div class="row between" style="margin-bottom:10px">
            <button class="btn-mini" data-back>← 返回列表</button>
            <button class="btn-mini" data-edit>✏️ 编辑</button>
          </div>
          <div class="card center">
            <div style="font-size:19px;font-weight:800">📝 ${escapeHtml(t.title)}</div>
            <div class="hint" style="margin-top:5px">${info.lineCount} 行 · ${info.chords.length} 个和弦 · 更新于 ${fmtTime(t.updated)}</div>
          </div>
          <div class="card">
            <div class="row between wrap" style="gap:8px">
              <button class="btn-mini on" data-play>▶ 播放和弦</button>
              <div class="row" style="gap:6px;flex:1;max-width:190px">
                <span style="font-size:12px;color:#6d6455;white-space:nowrap">间隔</span>
                <input type="range" min="5" max="30" step="1" value="12" data-speed>
              </div>
            </div>
            <div class="chip-row mt12" data-tokens></div>
          </div>
          <div class="card"><div class="mtx-sheet" data-sheet></div></div>
          <p class="hint">播放会按出现顺序示范谱中的每个和弦（去重）</p>
        `;

        // 和弦 token 条
        const tokensEl = el.querySelector('[data-tokens]');
        info.chords.forEach((c) => {
          const sp = document.createElement('span');
          const ok = validChord(c);
          sp.className = 'chord-token mtx-token' + (ok ? '' : ' bad');
          sp.textContent = c;
          sp.title = ok ? '点击试听' : '无法识别的和弦标记';
          if (ok) sp.addEventListener('click', () => strumChord(c));
          tokensEl.appendChild(sp);
        });

        // 歌词谱面
        const sheetEl = el.querySelector('[data-sheet]');
        t.body.split('\n').forEach((line) => {
          const lineEl = document.createElement('div');
          if (!line.trim()) { lineEl.className = 'mtx-line'; lineEl.innerHTML = '&nbsp;'; sheetEl.appendChild(lineEl); return; }
          const { segs } = lineInfo(line);
          const hasChord = segs.some((s) => s.chord !== null && s.chord !== '');
          lineEl.className = 'mtx-line' + (hasChord ? ' has-chord' : '');
          segs.forEach((s) => {
            const seg = document.createElement('span');
            seg.className = 'mtx-seg';
            if (s.chord !== null && s.chord !== '') {
              const c = document.createElement('i');
              c.className = 'mtx-chord' + (validChord(s.chord) ? '' : ' bad');
              c.textContent = s.chord;
              seg.appendChild(c);
            }
            seg.appendChild(document.createTextNode(s.text || '\u00a0'));
            lineEl.appendChild(seg);
          });
          sheetEl.appendChild(lineEl);
        });

        el.querySelector('[data-back]').addEventListener('click', drawList);
        el.querySelector('[data-edit]').addEventListener('click', () => openEdit(t.id));
        el.querySelector('[data-speed]').addEventListener('input', (e) => {
          S.gap = +e.target.value / 10;
        });
        el.querySelector('[data-play]').addEventListener('click', (e) => {
          if (S.playing) { stopPlay(); return; }
          const playables = info.chords.filter(validChord);
          if (!playables.length) return;
          S.playing = true;
          e.currentTarget.classList.remove('on');
          e.currentTarget.textContent = '⏹ 停止播放';
          const tokens = [...tokensEl.children];
          let i = 0;
          const step = () => {
            if (!S.playing) return;
            tokens.forEach((tk) => tk.classList.remove('cur'));
            const name = playables[i];
            strumChord(name);
            const ti = tokens.find((tk) => tk.textContent === name);
            if (ti) { ti.classList.add('cur'); ti.scrollIntoView && ti.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
            i = (i + 1) % playables.length;
            S.timer = setTimeout(step, S.gap * 1000);
          };
          step();
        });
      }

      function stopPlay() {
        S.playing = false;
        if (S.timer) { clearTimeout(S.timer); S.timer = null; }
      }

      drawList();
    },

    teardown() {
      if (S) {
        if (S.timer) clearTimeout(S.timer);
        S = null;
      }
    },
  };

  Tools.register(tool);
})();
