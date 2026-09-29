/* ============================================================
 * 「今天」面板：问候 + 今日练习计划 + 继续学习
 * 以及首次启动的新手引导
 * ============================================================ */

/* 今日练习计划：按当前路线阶段和目标时长生成 */
function buildTodayPlan() {
  const goal = Store.getJSON('goal', 20) || 20;
  const done = Store.getJSON('path_done', {}) || {};
  const stage = LEARN_PATH.find((s) => !done[s.id]);
  const split = [Math.max(2, Math.round(goal * 0.25)), Math.max(3, Math.round(goal * 0.5)), Math.max(2, goal - Math.round(goal * 0.25) - Math.round(goal * 0.5))];

  if (!stage) {
    return {
      stageTitle: '自由练习',
      items: [
        { id: 'song-follow', mins: split[1], tag: '主修' },
        { id: 'ear', mins: split[0], tag: '磨耳朵' },
        { id: 'backing', mins: split[2], tag: '即兴玩' },
      ],
    };
  }
  const tools = stage.tools.map((t) => t.id);
  const pick = (i) => tools[Math.min(i, tools.length - 1)];
  return {
    stageTitle: stage.title,
    items: [
      { id: pick(0), mins: split[0], tag: '热身' },
      { id: pick(1) === pick(0) ? pick(0) : pick(1), mins: split[1], tag: '主修' },
      { id: pick(tools.length - 1), mins: split[2], tag: '巩固' },
    ].filter((it, i, arr) => arr.findIndex((x) => x.id === it.id) === i),
  };
}

function renderToday(el) {
  const h = new Date().getHours();
  const greet = h < 6 ? '夜深了' : h < 12 ? '早上好' : h < 18 ? '下午好' : '晚上好';
  const plan = buildTodayPlan();

  /* 今日已练 */
  const todayStr = Store.dateStr();
  const todayRecs = Store.records.load().filter((r) => r.date === todayStr);
  const todayMins = Math.floor(todayRecs.reduce((s, r) => s + r.seconds, 0) / 60);

  const next = Course.nextLesson();
  const lastTool = Store.getJSON('last_tool', null);
  const lastToolObj = lastTool ? Tools.get(lastTool) : null;
  const pathDone = Store.getJSON('path_done', {}) || {};
  const pathDoneCnt = LEARN_PATH.filter((s) => pathDone[s.id]).length;

  el.innerHTML = `
    <div class="today-hero card">
      <div class="today-greet-row">
        <div>
          <div class="today-greet">${greet}，琴友</div>
          <div class="today-date">${new Date().getMonth() + 1}月${new Date().getDate()}日 · ${['周日','周一','周二','周三','周四','周五','周六'][new Date().getDay()]}</div>
        </div>
      </div>
      <div class="today-mini-stats">
        <span>⏱️ 今日已练 ${todayMins} 分钟</span>
        <span>🎯 路线 ${pathDoneCnt}/${LEARN_PATH.length}</span>
      </div>
    </div>

    <div class="card today-plan">
      <div class="row between">
        <h2>今日练习计划</h2>
        <span class="today-plan-stage">${plan.stageTitle}</span>
      </div>
      ${plan.items.map((it) => {
        const t = Tools.get(it.id);
        if (!t) return '';
        return `
        <div class="plan-item" data-go="${it.id}">
          <div class="icon-tile small">${t.icon}</div>
          <div class="plan-text">
            <div class="plan-name">${t.name}</div>
            <div class="plan-meta"><span class="plan-tag">${it.tag}</span> ${it.mins} 分钟</div>
          </div>
          <button class="plan-go">开始 ›</button>
        </div>`;
      }).join('')}
      <p class="path-progress-tip">计划按你的学习路线阶段自动生成 · 练完记得去「练习」页打卡计时</p>
    </div>

    ${next ? `
    <div class="card today-next-lesson" data-lesson="${next.lesson.id}">
      <div class="tnl-label">📚 继续学习</div>
      <div class="tnl-title">${next.lesson.title}</div>
      <div class="tnl-meta">${next.chapter.icon} ${next.chapter.title} · 约 ${next.lesson.mins} 分钟 · 含随堂测验</div>
      <span class="tnl-arrow">›</span>
    </div>` : ''}

    <div class="grid2">
      ${lastToolObj ? `
      <div class="card today-link" data-go="${lastToolObj.id}">
        <div class="today-link-ico">🕘</div>
        <div class="today-link-t">继续上次</div>
        <div class="today-link-d">${lastToolObj.name}</div>
      </div>` : `
      <div class="card today-link" data-hash="#/path">
        <div class="today-link-ico">🎯</div>
        <div class="today-link-t">学习路线</div>
        <div class="today-link-d">${pathDoneCnt}/${LEARN_PATH.length} 阶段</div>
      </div>`}
      <div class="card today-link" data-hash="#/practice">
        <div class="today-link-ico">⏱️</div>
        <div class="today-link-t">开始计时</div>
        <div class="today-link-d">记录每次练琴</div>
      </div>
    </div>
  `;

  el.querySelectorAll('[data-go]').forEach((b) =>
    b.addEventListener('click', () => { location.hash = '#/tool/' + b.dataset.go; })
  );
  el.querySelectorAll('[data-hash]').forEach((b) =>
    b.addEventListener('click', () => { location.hash = b.dataset.hash; })
  );
  const nl = el.querySelector('[data-lesson]');
  if (nl) nl.addEventListener('click', () => { location.hash = '#/lesson/' + nl.dataset.lesson; });
}

