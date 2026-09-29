/* ============================================================
 * 课堂框架：章节注册 + 课时渲染 + 随堂测验引擎
 * 课程数据在 js/data/course-ch*.js 中通过 Course.registerChapter 注册
 * ============================================================ */
const Course = {
  chapters: [],
  registerChapter(ch) { this.chapters.push(ch); },
  all() { return this.chapters; },
  lessonById(id) {
    for (const ch of this.chapters) {
      const l = ch.lessons.find((x) => x.id === id);
      if (l) return { chapter: ch, lesson: l };
    }
    return null;
  },
  doneMap() { return Store.getJSON('course_done', {}) || {}; },
  isDone(id) { return !!this.doneMap()[id]; },
  totalLessons() { return this.chapters.reduce((s, c) => s + c.lessons.length, 0); },
  doneCount() { return Object.values(this.doneMap()).filter(Boolean).length; },
  /* 第一课未完成的课时（用于"继续学习"） */
  nextLesson() {
    const done = this.doneMap();
    for (const ch of this.chapters) {
      for (const l of ch.lessons) {
        if (!done[l.id]) return { chapter: ch, lesson: l };
      }
    }
    return null;
  },
  /* 按顺序铺平全部课时 */
  flatLessons() {
    return this.chapters.flatMap((ch) => ch.lessons.map((l) => ({ chapter: ch, lesson: l })));
  },
  /* 顺序上的下一课（不论是否已完成） */
  nextOf(id) {
    const all = this.flatLessons();
    const i = all.findIndex((x) => x.lesson.id === id);
    return i >= 0 && i < all.length - 1 ? all[i + 1] : null;
  },
};

/* ===== 学练结合：每课对应的动手工具 ===== */
const LESSON_PRACTICE = {
  c1l1: [{ t: 'chord-query', n: '随便点一个和弦听听声音，在琴上找找对应的品' }],
  c1l2: [{ t: 'chord-query', n: '用标准左手手型，试着按出一个 Em 和弦' }],
  c1l3: [{ t: 'tuner', n: '用调音器把六根弦调到标准音 EADGBE' }],
  c1l4: [{ t: 'chord-query', n: '对照和弦图按出 C 和 G，检查每根弦是否都响' }, { t: 'song-follow', n: '跟着六线谱弹一小段，体验看谱弹琴' }],
  c2l1: [{ t: 'ear', n: '听辨两个音的高低，感受半音的距离' }],
  c2l2: [{ t: 'ear', n: '做几组音程听辨，磨一磨耳朵' }, { t: 'theory-book', n: '翻翻乐理库的音程表，对照记忆' }],
  c2l3: [{ t: 'scale-trainer', n: '在指板上把 C 大调音阶弹两遍' }],
  c2l4: [{ t: 'chord-query', n: '对比 C 与 Cm 的按法和听感差别' }, { t: 'theory-book', n: '看看三和弦构成表，验证课文内容' }],
  c3l1: [{ t: 'key-helper', n: '用选调助手找几个调的关系小调' }],
  c3l2: [{ t: 'backing', n: '放一段 C 大调伴奏，感受顺阶和弦的进行' }, { t: 'chord-query', n: '把 C 大调的顺阶和弦都按一遍' }],
  c3l3: [{ t: 'chord-query', n: '对比 C、C7、Cmaj7 的听感差别' }, { t: 'chord-morph', n: '看看七和弦是怎么从三和弦衍化出来的' }],
  c3l4: [{ t: 'caged-circle', n: '转一转五度圈，找各调的近关系调' }],
  c4l1: [{ t: 'metronome', n: '开 60 BPM，跟着数拍子弹四分音符' }, { t: 'drum-machine', n: '做个 4/4 拍节奏，感受强拍与弱拍' }],
  c4l2: [{ t: 'strum-follow', n: '跟练「下-下上-上下上」节奏型' }, { t: 'strum-adv', n: '挑战进阶扫弦，稳住别抢拍' }],
  c4l3: [{ t: 'chord-morph', n: '拖动滑块，看 E 指型平移 1 品变成 F' }, { t: 'chord-switch', n: '做 F 与 C 的转换计时训练' }],
  c4l4: [{ t: 'capo-calc', n: '算一算：C 调指法夹 2 品弹出什么调' }, { t: 'transpose', n: '把一段 C 调和弦进行转成 G 调' }],
  c4l5: [{ t: 'caged-circle', n: '用五种指型把 C 和弦在指板上串一遍' }, { t: 'scale-trainer', n: '用 CAGED 把位练 C 大调音阶' }],
};

