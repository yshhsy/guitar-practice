/* ============================================================
 * 练耳训练 —— 听音程 / 听和弦性质 / 听音级
 * id: ear
 * ============================================================ */
(() => {
  let S = null;

  // 12 个音程（按半音数排列）
  const INTERVALS = [
    { n: '小二度', s: 1 }, { n: '大二度', s: 2 }, { n: '小三度', s: 3 }, { n: '大三度', s: 4 },
    { n: '纯四度', s: 5 }, { n: '三全音', s: 6 }, { n: '纯五度', s: 7 }, { n: '小六度', s: 8 },
    { n: '大六度', s: 9 }, { n: '小七度', s: 10 }, { n: '大七度', s: 11 }, { n: '纯八度', s: 12 },
  ];
  const DIFFS = {
    easy: ['大二度', '大三度', '纯四度', '纯五度', '大六度', '纯八度'],
    mid: ['大二度', '小三度', '大三度', '纯四度', '纯五度', '大六度', '小七度', '纯八度'],
    hard: INTERVALS.map((i) => i.n),
  };
  const SOLFEGE = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si'];
  const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11]; // C 大调 1-7 级

  const tool = {
    id: 'ear',
    name: '练耳训练',
    desc: '听音程、听和弦、听音级，边听边答',
    icon: '👂',
    cat: '练习与训练',

    render(el, api) {
      const { AudioEngine, Theory } = api;

      S = {
        mode: 'interval', diff: 'easy',
        q: null, answered: false,
        correct: 0, total: 0, streak: 0,
        nextTimer: null,
      };

      el.innerHTML = `
        <style>
          .ear-opts { display: grid; gap: 8px; margin-top: 14px; }
          .ear-opt { padding: 12px 6px; border: 1px solid #e3d8bf; border-radius: 12px;
            background: #fffdf7; color: #2e2a22; font-size: 14px; cursor: pointer; transition: all .1s; }
          .ear-opt:active { background: #ece4d2; }
          .ear-opt .ear-num { font-size: 20px; font-weight: 800; color: #17614e; }
          .ear-opt .ear-sub { font-size: 11px; color: #a29681; margin-left: 5px; }
          .ear-opts.locked .ear-opt { pointer-events: none; opacity: .82; }
          .ear-opt.right { background: #17614e !important; border-color: #17614e; color: #f3efe4; }
          .ear-opt.right .ear-num, .ear-opt.wrong .ear-sub { color: #f3efe4; }
          .ear-opt.wrong { background: #b4503c !important; border-color: #b4503c; color: #fff; }
          .ear-score { font-size: 12.5px; color: #6d6455; }
          .ear-score b { color: #17614e; font-size: 15px; font-variant-numeric: tabular-nums; }
          .ear-q { font-size: 16px; font-weight: 700; color: #2e2a22; margin-top: 4px; }
          .ear-ok { color: #17614e; font-weight: 700; }
          .ear-no { color: #b4503c; font-weight: 700; }
        </style>

        <div class="card">
          <div class="seg" data-mode>
            <button class="active" data-m="interval">音程</button>
            <button data-m="chord">和弦性质</button>
            <button data-m="degree">音级</button>
          </div>
          <div class="mt12" data-diffbox>
            <div class="field-label">音程难度</div>
            <div class="chip-row" data-diff>
              <button class="chip active" data-d="easy">简单</button>
              <button class="chip" data-d="mid">进阶</button>
              <button class="chip" data-d="hard">挑战</button>
            </div>
          </div>
        </div>

        <div class="card center">
          <div class="row between wrap" style="gap:8px">
            <span class="ear-score">✅ 对 <b data-ok>0</b> / 共 <b data-all>0</b></span>
            <span class="ear-score">正确率 <b data-acc>—</b></span>
            <span class="ear-score">🔥 连对 <b data-streak>0</b></span>
          </div>
          <div class="ear-q mt12" data-q>🎧 仔细听……</div>
          <p class="hint" data-qsub style="margin-top:4px">先听清再作答</p>
          <button class="btn-ghost mt12" data-replay>🔊 再听一遍</button>
          <div class="ear-opts" data-opts></div>
          <div class="result-box mt12" data-result style="display:none"></div>
        </div>
      `;

      const $ = (sel) => el.querySelector(sel);
      const optsEl = $('[data-opts]'), resultEl = $('[data-result]'),
            qEl = $('[data-q]'), qsubEl = $('[data-qsub]'),
            diffBox = $('[data-diffbox]');

      function rnd(n) { return Math.floor(Math.random() * n); }
      function updateScore() {
        $('[data-ok]').textContent = S.correct;
        $('[data-all]').textContent = S.total;
        $('[data-acc]').textContent = S.total ? Math.round((S.correct / S.total) * 100) + '%' : '—';
        $('[data-streak]').textContent = S.streak;
      }

      function clearNext() {
        if (S.nextTimer) { clearTimeout(S.nextTimer); S.nextTimer = null; }
      }

      /* ---------------- 出题 ---------------- */
      function newQ() {
        clearNext();
        S.answered = false;
        resultEl.style.display = 'none';
        optsEl.classList.remove('locked');
        optsEl.innerHTML = '';

        if (S.mode === 'interval') {
          const rootIdx = rnd(12);                      // C3 – B3
          const pool = DIFFS[S.diff];
          const itvName = pool[rnd(pool.length)];       // 先抽定音程名，再查找
          const itv = INTERVALS.find((i) => i.n === itvName);
          const rootF = Theory.freqOf(rootIdx, 3);
          const targetF = Theory.freqOf(rootIdx + itv.s, 3);
          S.q = {
            key: 'interval', itv,
            play() {
              AudioEngine.pluck(rootF, 0, 0.75);
              AudioEngine.pluck(targetF, 0.95, 0.75);
              AudioEngine.pluck(rootF, 2.1, 0.62);      // 同时弹
              AudioEngine.pluck(targetF, 2.1, 0.62);
            },
            explain() {
              return `这是<b>${itv.n}</b>，相距 <b>${itv.s} 个半音</b>（${Theory.name(rootIdx)} → ${Theory.name(rootIdx + itv.s)}）`;
            },
            options: pool,
            answer: itv.n,
          };
          qEl.textContent = '🎧 听两个音的音程';
          qsubEl.textContent = '先分开听，再同时听';
        } else if (S.mode === 'chord') {
          const quals = [
            { q: '', cn: '大三', iv: [0, 4, 7], tip: '大三和弦：根音 + 大三度 + 纯五度，色彩明亮开朗' },
            { q: 'm', cn: '小三', iv: [0, 3, 7], tip: '小三和弦：根音 + 小三度 + 纯五度，色彩柔和忧郁' },
            { q: '7', cn: '属七', iv: [0, 4, 7, 10], tip: '属七和弦：大三和弦再叠一个小七度，紧张、想要解决' },
          ];
          const rootIdx = rnd(12);
          const pick = quals[rnd(quals.length)];
          const freqs = pick.iv.map((iv) => Theory.freqOf(rootIdx + iv, 3));
          S.q = {
            key: 'chord', pick,
            play() {
              freqs.forEach((f, i) => AudioEngine.pluck(f, i * 0.05, 0.55));   // 分解
              freqs.forEach((f) => AudioEngine.pluck(f, 1.15, 0.5));          // 齐奏
            },
            explain() {
              return `这是<b>${pick.tip}</b>，根音是 ${Theory.name(rootIdx)}`;
            },
            options: quals.map((x) => x.cn),
            answer: pick.cn,
          };
          qEl.textContent = '🎧 听这个和弦的性质';
          qsubEl.textContent = '先分解再齐奏';
        } else {
          const deg = 1 + rnd(7);                       // 1-7 级
          const rootF = Theory.freqOf(0, 4);            // C4 定位
          const targetF = Theory.freqOf(MAJOR_STEPS[deg - 1], 4);
          S.q = {
            key: 'degree', deg,
            play() {
              AudioEngine.pluck(rootF, 0, 0.7);
              AudioEngine.pluck(targetF, 0.95, 0.75);
              AudioEngine.pluck(rootF, 2.0, 0.6);       // 再用主音对比一次
              AudioEngine.pluck(targetF, 2.6, 0.7);
            },
            explain() {
              const nm = Theory.name(MAJOR_STEPS[deg - 1]);
              return `这是 C 大调的第 <b>${deg}</b> 级音 <b>${nm}</b>（${SOLFEGE[deg - 1]}），先在心里默唱 do 再对比`;
            },
            options: [1, 2, 3, 4, 5, 6, 7],
            answer: deg,
          };
          qEl.textContent = '🎧 先给主音 do，再听目标音级';
          qsubEl.textContent = '用简谱数字作答';
        }

        // 渲染选项按钮
        const cols = S.q.options.length > 6 ? 4 : (S.q.options.length >= 6 ? 3 : S.q.options.length);
        optsEl.style.gridTemplateColumns = `repeat(${cols},1fr)`;
        S.q.options.forEach((opt) => {
          const b = document.createElement('button');
          b.className = 'ear-opt';
          if (S.q.key === 'degree') {
            b.innerHTML = `<span class="ear-num">${opt}</span><span class="ear-sub">${SOLFEGE[opt - 1]}</span>`;
          } else {
            b.textContent = opt;
          }
          b.dataset.v = opt;
          b.addEventListener('click', () => answer(opt, b));
          optsEl.appendChild(b);
        });

        S.q.play();
      }

      /* ---------------- 作答 ---------------- */
      function answer(v, btn) {
        if (S.answered) return;
        S.answered = true;
        S.total += 1;
        const right = v === S.q.answer;
        if (right) { S.correct += 1; S.streak += 1; } else { S.streak = 0; }
        updateScore();
        optsEl.classList.add('locked');
        btn.classList.add(right ? 'right' : 'wrong');
        if (!right) {
          const good = [...optsEl.children].find((x) => String(x.dataset.v) === String(S.q.answer));
          if (good) good.classList.add('right');
        }
        resultEl.style.display = '';
        resultEl.innerHTML = (right
          ? '<span class="ear-ok">✅ 答对了！</span> '
          : '<span class="ear-no">❌ 再想想～</span> ') + S.q.explain()
          + '<br><span style="color:#a29681;font-size:12px">2 秒后自动下一题</span>';
        S.nextTimer = setTimeout(newQ, 2000);
      }

      /* ---------------- 事件 ---------------- */
      el.querySelector('[data-mode]').addEventListener('click', (e) => {
        const b = e.target.closest('[data-m]');
        if (!b) return;
        S.mode = b.dataset.m;
        el.querySelectorAll('[data-mode] button').forEach((x) => x.classList.toggle('active', x === b));
        diffBox.style.display = S.mode === 'interval' ? '' : 'none';
        newQ();
      });

      el.querySelector('[data-diff]').addEventListener('click', (e) => {
        const b = e.target.closest('[data-d]');
        if (!b) return;
        S.diff = b.dataset.d;
        el.querySelectorAll('[data-d]').forEach((x) => x.classList.toggle('active', x === b));
        newQ();
      });

      $('[data-replay]').addEventListener('click', () => { if (S.q) S.q.play(); });

      updateScore();
      newQ();
    },

    teardown() {
      if (S) {
        if (S.nextTimer) clearTimeout(S.nextTimer);
        S = null;
      }
    },
  };

  Tools.register(tool);
})();
