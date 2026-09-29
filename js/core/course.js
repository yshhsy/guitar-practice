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
  `;

  $('#lesson-back').addEventListener('click', () => { location.hash = '#/learn'; });

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
      resultBox.innerHTML = alreadyDone
        ? `<div class="quiz-done-box"><p>得分 ${score}/${lesson.quiz.length} · 本课已完成过，复习愉快！</p>
           <button class="btn-primary" id="lesson-finish">返回课堂</button></div>`
        : `<div class="quiz-done-box">
            <p>${perfect ? '满分！乐理小天才就是你' : '得分 ' + score + '/' + lesson.quiz.length} · 完成打卡可得 <b>+${perfect ? 30 : 20} XP</b></p>
            <button class="btn-primary" id="lesson-finish">✓ 完成本课</button>
          </div>`;
      $('#lesson-finish').addEventListener('click', () => {
        if (!alreadyDone) {
          const map = Course.doneMap();
          map[id] = true;
          Store.setJSON('course_done', map);
          Growth.add(perfect ? 30 : 20, perfect ? '满分通过' : '完成课程');
        }
        location.hash = '#/learn';
      });
    } else {
      resultBox.innerHTML = `<p class="hint">已答 ${state.filter((s) => s.picked >= 0).length}/${lesson.quiz.length} 题</p>`;
    }
  }
  renderQuiz();
  window.scrollTo(0, 0);
}
