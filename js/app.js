/* ============================================================
 * 主逻辑：路由 / 首页工具网格 / 练习计时 / 统计
 * ============================================================ */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const API = { AudioEngine, Theory, ChordLib, Diagram, Store };

/* ================= 路由 ================= */
let currentTool = null;

function showPage(name) {
  $$('.page').forEach((p) => p.classList.remove('active'));
  $(`#page-${name}`).classList.add('active');
  const tabMap = { tool: 'home', lesson: 'learn', path: 'today' };
  const tabName = tabMap[name] || name;
  $$('.tabbar .tab').forEach((t) => t.classList.toggle('active', t.dataset.page === tabName));
  window.scrollTo(0, 0);
}

function route() {
  const hash = location.hash || '#/';
  const m = hash.match(/^#\/tool\/([\w-]+)/);
  if (m) {
    const tool = Tools.get(m[1]);
    if (tool) return openTool(tool);
  }
  if (hash === '#/practice') { showPage('practice'); renderTodaySummary(); renderTodayList(); return; }
  if (hash === '#/stats') { showPage('stats'); renderStats(); return; }
  if (hash === '#/path') { showPage('path'); renderPathPage($('#path-body')); return; }
  if (hash === '#/tools') { showPage('home'); return; }
  if (hash === '#/learn') { showPage('learn'); renderLearnPage($('#learn-body')); return; }
  if (hash.startsWith('#/lesson/')) { showPage('lesson'); renderLessonPage($('#lesson-body'), hash.slice(9)); return; }
  // 默认落在「今天」面板
  showPage('today');
  renderToday($('#today-body'));
}

function openTool(tool) {
  // 卸载旧工具：停止一切声音调度
  if (currentTool && currentTool.teardown) { try { currentTool.teardown(); } catch {} }
  currentTool = tool;
  $('#tool-icon').textContent = tool.icon;
  $('#tool-name').textContent = tool.name;
  $('#tool-desc').textContent = tool.desc;
  const body = $('#tool-body');
  body.innerHTML = '';
  Store.setJSON('last_tool', tool.id);
  // 顶部注入使用说明（可折叠）
  const help = typeof TOOL_HELP !== 'undefined' && TOOL_HELP[tool.id];
  if (help) {
    const box = document.createElement('details');
    box.className = 'help-box';
    box.innerHTML = `
      <summary><span class="help-ico">📖</span> 使用说明 <span class="help-arrow">›</span></summary>
      <div class="help-body">
        <p class="help-use">${help.use}</p>
        <ol class="help-steps">${help.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
        <p class="help-more">不确定先学哪个？去 <a href="#/path">学习路线</a> 看看</p>
      </div>`;
    body.appendChild(box);
  }
  tool.render(body, API);
  showPage('tool');
}

$('#tool-back').addEventListener('click', () => { location.hash = '#/'; });

$$('.tabbar .tab').forEach((t) =>
  t.addEventListener('click', () => {
    if (t.dataset.page === 'home') location.hash = '#/tools';
    else if (t.dataset.page === 'today') location.hash = '#/';
    else location.hash = '#/' + t.dataset.page;
  })
);

window.addEventListener('hashchange', route);

/* ================= 首页工具网格 ================= */
function renderHome() {
  const box = $('#tool-grid');
  box.innerHTML = '';
  let idx = 0;
  Tools.grouped().forEach(({ cat, tools }) => {
    const title = document.createElement('div');
    title.className = 'tool-cat-title';
    title.style.gridColumn = '1 / -1';
    title.textContent = cat;
    box.appendChild(title);
    tools.forEach((t) => {
      const card = document.createElement('div');
      card.className = 'tool-card';
      card.style.animationDelay = Math.min(idx * 45, 540) + 'ms';
      idx++;
      card.innerHTML = `
        <span class="t-tag">免费</span>
        <div class="icon-tile">${t.icon}</div>
        <div class="t-name">${t.name}</div>
        <div class="t-desc">${t.desc}</div>`;
      card.addEventListener('click', () => { location.hash = '#/tool/' + t.id; });
      box.appendChild(card);
    });
  });
}

/* ================= 练习计时 ================= */
const Timer = {
  running: false, startAt: 0, elapsed: 0, raf: null, type: '和弦练习',
  fmt(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(Math.floor(sec % 60)).padStart(2, '0');
    return `${m}:${s}`;
  },
  start() {
    this.running = true;
    this.startAt = Date.now();
    const btn = $('#timer-btn');
    btn.textContent = '结束练习';
    btn.classList.add('danger');
    $('#timer-display').classList.add('running');
    $('#timer-hint').textContent = `正在练习：${this.type}，结束后自动保存`;
    const loop = () => {
      this.elapsed = (Date.now() - this.startAt) / 1000;
      $('#timer-display').textContent = this.fmt(this.elapsed);
      this.raf = requestAnimationFrame(loop);
    };
    loop();
  },
  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    const seconds = Math.round(this.elapsed);
    const btn = $('#timer-btn');
    btn.textContent = '开始练习';
    btn.classList.remove('danger');
    $('#timer-display').classList.remove('running');
    if (seconds >= 30) {
      Store.records.add({ date: Store.dateStr(), ts: Date.now(), seconds, type: this.type });
      Growth.add(Math.max(1, Math.round(seconds / 60)), '练习打卡');
      $('#timer-hint').textContent = `已保存：${this.type} ${this.fmt(seconds)}，继续保持！`;
    } else {
      $('#timer-hint').textContent = '不足 30 秒未计入记录，再练久一点吧';
    }
    this.elapsed = 0;
    $('#timer-display').textContent = '00:00';
    renderTodaySummary();
    renderTodayList();
  },
};

