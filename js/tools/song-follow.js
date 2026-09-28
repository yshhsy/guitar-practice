/* ============================================================
 * 歌曲跟练 —— 内置经典进行，按速度滚动跟练
 * id: song-follow
 * ============================================================ */
(() => {
  let S = null;

  const SONGS = [
    {
      name: '卡农进行',
      desc: 'C 调经典卡农和声骨架，抒情扫弦入门必练',
      bpm: 80,
      sections: [
        { name: 'A 段', chords: ['C', 'G', 'Am', 'Em', 'F', 'C', 'F', 'G'] },
        { name: 'B 段', chords: ['C', 'Em', 'F', 'G', 'Am', 'G', 'F', 'G'] },
      ],
    },
    {
      name: '平凡之路',
      desc: 'Em–C–G–D 循环到底，朴树式少年感',
      bpm: 96,
      sections: [
        { name: '循环 A', chords: ['Em', 'C', 'G', 'D'] },
        { name: '循环 B', chords: ['Em', 'C', 'G', 'D', 'Em', 'C', 'D', 'D'] },
      ],
    },
    {
      name: '童年',
      desc: 'G 调民谣经典，罗大佑的口琴前奏就在这几组和弦里',
      bpm: 104,
      sections: [
        { name: '主歌', chords: ['G', 'Em', 'C', 'G', 'Am', 'D', 'G', 'D'] },
        { name: '副歌', chords: ['C', 'D', 'G', 'Em', 'Am', 'D', 'G', 'G'] },
      ],
    },
    {
      name: '小星星变奏',
      desc: 'C 调 I–IV–V 练习曲，认音认级数的最好素材',
      bpm: 88,
      sections: [
        { name: 'A 段', chords: ['C', 'F', 'C', 'G', 'C', 'F', 'C', 'G'] },
        { name: 'B 段', chords: ['C', 'Am', 'F', 'G', 'C', 'F', 'G', 'C'] },
      ],
    },
  ];

  const tool = {
    id: 'song-follow',
    name: '歌曲跟练',
    desc: '内置经典进行，按速度滚动跟练',
    icon: '🎤',
    cat: '练习与训练',

    render(el, api) {
      const { AudioEngine, ChordLib, Diagram } = api;

      S = {
        view: 'list', song: null, items: [], stepMap: [],
        offset: 0, lastUi: 0, playing: false, sched: null,
        bpm: 90, clickOn: true, soundOn: true, lastPos: -1,
      };

      const voicingOf = (name) => {
        const v = ChordLib.getVoicings(name);
        return v.length ? v[0] : null;
      };
      const freqsOf = (name) => {
        const v = voicingOf(name);
        return v ? ChordLib.chordFreqs(v.frets) : [];
      };
      const preview = (name) => { AudioEngine.strum(freqsOf(name), { gain: 0.6 }); };

      function buildItems(song) {
        const items = [];
        song.sections.forEach((sec, si) => {
          sec.chords.forEach((c, ci) => {
            items.push({ c, beats: 4, sec: si, secName: sec.name, ci });
          });
        });
        // 步进映射表
        const stepMap = [];
        items.forEach((it, idx) => {
          for (let b = 0; b < it.beats; b++) stepMap.push(idx);
        });
        S.items = items;
        S.stepMap = stepMap;
      }

      function sectionStarts() {
        const map = [];
        S.items.forEach((it, i) => {
          if (it.ci === 0) map.push({ sec: it.sec, step: it.start });
        });
        return map;
      }

      /* ================= 列表页 ================= */
      function drawList() {
        S.view = 'list';
        if (S.sched) { try { S.sched.stop(); } catch (e) {} S.sched = null; S.playing = false; }
        el.innerHTML = `
          <style>
            .sfl-song { padding: 15px 16px; }
            .sfl-song .sfl-nm { font-size: 16.5px; font-weight: 800; }
            .sfl-song .sfl-ds { font-size: 12px; color: #64707c; margin-top: 4px; line-height: 1.6; }
            .sfl-song .sfl-meta { font-size: 11px; color: #9aa5b0; margin-top: 8px; letter-spacing: .5px; }
            .sfl-song .sfl-go { position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
              font-size: 20px; color: #f0a22e; }
          </style>
          <div data-list></div>
        `;
        const list = el.querySelector('[data-list]');
        SONGS.forEach((song) => {
          const card = document.createElement('div');
          card.className = 'card sfl-song';
          card.style.position = 'relative';
          card.style.cursor = 'pointer';
          card.innerHTML = `
            <div class="sfl-nm">🎤 ${song.name}</div>
            <div class="sfl-ds">${song.desc}</div>
            <div class="sfl-meta">建议 ${song.bpm} BPM · ${song.sections.reduce((n, s) => n + s.chords.length, 0)} 个和弦 · ${song.sections.length} 段</div>
            <span class="sfl-go">›</span>
          `;
          card.addEventListener('click', () => openSong(song));
          list.appendChild(card);
        });
        const hint = document.createElement('p');
        hint.className = 'hint';
        hint.textContent = '选一首，跟着节拍器把进行弹顺';
        list.appendChild(hint);
      }

      /* ================= 跟练页 ================= */
      function openSong(song) {
        S.view = 'practice';
        S.song = song;
        S.bpm = song.bpm;
        S.offset = 0; S.lastUi = 0; S.lastPos = -1; S.playing = false;
        buildItems(song);
        // 记录每个 item 的起始步
        let acc = 0;
        S.items.forEach((it) => { it.start = acc; acc += it.beats; });

        el.innerHTML = `
          <style>
            .sfl-back { margin-bottom: 10px; }
            .sfl-timeline { overflow-x: auto; white-space: nowrap; padding: 4px 2px 6px; margin: 0 -2px; }
            .sfl-timeline .chip { display: inline-block; margin: 3px 3px; font-size: 13px; }
            .sfl-sec-mark { font-size: 11px; color: #f0a22e; font-weight: 700; margin: 0 6px 0 2px; letter-spacing: 1px; }
            .sfl-cur { font-size: 54px; font-weight: 800; color: #0fa873; line-height: 1.1; }
            .sfl-vlabel { font-size: 11px; color: #9aa5b0; margin-top: 4px; letter-spacing: 1px; }
            .sfl-meta { font-size: 12px; color: #9aa5b0; margin-top: 8px; }
            .sfl-status { font-size: 13px; color: #64707c; font-weight: 600; }
          </style>
          <div class="sfl-back"><button class="btn-mini" data-back>← 换一首</button></div>

          <div class="card">
            <div class="row between">
              <div>
                <div style="font-size:17px;font-weight:800">🎤 ${song.name}</div>
                <div class="sfl-meta" data-songmeta></div>
              </div>
              <div style="width:96px">
                <div class="field-label">BPM</div>
                <input type="number" min="50" max="180" value="${song.bpm}" data-bpm>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="sfl-timeline" data-timeline></div>
          </div>

          <div class="card center">
            <div class="sfl-cur" data-cur>—</div>
            <div class="sfl-vlabel" data-vlabel></div>
            <div class="mt8" data-diagram></div>
            <div class="row mt12" style="justify-content:center;gap:10px" data-dots></div>
            <div class="sfl-meta" data-progress></div>
          </div>

          <button class="btn-primary" data-toggle>▶ 开始跟练</button>
          <div class="grid2 mt12">
            <button class="btn-ghost" data-prevsec>⏮ 上一节</button>
            <button class="btn-ghost" data-restart>↩ 重来</button>
          </div>
          <div class="row mt12" style="gap:8px;justify-content:center">
            <button class="btn-mini on" data-click>🥁 节拍</button>
            <button class="btn-mini on" data-sound>🎸 和弦音</button>
          </div>
          <p class="hint">点时间线上的任意和弦可试听</p>
        `;

        const $ = (sel) => el.querySelector(sel);
        const timeline = $('[data-timeline]');

        // 时间线
        let lastSec = -1;
        S.items.forEach((it, idx) => {
          if (it.sec !== lastSec) {
            const m = document.createElement('span');
            m.className = 'sfl-sec-mark';
            m.textContent = '◆ ' + it.secName;
            timeline.appendChild(m);
            lastSec = it.sec;
          }
          const c = document.createElement('button');
          c.className = 'chip';
          c.dataset.idx = idx;
          c.textContent = it.c;
          c.addEventListener('click', () => preview(it.c));
          timeline.appendChild(c);
        });

        $('[data-songmeta]').textContent = song.desc;

        $('[data-back]').addEventListener('click', drawList);

        $('[data-bpm]').addEventListener('change', (e) => {
          S.bpm = Math.min(180, Math.max(50, +e.target.value || song.bpm));
          e.target.value = S.bpm;
          if (S.sched) S.sched.setBpm(S.bpm);
        });

        $('[data-toggle]').addEventListener('click', (e) => {
          S.playing ? stop() : start();
          e.currentTarget.textContent = S.playing ? '⏸ 暂停' : '▶ 开始跟练';
        });

        $('[data-restart]').addEventListener('click', () => {
          jumpTo(0);
        });

        $('[data-prevsec]').addEventListener('click', () => {
          const pos = curPos();
          const starts = sectionStarts();
          // 当前 pos 所在小节起点；若正好在小节头，退到上一小节
          let target = 0;
          for (let i = starts.length - 1; i >= 0; i--) {
            if (starts[i].step < pos) { target = starts[i].step; break; }
          }
          jumpTo(target);
        });

        $('[data-click]').addEventListener('click', (e) => {
          S.clickOn = !S.clickOn;
          e.currentTarget.classList.toggle('on', S.clickOn);
        });
        $('[data-sound]').addEventListener('click', (e) => {
          S.soundOn = !S.soundOn;
          e.currentTarget.classList.toggle('on', S.soundOn);
          if (S.soundOn && !S.playing) {
            const pos = curPos();
            preview(S.items[S.stepMap[pos]].c);
          }
        });

        drawAt(0);
      }

      const T = () => S.stepMap.length;
      function curPos() { return S.lastPos < 0 ? 0 : S.lastPos; }

      function drawAt(pos) {
        pos = ((pos % T()) + T()) % T();
        S.lastPos = pos;
        const idx = S.stepMap[pos];
        const it = S.items[idx];
        const v = voicingOf(it.c);
        const curEl = el.querySelector('[data-cur]');
        if (curEl.textContent !== it.c) curEl.textContent = it.c;
        el.querySelector('[data-vlabel]').textContent = v ? v.label : '（暂无指法）';
        el.querySelector('[data-diagram]').innerHTML = v
          ? Diagram.chord(v.frets, { fingers: v.fingers, barre: v.barre, baseFret: v.baseFret, size: 158 })
          : '<span style="color:#9aa5b0;font-size:12px">该和弦暂无图示</span>';
        // 拍点
        const beatIn = pos - it.start;
        const dots = el.querySelector('[data-dots]');
        dots.innerHTML = '';
        for (let b = 0; b < it.beats; b++) {
          const d = document.createElement('div');
          d.className = 'beat-dot' + (b === beatIn ? ' on' : '') + (b === 0 ? ' first' : '');
          dots.appendChild(d);
        }
        el.querySelector('[data-progress]').textContent =
          `${it.secName} · 第 ${idx + 1} / ${S.items.length} 个和弦 · 第 ${Math.floor(pos / T()) + 1} 遍`;
        // 时间线高亮 + 滚动
        const chips = el.querySelectorAll('[data-timeline] .chip');
        chips.forEach((c) => c.classList.toggle('active', +c.dataset.idx === idx));
        const cur = chips[idx];
        if (cur && cur.scrollIntoView) {
          try { cur.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); } catch (e) {}
        }
      }

      function jumpTo(step) {
        // 位置 = step + offset。整体平移 offset，让 onStep / onUiStep 同时跳到目标位置
        const pos = curPos();
        S.offset += (step - pos);
        drawAt(step);
      }

      function start() {
        if (S.sched) { try { S.sched.stop(); } catch (e) {} }
        S.playing = true;
        S.lastUi = 0;
        const sched = new AudioEngine.Scheduler({
          bpm: S.bpm, stepsPerBeat: 1,
          onStep(step, time) {
            const pos = ((step + S.offset) % T() + T()) % T();
            const off = Math.max(0, time - AudioEngine.now());
            const idx = S.stepMap[pos];
            const it = S.items[idx];
            if (S.clickOn) AudioEngine.click(off, pos === it.start);
            if (pos === it.start && S.soundOn) {
              AudioEngine.strum(ChordLib.chordFreqs(voicingOf(it.c) ? voicingOf(it.c).frets : []), { when: off, gain: 0.5 });
            }
          },
        });
        sched.onUiStep = (u) => {
          const pos = ((u + S.offset) % T() + T()) % T();
          S.lastUi = u;
          drawAt(pos);
        };
        S.sched = sched;
        sched.start();
        drawAt(curPos());
      }

      function stop() {
        S.playing = false;
        if (S.sched) { try { S.sched.stop(); } catch (e) {} }
        // 暂停时把 uiStep 折进 offset，恢复后位置连续
        S.offset += S.lastUi;
        S.lastUi = 0;
        const btn = el.querySelector('[data-toggle]');
        if (btn) btn.textContent = '▶ 开始跟练';
      }

      drawList();
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
