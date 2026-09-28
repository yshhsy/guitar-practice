/* ============================================================
 * 乐理知识库 theory-book
 * 按主题整理乐理，适合系统复习
 * ============================================================ */
(function () {
  const ID = 'theory-book';
  const GREEN = '#17614e';
  const GOLD = '#c99a3f';

  /* getVoicings 能正确生成指型的性质（其余用真实音琶音兜底） */
  const PLAYABLE = ['', 'm', '7', 'maj7', 'M7', 'm7', 'sus4', 'sus2', 'add9', '6'];

  const ARTICLES = [
    {
      id: 'intervals',
      title: '音程：半音与全音',
      sum: '半音与全音是乐理的第一块砖：一张表认全八度内 12 个音程。',
      blocks: [
        { p: '把两根手指按在<b>相邻的两个品</b>上，它们的音高距离就是<b>半音</b>；中间隔一品，就是<b>全音</b>（＝两个半音）。吉他每上升一品，音高就升高一个半音——整个乐理大厦都砌在这块砖上。' },
        { fret: { fromFret: 0, toFret: 5, width: 340, markers: [
          { string: 0, fret: 0, label: 'E' },
          { string: 0, fret: 1, label: 'F', color: GOLD },
          { string: 0, fret: 2, label: 'F#' },
          { string: 0, fret: 3, label: 'G', color: GOLD },
        ] }, cap: '6 弦 0-3 品：E→F 只差一品（半音），F→G 隔了一品（全音）。E–F、B–C 天生就是半音，它们之间没有“黑键”。' },
        { p: '从任意音出发数半音，就能得到所有音程——它们是给“两个音之间的距离”起的名字。八度之内一共 12 个：' },
        { table: { head: ['半音数', '音程名', '从 C 出发', '大致听感'], rows: [
          ['0', '纯一度', 'C', '同一个音'],
          ['1', '小二度', 'C–Db', '紧张、刺激'],
          ['2', '大二度', 'C–D', '自然、顺滑'],
          ['3', '小三度', 'C–Eb', '忧郁'],
          ['4', '大三度', 'C–E', '明亮（大三和弦的“大”来自它）'],
          ['5', '纯四度', 'C–F', '开阔、稳定'],
          ['6', '三全音', 'C–F#', '不安、悬浮'],
          ['7', '纯五度', 'C–G', '空灵有力（强力和弦）'],
          ['8', '小六度', 'C–Ab', '温柔的愁'],
          ['9', '大六度', 'C–A', '甜美'],
          ['10', '小七度', 'C–Bb', '慵懒、布鲁斯味'],
          ['11', '大七度', 'C–B', '梦幻、爵士感'],
          ['12', '纯八度', 'C–c', '同一个音的另一个高度'],
        ] } },
        { box: '记忆口诀：<b>四、五、八度是“纯”的</b>，其余大小成对出现；三全音最“刺”，是一切紧张感的来源。' },
      ],
    },
    {
      id: 'triads',
      title: '三和弦与七和弦',
      sum: '三个音叠出晴与阴：三和弦的构成、七和弦的色彩与听感速记。',
      blocks: [
        { p: '<b>三和弦</b>只有三个音：根音、三音、五音，按三度叠起来。决定它“晴”还是“阴”的，是最底下那个三度：根音到三音是<b>大三度</b> → 大三和弦（明亮）；是<b>小三度</b> → 小三和弦（忧郁）。' },
        { chords: [
          { frets: [-1, 3, 2, 0, 1, 0], opts: { fingers: [-1, 3, 2, 0, 1, 0] }, cap: 'C · 大三和弦<br>根音—大三度—纯五度' },
          { frets: [-1, 3, 5, 5, 4, 3], opts: { fingers: [-1, 1, 3, 4, 2, 1], barre: { fret: 3, from: 1, to: 5 }, baseFret: 3 }, cap: 'Cm · 小三和弦<br>根音—小三度—纯五度' },
        ] },
        { p: '同一个根音 C，只把三音降低半音（E→Eb），晴天立刻转阴——这就是“小三度”的魔力。' },
        { p: '<b>七和弦</b>＝三和弦＋再叠一个七音，色彩立刻变得“成人”起来：大七（maj7）梦幻、小七（m7）慵懒、属七（7）充满“想回家”的冲动，减七（dim7）则是悬疑片配乐。' },
        { box: '听感速记：<b>大＝晴，小＝阴，7＝想回家，maj7＝做梦，dim＝悬疑</b>。' },
      ],
    },
    {
      id: 'relative-keys',
      title: '大小调与关系大小调',
      sum: '“全全半…”配方、大小调的情绪，以及共用七个音的关系大小调。',
      blocks: [
        { p: '自然大调的配方是 <b>全全半全全全半</b>；自然小调是 <b>全半全全半全全</b>。同一张配方，从不同的音出发，就得到不同的调。' },
        { p: '大小调之间最迷人的关系叫<b>关系大小调</b>：共用完全相同的七个音，只是一“主”一“副”。大调主音向<b>下降三个半音</b>，就是它的小搭档：' },
        { p: 'C ↔ Am　G ↔ Em　D ↔ Bm　A ↔ F#m　E ↔ C#m　F ↔ Dm' },
        { p: '同一组音，为什么听起来一个大一个小？关键在<b>主音的位置</b>：旋律与和声都围绕谁转。判断一首歌的大小调，看它<b>结尾</b>落在哪个音、哪个和弦上，最可靠。' },
        { box: '口诀：<b>大调降 3 个半音，就是它的关系小调</b>——C 降 3 个半音是 A，所以 C 大调与 A 小调共用一套音。' },
      ],
    },
    {
      id: 'circle',
      title: '五度圈的应用',
      sum: '转调地图＋升降号账本＋和弦亲戚表：一圈看懂调性关系。',
      blocks: [
        { p: '把 12 个调按<b>纯五度</b>首尾相接排成一圈，就是五度圈。顺时针走一步，根音上行纯五度（C→G→D……）；逆时针走一步，上行纯四度（C→F→Bb……）。' },
        { p: '它至少有三张面孔：<b>① 转调地图</b>——圈上相邻的调只差一个音，转起来最平滑；<b>② 升降号账本</b>——离 C 每远一格，多一个 ♯（向右）或一个 ♭（向左）；<b>③ 和弦亲戚表</b>——I–IV–V 在圈上手拉手：IV 在逆时针一格，V 在顺时针一格。' },
        { p: '即兴时也用得上：一首歌的调确定后，它自己和邻居们（I、IV、V、vi 的调）里的音基本都“安全”，跑不出去。' },
        { box: '记忆句：<b>从 C 出发向右加 ♯、向左加 ♭，每走一格差一个记号</b>。' },
      ],
    },
    {
      id: 'progressions',
      title: '和弦级数与常见进行',
      sum: '1645 / 4536251 / 卡农进行：用级数读懂流行歌的骨架（可试听）。',
      blocks: [
        { p: '把一串和弦用<b>级数</b>（罗马数字）记录，就得到“进行”——换调不用重学，只需整体平移。大调里最重的三个角色：I（家）、IV（出门）、V（想回家），vi 是情感支点。' },
        { p: '下面三条进行以 C 大调为例，点一点，听听它们各自的“性格”：' },
        { prog: { name: '1–6–4–5', chords: ['C', 'Am', 'F', 'G'], note: '流行万金油：几乎每首口水歌都住过这栋楼。' } },
        { prog: { name: '4–5–3–6–2–5–1', chords: ['F', 'G', 'Em', 'Am', 'Dm', 'G', 'C'], note: '华语情歌标配，自带回忆滤镜，慢歌杀手锏。' } },
        { prog: { name: '卡农进行', chords: ['C', 'G', 'Am', 'Em', 'F', 'C', 'F', 'G'], note: '古典出身，流动优雅，KTV 抒情曲目常客。' } },
        { box: '级数比和弦名更重要：<b>记住 4536251，任何调里都能弹</b>——数字不变，只换字母。' },
      ],
    },
    {
      id: 'rhythm',
      title: '拍号与节奏型',
      sum: '4/4、3/4、6/8 在晃什么：拍号、扫弦节奏型与慢练心法。',
      blocks: [
        { p: '拍号是一个分数：分母说“以几分音符为一拍”，分子说“每小节几拍”。<b>4/4</b> 最常见，四平八稳；<b>3/4</b> 是圆舞曲的摇摆（强–弱–弱）；<b>6/8</b> 把一小节拆成两大拍，天然“晃”起来。' },
        { dots: { label: '4/4 · 每小节 4 拍', count: 4 } },
        { dots: { label: '3/4 · 圆舞曲，强–弱–弱', count: 3 } },
        { p: '扫弦节奏型是拍子的“衣服”：民谣最经典的 4/4 八分下上型——<b>下 下上 上下上</b>；摇滚常用的 Boom-Chick——低音与和弦交替，模仿贝斯与军鼓的对话。' },
        { p: '练习方法：先脱掉所有衣服，跟节拍器只扫“下—下—下—下”，稳了再一层层穿回去。' },
        { box: '节奏铁律：<b>先开节拍器，从 60 BPM 慢练</b>——手上能稳定连弹 20 遍，才允许加速。' },
      ],
    },
    {
      id: 'barre',
      title: '横按技巧与指型平移',
      sum: '食指当琴枕：E/Am 指型平移原理，与横按不响的五个救星。',
      blocks: [
        { p: '横按的本质：<b>食指充当一根“移动的琴枕”</b>，把整个指型端到任意品位。E 指型向下平移 1 品就是 F；Am 指型平移 2 品就是 Bm——<b>掌握 E、Em、A、Am 四个指型，几十个和弦随之解锁</b>。' },
        { chords: [
          { frets: [1, 3, 3, 2, 1, 1], opts: { fingers: [1, 3, 4, 2, 1, 1], barre: { fret: 1, from: 0, to: 5 } }, cap: 'F · E 指型平移 1 品' },
          { frets: [-1, 2, 4, 4, 3, 2], opts: { fingers: [-1, 1, 3, 4, 2, 1], barre: { fret: 2, from: 1, to: 5 } }, cap: 'Bm · Am 指型平移 2 品' },
        ] },
        { p: '横按发闷音时的五个救星：① 食指用<b>侧面</b>压弦而非指腹；② 拇指与食指像<b>老虎钳</b>对捏、位置放低；③ 手肘轻贴身体，借身体的力；④ 先按好横按逐弦检查，再加其余手指；⑤ 从<b>第 5 品</b>开始练（那里弦的张力最小），再逐步往 1 品搬。' },
        { box: '横按名言：<b>疼是正常的，闷音才要修</b>——每天 5 分钟，两周后你会忘记它曾经是道坎。' },
      ],
    },
  ];

  function render(el, api) {
    const { AudioEngine, Theory, ChordLib, Diagram, Store } = api;
    const read = Store.getJSON('tb_read') || {};
    let cur = -1;

    el.innerHTML = `
    <style>
      #${ID} .tb-p { font-size: 14.5px; line-height: 1.9; color: #2e2a22; margin: 11px 0; }
      #${ID} .tb-p b { color: ${GREEN}; }
      #${ID} .tb-box { margin: 14px 0; font-size: 13.5px; line-height: 1.85; }
      #${ID} .tb-figs { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin: 14px 0 6px; }
      #${ID} .tb-fig { text-align: center; }
      #${ID} .tb-fig figcaption, #${ID} .tb-cap { font-size: 11.5px; color: #a29681; margin-top: 6px; line-height: 1.6; }
      #${ID} .tb-title { font-size: 21px; font-weight: 800; margin: 4px 0 2px; letter-spacing: .5px; }
      #${ID} .tb-num { flex: none; width: 34px; height: 34px; border-radius: 10px;
        background: #e4efe9; color: ${GREEN}; font-weight: 800; font-size: 13px;
        display: flex; align-items: center; justify-content: center; }
      #${ID} .tb-num.dark { background: #f6ead0; color: #8a6414; }
      #${ID} .tb-item { cursor: pointer; }
      #${ID} .tb-item:active { transform: scale(.98); }
      #${ID} .tb-item-title { font-size: 15.5px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
      #${ID} .tb-read { font-size: 10px; font-weight: 600; color: ${GREEN}; background: #e4efe9;
        border: 1px solid #cfe2d8; border-radius: 6px; padding: 1.5px 6px; }
      #${ID} .tb-item-sum { font-size: 12px; color: #6d6455; margin-top: 5px; line-height: 1.6; }
      #${ID} .tb-table { width: 100%; border-collapse: collapse; font-size: 12.5px; margin: 12px 0; }
      #${ID} .tb-table th, #${ID} .tb-table td { border-bottom: 1px dashed #e3d8bf; padding: 6.5px 8px; text-align: left; }
      #${ID} .tb-table th { color: #a29681; font-weight: 600; font-size: 11.5px; }
      #${ID} .tb-table td:first-child { color: ${GREEN}; font-weight: 700; width: 52px; }
      #${ID} .tb-prog { padding: 12px; background: #f8f3e6; border: 1px solid #e3d8bf; border-radius: 12px; margin: 12px 0; }
      #${ID} .tb-prog-name { font-size: 13px; font-weight: 800; color: ${GREEN}; margin-bottom: 8px; }
      #${ID} .tb-prog-note { font-size: 12px; color: #6d6455; margin-top: 8px; line-height: 1.6; }
      #${ID} .tb-arrow { color: #a29681; margin: 0 2px; font-size: 13px; }
      #${ID} .tb-dots { display: flex; align-items: center; gap: 7px; margin: 12px 0 4px; }
      #${ID} .tb-dots-label { font-size: 12.5px; color: #6d6455; margin-right: 8px; }
      #${ID} .tb-nav { margin-top: 18px; }
      #${ID} .tb-nav button { text-align: left; font-size: 13px; line-height: 1.5; }
      #${ID} .tb-nav button[disabled] { opacity: .4; pointer-events: none; }
    </style>
    <div id="${ID}"><div data-part="root"></div></div>`;

    const root = el.querySelector('[data-part="root"]');

    function playChord(name) {
      AudioEngine.ensureCtx();
      const c = Theory.parseChord(name);
      if (!c) return;
      if (PLAYABLE.indexOf(c.suffix) >= 0) {
        const vs = ChordLib.getVoicings(name);
        if (vs.length) { AudioEngine.strum(ChordLib.chordFreqs(vs[0].frets)); return; }
      }
      const freqs = c.tones.map((t) =>
        Theory.freqOf((c.rootIdx + t) % 12, 3 + Math.floor((c.rootIdx + t) / 12)));
      AudioEngine.strum(freqs);
    }

    /* 点击和弦 token 统一试听 */
    el.addEventListener('click', (e) => {
      const t = e.target.closest('[data-chord]');
      if (t) playChord(t.dataset.chord);
    });

    function renderBlock(b) {
      if (b.p) return `<p class="tb-p">${b.p}</p>`;
      if (b.box) return `<div class="result-box tb-box">${b.box}</div>`;
      if (b.chords) return `<div class="tb-figs">${b.chords.map((c) => `
        <figure class="tb-fig">${Diagram.chord(c.frets, c.opts || {})}<figcaption>${c.cap}</figcaption></figure>`).join('')}</div>`;
      if (b.fret) return `<div class="tb-fig">${Diagram.fretboard(b.fret)}<div class="tb-cap">${b.cap || ''}</div></div>`;
      if (b.table) return `<table class="tb-table">
        <thead><tr>${b.table.head.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${b.table.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
      if (b.prog) return `<div class="tb-prog">
        <div class="tb-prog-name">${b.prog.name}</div>
        <div>${b.prog.chords.map((c) => `<button class="chord-token" data-chord="${c}">${c}</button>`).join('<span class="tb-arrow">→</span>')}</div>
        <div class="tb-prog-note">${b.prog.note}</div></div>`;
      if (b.dots) return `<div class="tb-dots"><span class="tb-dots-label">${b.dots.label}</span>${Array.from({ length: b.dots.count }, (_, i) =>
        `<span class="beat-dot on${i === 0 ? ' first' : ''}"></span>`).join('')}</div>`;
      return '';
    }

    function renderList() {
      cur = -1;
      root.innerHTML = ARTICLES.map((a, i) => `
      <div class="card tb-item" data-i="${i}">
        <div class="row">
          <span class="tb-num">${String(i + 1).padStart(2, '0')}</span>
          <div style="min-width:0">
            <div class="tb-item-title">${a.title}${read[a.id] ? '<span class="tb-read">已读</span>' : ''}</div>
            <div class="tb-item-sum">${a.sum}</div>
          </div>
        </div>
      </div>`).join('');
      root.querySelectorAll('.tb-item').forEach((it) =>
        it.addEventListener('click', () => open(+it.dataset.i)));
    }

    function open(i) {
      cur = i;
      const a = ARTICLES[i];
      read[a.id] = 1;
      Store.setJSON('tb_read', read);
      const prev = i > 0 ? ARTICLES[i - 1] : null;
      const next = i < ARTICLES.length - 1 ? ARTICLES[i + 1] : null;
      root.innerHTML = `
      <button class="btn-mini" data-act="back">← 返回目录</button>
      <div class="card mt12">
        <div class="row">
          <span class="tb-num dark">${String(i + 1).padStart(2, '0')}</span>
          <h1 class="tb-title">${a.title}</h1>
        </div>
        ${a.blocks.map(renderBlock).join('')}
        <div class="grid2 tb-nav">
          <button class="btn-ghost" data-nav="prev" ${prev ? '' : 'disabled'}>${prev ? '上一篇<br>' + prev.title : '已是第一篇'}</button>
          <button class="btn-ghost" data-nav="next" ${next ? '' : 'disabled'}>${next ? '下一篇<br>' + next.title : '已是最后一篇'}</button>
        </div>
      </div>`;
      root.querySelector('[data-act="back"]').addEventListener('click', renderList);
      const p = root.querySelector('[data-nav="prev"]');
      const n = root.querySelector('[data-nav="next"]');
      if (prev) p.addEventListener('click', () => open(i - 1));
      if (next) n.addEventListener('click', () => open(i + 1));
    }

    renderList();
  }

  const tool = {
    id: 'theory-book',
    name: '乐理知识库',
    desc: '按主题整理乐理，适合系统复习。',
    icon: '📖',
    cat: '指板与曲谱',
    render,
    teardown() {},
  };
  Tools.register(tool);
})();
