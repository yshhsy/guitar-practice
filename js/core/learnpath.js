/* ============================================================
 * 新手学习路线：从零基础到第一首弹唱的分阶段指引
 * 每个阶段推荐对应工具，可标记"已掌握"追踪进度
 * ============================================================ */
const LEARN_PATH = [
  {
    id: 'p0', icon: '🎸', title: '第 0 步 · 出发前的准备', time: '第 1 天',
    goal: '认识吉他构造和六根弦的音名（从粗到细是 E A D G B E），学会正确抱琴和按弦姿势，并养成练琴前先调音的习惯。',
    tools: [
      { id: 'tuner', how: '每次练琴前花 1 分钟把六根弦调准，这是每天都要做的第一件事' },
    ],
    tip: '左手用指尖垂直按弦、靠近品丝但不要压在上面；右手可以先空弦拨响每根弦，熟悉手感。',
  },
  {
    id: 'p1', icon: '🥁', title: '第 1 阶段 · 节奏感打底', time: '第 1 周',
    goal: '节奏是吉他手的地基。这周先不急着按和弦，跟着拍子拍手、跺脚或扫空弦，把"稳"字练出来。',
    tools: [
      { id: 'metronome', how: '从 60 BPM 开始跟着拍手，能稳 1 分钟就加 5' },
      { id: 'drum-machine', how: '适应节拍器后换鼓机，更像跟着真实乐队演奏' },
    ],
    tip: '每天 10 分钟就够。跟不上就降速，宁可慢、不要抢。',
  },
  {
    id: 'p2', icon: '🤏', title: '第 2 阶段 · 第一批开放和弦', time: '第 2 ~ 3 周',
    goal: '拿下 Em、Am、C、G、D、E、A、Dm 这 8 个最常用开放和弦，做到看着指法图能按出来、每根弦都弹响。',
    tools: [
      { id: 'chord-query', how: '查指法、听声音，重点看教学提示（比如"E 和弦整体下移一品就是 F"）' },
      { id: 'chord-random', how: '随机抽查，3 秒内按出来才算真的记住' },
    ],
    tip: '指尖疼是正常的，坚持一周会起茧。每次按好后逐弦拨响，检查有没有闷音。',
  },
  {
    id: 'p3', icon: '🔄', title: '第 3 阶段 · 和弦转换', time: '第 3 ~ 5 周',
    goal: '能按不代表能换。这个阶段专练两个和弦之间的转换，目标是 C→G、G→D、Am→Em 等常用组合 1 秒内干净换好。',
    tools: [
      { id: 'chord-switch', how: '两个和弦自动轮流出现，从 4 秒间隔慢慢提速' },
      { id: 'chord-morph', how: '看清哪根手指可以不动，能省力一半' },
    ],
    tip: '先慢后快。转换瞬间整只手一起起落，不要一根手指一根手指地找位置。',
  },
  {
    id: 'p4', icon: '🌊', title: '第 4 阶段 · 扫弦节奏型', time: '第 4 ~ 6 周',
    goal: '学会 ↓ ↓↑ ↑↓↑ 等最常用的节奏型，做到左手换和弦时右手节奏不停——弹唱的雏形就出来了。',
    tools: [
      { id: 'strum-follow', how: '跟着箭头一个动作一个动作练，先慢后快' },
      { id: 'strum-adv', how: '加入重音和闷音，让扫弦更有味道' },
      { id: 'chord-drum', how: '配上鼓点弹和弦走向，锻炼在音乐里的稳定性' },
    ],
    tip: '右手是发动机：哪怕左手没换好，右手也绝对不要停。',
  },
  {
    id: 'p5', icon: '🎤', title: '第 5 阶段 · 你的第一首弹唱', time: '第 6 ~ 8 周',
    goal: '把前面的技能串起来，完整弹唱一首歌，并开始积累自己的曲库。',
    tools: [
      { id: 'song-follow', how: '内置经典和弦进行，滚动跟练到原速' },
      { id: 'backing', how: '让伴奏机帮你撑住场面，专注自己的部分' },
      { id: 'my-tabs', how: '把学会的歌记进自己的曲库，随时翻看' },
    ],
    tip: '第一首歌选只有 3~4 个和弦的，比如 C-G-Am-F 走向的歌，一周内就能拿下。',
  },
  {
    id: 'p6', icon: '💪', title: '进阶 · 横按与变调', time: '第 2 ~ 3 个月',
    goal: '攻克 F 大横按，学会用变调夹和转调把任何歌调到适合自己唱的高度，从此不被"难和弦"劝退。',
    tools: [
      { id: 'chord-query', how: '查横按把位，用"E 指型平移"的思路理解 F、G、A' },
      { id: 'capo-calc', how: '告诉你夹第几品，就能用简单指法弹原调' },
      { id: 'transpose', how: '把整首歌的和弦一键移到你舒服的调' },
      { id: 'key-helper', how: '按你的音域推荐最适合的弹唱调' },
    ],
    tip: '横按靠巧劲不靠蛮力：食指用侧面按弦、拇指放低、手肘向内收。',
  },
  {
    id: 'p7', icon: '🧠', title: '进阶 · 乐理与指板', time: '长期坚持',
    goal: '理解你在弹什么：音阶、调式、和弦构成。开始在指板上自由移动，慢慢脱离"背谱"阶段。',
    tools: [
      { id: 'scale-trainer', how: '音阶在指板上的位置，边看边听边弹' },
      { id: 'caged-circle', how: '用 CAGED 五种指型在整个指板找同一个和弦' },
      { id: 'theory-book', how: '系统的乐理知识库，遇到不懂的术语就来查' },
      { id: 'ear', how: '每天 5 分钟听音训练，音感靠积累' },
    ],
    tip: '这部分不用急，每天练琴前看一点。半年后回头看，会发现自己脱胎换骨。',
  },
];