$('#timer-btn').addEventListener('click', () => {
  AudioEngine.ensureCtx();
  Timer.running ? Timer.stop() : Timer.start();
});

$$('#timer-type-row .chip').forEach((c) =>
  c.addEventListener('click', () => {
    if (Timer.running) return;
    $$('#timer-type-row .chip').forEach((x) => x.classList.remove('active'));
    c.classList.add('active');
    Timer.type = c.dataset.type;
  })
);

function renderTodaySummary() {
  const today = Store.dateStr();
  const secs = Store.records.load()
    .filter((r) => r.date === today)
    .reduce((a, r) => a + r.seconds, 0);
  $('#practice-today-summary').textContent = secs > 0
    ? `今天已练习 ${Math.floor(secs / 60)} 分 ${secs % 60} 秒`
    : '今天还没有练习记录';
}

function renderTodayList() {
  const today = Store.dateStr();
  const list = Store.records.load().filter((r) => r.date === today).sort((a, b) => b.ts - a.ts);
  $('#today-list').innerHTML = list.length === 0
    ? '<div class="record-empty">还没有记录，去开始第一段练习吧</div>'
    : list.map((r) => {
        const m = Math.floor(r.seconds / 60), s = r.seconds % 60;
        const time = new Date(r.ts);
        const hh = String(time.getHours()).padStart(2, '0');
        const mm = String(time.getMinutes()).padStart(2, '0');
        return `<div class="record-item"><span>${r.type}</span>
          <span class="r-meta">${hh}:${mm} · ${m > 0 ? m + '分' : ''}${s}秒</span></div>`;
      }).join('');
}

/* ================= 统计 ================= */
function renderStats() {
  const records = Store.records.load();
  const totalSec = records.reduce((a, r) => a + r.seconds, 0);
  $('#stat-total').innerHTML = `${Math.round(totalSec / 60)}<small>分钟</small>`;

  const dayMap = {};
  records.forEach((r) => { dayMap[r.date] = (dayMap[r.date] || 0) + r.seconds; });
  $('#stat-days').innerHTML = `${Object.keys(dayMap).length}<small>天</small>`;

  let streak = 0;
  const cursor = new Date();
  if (!dayMap[Store.dateStr(cursor)]) cursor.setDate(cursor.getDate() - 1);
  while (dayMap[Store.dateStr(cursor)]) { streak++; cursor.setDate(cursor.getDate() - 1); }
  $('#stat-streak').innerHTML = `${streak}<small>天</small>`;

  const chart = $('#bar-chart');
  chart.innerHTML = '';
  const max = Math.max(600, ...Object.values(dayMap));
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const sec = dayMap[Store.dateStr(d)] || 0;
    const col = document.createElement('div');
    col.className = 'bar-col';
    col.innerHTML = `<div class="bar ${sec > 0 ? 'has' : ''} ${i === 0 ? 'today' : ''}"
      style="height:${Math.max(3, (sec / max) * 100)}%" title="${Math.round(sec / 60)}分钟"></div>`;
    chart.appendChild(col);
  }

  const sorted = [...records].sort((a, b) => b.ts - a.ts).slice(0, 30);
  $('#record-list').innerHTML = sorted.length === 0
    ? '<div class="record-empty">还没有记录，去开始第一段练习吧</div>'
    : sorted.map((r) => {
        const m = Math.floor(r.seconds / 60), s = r.seconds % 60;
        return `<div class="record-item"><span>${r.type}</span>
          <span class="r-meta">${r.date} · ${m > 0 ? m + '分' : ''}${s}秒</span></div>`;
      }).join('');
}

$('#export-btn').addEventListener('click', () => {
  const data = JSON.stringify(Store.records.load(), null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `guitar-practice-${Store.dateStr()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

/* ================= 启动 ================= */
renderHome();
route();
if (location.hash === '' || location.hash === '#/') maybeShowOnboarding();
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