/* ===== 课堂首页：章节 + 课时列表 ===== */
function renderLearnPage(el) {
  const done = Course.doneMap();
  const total = Course.totalLessons();
  const doneCnt = Course.doneCount();
  const pct = total ? Math.round((doneCnt / total) * 100) : 0;

  el.innerHTML = `
    <div class="card course-hero">
      <div class="row between">
        <h2>学习进度</h2>
        <span class="course-progress-num">${doneCnt} / ${total} 课</span>
      </div>
      <div class="path-progress-track"><div class="path-progress-bar" style="width:${pct}%"></div></div>
      <p class="path-progress-tip">${doneCnt === 0
        ? '从「吉他基础」开始，每天一课，乐理和技巧一起长进'
        : pct === 100
          ? '全部课程学完啦！去工具页把知识用起来吧'
          : '坚持就是胜利，学完一课还有随堂测验帮你巩固'}</p>
    </div>
    ${Course.all().map((ch, ci) => {
      const chDone = ch.lessons.filter((l) => done[l.id]).length;
      return `
      <div class="card chapter-card" style="animation-delay:${ci * 60}ms">
        <div class="chapter-head">
          <div class="icon-tile small">${ch.icon}</div>
          <div class="chapter-title-box">
            <div class="chapter-title">${ch.title}</div>
            <div class="chapter-desc">${ch.desc}</div>
          </div>
          <span class="chapter-count ${chDone === ch.lessons.length ? 'full' : ''}">${chDone}/${ch.lessons.length}</span>
        </div>
        <div class="lesson-list">
          ${ch.lessons.map((l, li) => `
            <button class="lesson-row ${done[l.id] ? 'done' : ''}" data-lesson="${l.id}">
              <span class="lesson-num">${done[l.id] ? '✓' : li + 1}</span>
              <span class="lesson-name">${l.title}</span>
              <span class="lesson-mins">${l.mins} 分钟</span>
              <span class="lesson-arrow">›</span>
            </button>`).join('')}
        </div>
      </div>`;
    }).join('')}
  `;

  el.querySelectorAll('[data-lesson]').forEach((b) =>
    b.addEventListener('click', () => { location.hash = '#/lesson/' + b.dataset.lesson; })
  );
}