/* 渲染学习路线页 */
function renderPathPage(el) {
  const done = Store.getJSON('path_done', {}) || {};
  const doneCount = LEARN_PATH.filter((s) => done[s.id]).length;
  const pct = Math.round((doneCount / LEARN_PATH.length) * 100);

  el.innerHTML = `
    <div class="card path-progress-card">
      <div class="row between">
        <h2>我的进度</h2>
        <span class="path-progress-num">${doneCount} / ${LEARN_PATH.length} 阶段</span>
      </div>
      <div class="path-progress-track"><div class="path-progress-bar" style="width:${pct}%"></div></div>
      <p class="path-progress-tip">${doneCount === 0
        ? '从第 0 步开始，每天 20 分钟，两个月弹出第一首歌'
        : pct === 100
          ? '全部阶段已完成，你已经是合格的吉他手了！'
          : '每练完一个阶段就标记"已掌握"，配合「练习」页打卡效果更好'}</p>
    </div>
    <div class="path-list">
      ${LEARN_PATH.map((s, i) => `
        <div class="card path-stage ${done[s.id] ? 'done' : ''}" data-stage="${s.id}">
          <div class="path-stage-head">
            <div class="path-num">${i}</div>
            <div class="path-head-text">
              <div class="path-title">${s.icon} ${s.title}</div>
              <div class="path-time">${s.time}</div>
            </div>
            <button class="path-done-btn ${done[s.id] ? 'on' : ''}" data-done="${s.id}">
              ${done[s.id] ? '✓ 已掌握' : '标记掌握'}
            </button>
          </div>
          <p class="path-goal">${s.goal}</p>
          <div class="path-tools">
            ${s.tools.map((t) => {
              const tool = Tools.get(t.id);
              if (!tool) return '';
              return `
                <div class="path-tool">
                  <button class="path-tool-chip" data-tool="${t.id}">
                    <span class="path-tool-icon">${tool.icon}</span>
                    <span class="path-tool-name">${tool.name}</span>
                    <span class="path-tool-arrow">›</span>
                  </button>
                  <div class="path-how">${t.how}</div>
                </div>`;
            }).join('')}
          </div>
          <div class="path-tip">💡 ${s.tip}</div>
        </div>`).join('')}
    </div>
    <p class="hint">点工具卡片可直接跳转到对应工具 · 进度保存在本机</p>
  `;

  el.querySelectorAll('[data-tool]').forEach((b) =>
    b.addEventListener('click', () => { location.hash = '#/tool/' + b.dataset.tool; })
  );
  el.querySelectorAll('[data-done]').forEach((b) =>
    b.addEventListener('click', () => {
      const state = Store.getJSON('path_done', {}) || {};
      state[b.dataset.done] = !state[b.dataset.done];
      Store.setJSON('path_done', state);
      renderPathPage(el);
    })
  );
}