/* ===== 新手引导（首次启动显示一次） ===== */
function maybeShowOnboarding() {
  if (Store.getJSON('onboard', false)) return;
  const goal0 = Store.getJSON('goal', 20);
  const ov = document.createElement('div');
  ov.id = 'onboard';
  ov.innerHTML = `
    <div class="ob-card">
      <div class="ob-slides">
        <div class="ob-slide">
          <div class="ob-emoji">🎸</div>
          <div class="ob-title">欢迎来到弦上</div>
          <p class="ob-p">这里有一个吉他手需要的一切：20 个随身工具、系统的乐理课堂、为你规划的每日练习。从零基础到弹出第一首歌，慢慢来，比较快。</p>
        </div>
        <div class="ob-slide" style="display:none">
          <div class="ob-emoji">🎯</div>
          <div class="ob-title">怎么用这个 App</div>
          <p class="ob-p">每天打开「今天」，跟着自动生成的练习计划练；在「课堂」按系统课程每天学一课，课后测验帮你检验掌握程度；遇到具体问题，20 个工具随时待命。</p>
        </div>
        <div class="ob-slide" style="display:none">
          <div class="ob-emoji">⏱️</div>
          <div class="ob-title">定个小目标</div>
          <p class="ob-p">每天打算练多久？坚持比强度重要，哪怕 10 分钟也很好。</p>
          <div class="chip-row ob-goals">
            <button class="chip ${goal0 === 10 ? 'active' : ''}" data-goal="10">10 分钟</button>
            <button class="chip ${goal0 === 20 ? 'active' : ''}" data-goal="20">20 分钟</button>
            <button class="chip ${goal0 === 30 ? 'active' : ''}" data-goal="30">30 分钟</button>
          </div>
        </div>
      </div>
      <div class="ob-dots"><i class="on"></i><i></i><i></i></div>
      <button class="btn-primary ob-next">下一步</button>
      <button class="ob-skip">跳过</button>
    </div>
  `;
  document.body.appendChild(ov);

  let step = 0;
  const slides = ov.querySelectorAll('.ob-slide');
  const dots = ov.querySelectorAll('.ob-dots i');
  const nextBtn = ov.querySelector('.ob-next');
  let goal = goal0;

  ov.querySelectorAll('[data-goal]').forEach((c) =>
    c.addEventListener('click', () => {
      goal = +c.dataset.goal;
      ov.querySelectorAll('[data-goal]').forEach((x) => x.classList.toggle('active', x === c));
    })
  );

  function finish() {
    Store.setJSON('goal', goal);
    Store.setJSON('onboard', true);
    ov.classList.add('bye');
    setTimeout(() => ov.remove(), 350);
  }

  nextBtn.addEventListener('click', () => {
    if (step < 2) {
      step++;
      slides.forEach((s, i) => (s.style.display = i === step ? '' : 'none'));
      dots.forEach((d, i) => d.classList.toggle('on', i === step));
      if (step === 2) nextBtn.textContent = '开始我的吉他之旅';
    } else finish();
  });
  ov.querySelector('.ob-skip').addEventListener('click', finish);
}