/* ===== 课时阅读页：正文 + 测验 + 完成打卡 ===== */
function renderLessonPage(el, id) {
  const found = Course.lessonById(id);
  if (!found) { location.hash = '#/learn'; return; }
  const { chapter, lesson } = found;
  const alreadyDone = Course.isDone(id);

  el.innerHTML = `
    <div class="tool-header">
      <button class="back-btn" id="lesson-back">‹</button>
      <div class="icon-tile tool-header-icon">${chapter.icon}</div>
      <div class="tool-header-text">
        <h1>${lesson.title}</h1>
        <p>${chapter.title} · 约 ${lesson.mins} 分钟 · ${lesson.goal}</p>
      </div>
    </div>

    <div class="card lesson-body">
      ${lesson.sections.map((s) => `
        <div class="lesson-sec">
          <h3>${s.h}</h3>
          <p>${s.p}</p>
          ${s.tip ? `<div class="lesson-tip">💡 ${s.tip}</div>` : ''}
        </div>`).join('')}
    </div>

    <div class="card quiz-card">
      <h2>📝 随堂测验 <span class="quiz-sub">答完才能打卡哦</span></h2>
      <div id="quiz-box"></div>
      <div id="quiz-result"></div>
    </div>

    ${(() => {
      const practice = (LESSON_PRACTICE[id] || []).filter((p) => Tools.get(p.t));
      if (!practice.length) return '';
      return `
      <div class="card do-card">
        <h2>🛠️ 动手练一练 <span class="quiz-sub">学完立刻用，知识才记得牢</span></h2>
        ${practice.map((p) => {
          const t = Tools.get(p.t);
          return `
          <button class="lesson-row" data-tool="${t.id}">
            <span class="lesson-num do-icon">${t.icon}</span>
            <span class="lesson-name">${t.name}<span class="do-note">${p.n}</span></span>
            <span class="lesson-arrow">›</span>
          </button>`;
        }).join('')}
      </div>`;
    })()}
  `;

  $('#lesson-back').addEventListener('click', () => { location.hash = '#/learn'; });
  el.querySelectorAll('[data-tool]').forEach((b) =>
    b.addEventListener('click', () => { location.hash = '#/tool/' + b.dataset.tool; })
  );

  /* --- 测验引擎 --- */
  const box = el.querySelector('#quiz-box');
  const resultBox = el.querySelector('#quiz-result');
  const state = lesson.quiz.map(() => ({ picked: -1 }));

  function renderQuiz() {
    box.innerHTML = lesson.quiz.map((q, qi) => {
      const st = state[qi];
      return `
      <div class="quiz-q">
        <div class="quiz-title">${qi + 1}. ${q.q}</div>
        <div class="quiz-opts">
          ${q.options.map((op, oi) => {
            let cls = 'quiz-opt';
            if (st.picked >= 0) {
              if (oi === q.answer) cls += ' right';
              else if (oi === st.picked) cls += ' wrong';
              else cls += ' dim';
            }
            return `<button class="${cls}" data-q="${qi}" data-o="${oi}" ${st.picked >= 0 ? 'disabled' : ''}>${op}</button>`;
          }).join('')}
        </div>
        ${st.picked >= 0 ? `<div class="quiz-why ${st.picked === q.answer ? 'ok' : 'no'}">${st.picked === q.answer ? '✓ 答对了' : '✗ 正确答案：' + q.options[q.answer]} · ${q.why}</div>` : ''}
      </div>`;
    }).join('');

    box.querySelectorAll('.quiz-opt:not([disabled])').forEach((b) =>
      b.addEventListener('click', () => {
        state[+b.dataset.q].picked = +b.dataset.o;
        renderQuiz();
      })
    );

    const answeredAll = state.every((s) => s.picked >= 0);
    if (answeredAll) {
      const score = state.filter((s, i) => s.picked === lesson.quiz[i].answer).length;
      const perfect = score === lesson.quiz.length;
      const next = Course.nextOf(id);
      const backBtn = '<button class="btn-ghost" id="lesson-back-learn">返回课堂</button>';
      const nextBtn = next
        ? `<button class="btn-primary" id="lesson-next">下一课：${next.lesson.title} ›</button>`
        : '';
      const bindNav = () => {
        const back = $('#lesson-back-learn');
        if (back) back.addEventListener('click', () => { location.hash = '#/learn'; });
        const nx = $('#lesson-next');
        if (nx && next) nx.addEventListener('click', () => { location.hash = '#/lesson/' + next.lesson.id; });
      };
      if (alreadyDone) {
        resultBox.innerHTML = `<div class="quiz-done-box">
          <p>得分 ${score}/${lesson.quiz.length} · 本课已完成过，复习愉快！</p>
          <div class="btn-row">${backBtn}${nextBtn}</div>
        </div>`;
        bindNav();
      } else {
        resultBox.innerHTML = `<div class="quiz-done-box">
          <p>${perfect ? '满分！乐理小天才就是你' : '得分 ' + score + '/' + lesson.quiz.length} · 完成打卡可得 <b>+${perfect ? 30 : 20} XP</b></p>
          <button class="btn-primary" id="lesson-finish">✓ 完成本课</button>
        </div>`;
        $('#lesson-finish').addEventListener('click', () => {
          const map = Course.doneMap();
          map[id] = true;
          Store.setJSON('course_done', map);
          const gain = perfect ? 30 : 20;
          Growth.add(gain, perfect ? '满分通过' : '完成课程');
          resultBox.innerHTML = `<div class="quiz-done-box">
            <p>🎉 已打卡 <b>+${gain} XP</b>！知识到手，去下面练一练，或者直接</p>
            <div class="btn-row">${backBtn}${nextBtn}</div>
          </div>`;
          bindNav();
        });
      }
    } else {
      resultBox.innerHTML = `<p class="hint">已答 ${state.filter((s) => s.picked >= 0).length}/${lesson.quiz.length} 题</p>`;
    }
  }
  renderQuiz();
  window.scrollTo(0, 0);
}
