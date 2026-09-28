/* ============================================================
 * 和弦数据库
 * 琴弦顺序约定：下标 0 = 6弦(低音E) ... 5 = 1弦(高音e)
 * frets: -1 = 不弹(X)，0 = 空弦(O)，>0 = 品位
 * ============================================================ */
const ChordLib = (() => {
  // 标准调弦空弦音
  const OPEN_NOTES = [4, 9, 2, 7, 11, 4];            // E A D G B E
  const OPEN_FREQS = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63];

  function stringNote(stringIdx, fret) { return Theory.name(OPEN_NOTES[stringIdx] + fret); }
  function stringFreq(stringIdx, fret) { return OPEN_FREQS[stringIdx] * Math.pow(2, fret / 12); }
  function chordFreqs(frets) {
    return frets.map((f, i) => (f >= 0 ? stringFreq(i, f) : null)).filter((x) => x !== null);
  }

  /* ---------------- 精选和弦库（教学用，带讲解） ---------------- */
  const LIBRARY = {
    open: {
      label: '开放和弦',
      chords: [
        { name: 'C',  frets: [-1, 3, 2, 0, 1, 0], fingers: [-1, 3, 2, 0, 1, 0], diff: '入门',
          tip: '最经典的和弦。注意食指按 2 弦 1 品时指尖立起来，别碰到 1 弦。' },
        { name: 'D',  frets: [-1, -1, 0, 2, 3, 2], fingers: [-1, -1, 0, 1, 3, 2], diff: '入门',
          tip: '只弹下面 4 根弦。食指、中指、无名指呈三角形按在 2 品。' },
        { name: 'Dm', frets: [-1, -1, 0, 2, 3, 1], fingers: [-1, -1, 0, 2, 3, 1], diff: '入门',
          tip: '小三和弦，色彩忧郁。1 弦 1 品用食指，容易闷音，多检查。' },
        { name: 'E',  frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], diff: '入门',
          tip: '六根弦全弹。记住这个指型——整体平移 + 食指横按，就是所有 E 指型横按和弦。' },
        { name: 'Em', frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], diff: '入门',
          tip: '最省力的和弦之一，只用两根手指。平移后就是所有小横按和弦。' },
        { name: 'G',  frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3], diff: '入门',
          tip: '跨度较大，小指按 1 弦 3 品。手腕往前送会轻松很多。' },
        { name: 'A',  frets: [-1, 0, 2, 2, 2, 0], fingers: [-1, 0, 1, 2, 3, 0], diff: '入门',
          tip: '三根手指挤在 2 品，可以稍微斜一点按。A 指型平移同样能变出一串和弦。' },
        { name: 'Am', frets: [-1, 0, 2, 2, 1, 0], fingers: [-1, 0, 2, 3, 1, 0], diff: '入门',
          tip: '和 E 和弦的指型一模一样，只是整体移到 5 弦方向——体会这种"指型迁移"。' },
      ]
    },
    barre: {
      label: '横按和弦',
      chords: [
        { name: 'F',  frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], barre: { fret: 1, from: 0, to: 5 }, diff: '进阶',
          tip: 'E 指型平移 1 品 + 食指横按，新手的第一个坎。横按时食指用侧面压、稍稍卷起。' },
        { name: 'G',  frets: [3, 5, 5, 4, 3, 3], fingers: [1, 3, 4, 2, 1, 1], barre: { fret: 3, from: 0, to: 5 }, diff: '进阶',
          tip: 'E 指型平移到 3 品。和开放 G 同名不同把位，音色更紧凑。' },
        { name: 'A',  frets: [5, 7, 7, 6, 5, 5], fingers: [1, 3, 4, 2, 1, 1], barre: { fret: 5, from: 0, to: 5 }, diff: '进阶',
          tip: 'E 指型平移到 5 品。根音在 6 弦 5 品 = A。' },
        { name: 'Bm', frets: [-1, 2, 4, 4, 3, 2], fingers: [-1, 1, 3, 4, 2, 1], barre: { fret: 2, from: 1, to: 5 }, diff: '进阶',
          tip: 'Am 指型平移 2 品。根音在 5 弦 2 品 = B，小横按常用代表。' },
        { name: 'Cm', frets: [-1, 3, 5, 5, 4, 3], fingers: [-1, 1, 3, 4, 2, 1], barre: { fret: 3, from: 1, to: 5 }, diff: '进阶',
          tip: 'Am 指型平移 3 品。根音 5 弦 3 品 = C。' },
        { name: 'F#m', frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], barre: { fret: 2, from: 0, to: 5 }, diff: '进阶',
          tip: 'Em 指型平移 2 品。注意 3、2、1 弦全部被食指横按在 2 品。' },
      ]
    },
    seventh: {
      label: '七和弦',
      chords: [
        { name: 'G7', frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1], diff: '入门',
          tip: 'G 和弦把小指挪到 1 弦 1 品。Blues 和民谣里大量使用。' },
        { name: 'C7', frets: [-1, 3, 2, 3, 1, 0], fingers: [-1, 3, 2, 4, 1, 0], diff: '进阶',
          tip: 'C 和弦加上小指按 4 弦 3 品，张力十足。' },
        { name: 'D7', frets: [-1, -1, 0, 2, 1, 2], fingers: [-1, -1, 0, 2, 1, 3], diff: '入门',
          tip: '和 D 很像，1、2 弦的手指互换一下。' },
        { name: 'E7', frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], diff: '入门',
          tip: 'E 和弦松开无名指即可，最省事的七和弦。' },
        { name: 'A7', frets: [-1, 0, 2, 0, 2, 0], fingers: [-1, 0, 2, 0, 3, 0], diff: '入门',
          tip: 'A 和弦松开 3 弦。Blues 进行 I-IV-V 的常客。' },
        { name: 'Am7', frets: [-1, 0, 2, 0, 1, 0], fingers: [-1, 0, 2, 0, 1, 0], diff: '入门',
          tip: 'Am 松开 3 弦，温柔的爵士味。' },
        { name: 'Em7', frets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0], diff: '入门',
          tip: '只按一根手指！Em 松开无名指。' },
        { name: 'Dm7', frets: [-1, -1, 0, 2, 1, 1], fingers: [-1, -1, 0, 2, 1, 1], barre: { fret: 1, from: 4, to: 5 }, diff: '进阶',
          tip: '1、2 弦用小横按，或者用食指倒下来压两根弦。' },
      ]
    }
  };

  /* ---------------- 可平移指型模板（教学 + 指法生成共用） ---------------- */
  // offsets: 相对基准品的品差；null = 不弹；rootString/rootOffset 定位根音
  const SHAPES = {
    'E':  { offsets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], rootString: 0, rootOffset: 0, family: 'major', cn: 'E 指型' },
    'Em': { offsets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], rootString: 0, rootOffset: 0, family: 'minor', cn: 'Em 指型' },
    'A':  { offsets: [null, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0], rootString: 1, rootOffset: 0, family: 'major', cn: 'A 指型' },
    'Am': { offsets: [null, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], rootString: 1, rootOffset: 0, family: 'minor', cn: 'Am 指型' },
    // 七和弦扩展模板
    'E7':  { offsets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], rootString: 0, rootOffset: 0, family: '7', cn: 'E7 指型' },
    'A7':  { offsets: [null, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0], rootString: 1, rootOffset: 0, family: '7', cn: 'A7 指型' },
    'Emaj7': { offsets: [0, 2, 1, 1, 0, 0], fingers: [0, 3, 1, 2, 0, 0], rootString: 0, rootOffset: 0, family: 'maj7', cn: 'Emaj7 指型' },
    'Amaj7': { offsets: [null, 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0], rootString: 1, rootOffset: 0, family: 'maj7', cn: 'Amaj7 指型' },
    'Em7': { offsets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0], rootString: 0, rootOffset: 0, family: 'm7', cn: 'Em7 指型' },
    'Am7': { offsets: [null, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0], rootString: 1, rootOffset: 0, family: 'm7', cn: 'Am7 指型' },
    'Esus4': { offsets: [0, 2, 2, 2, 0, 0], fingers: [0, 2, 3, 4, 0, 0], rootString: 0, rootOffset: 0, family: 'sus4', cn: 'Esus4 指型' },
    'Asus4': { offsets: [null, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 3, 0], rootString: 1, rootOffset: 0, family: 'sus4', cn: 'Asus4 指型' },
  };

  // 性质后缀 -> 可用的指型族
  const QUALITY_FAMILY = {
    '': 'major', 'm': 'minor', '7': '7', 'maj7': 'maj7', 'M7': 'maj7',
    'm7': 'm7', 'sus4': 'sus4', 'sus2': 'sus4', 'add9': 'major', '6': 'major',
  };

  // 由指型 + 基准品生成实际和弦指法
  function shapeAt(shapeKey, baseFret) {
    const s = SHAPES[shapeKey];
    const frets = s.offsets.map((o) => (o === null ? -1 : baseFret + o));
    const rootName = Theory.name(OPEN_NOTES[s.rootString] + baseFret + s.rootOffset);
    return {
      frets,
      baseFret,
      rootName,
      barre: baseFret > 0
        ? { fret: baseFret, from: s.offsets[0] === null ? 1 : 0, to: 5 }
        : null,
      fingers: s.fingers,
      shapeCn: s.cn,
    };
  }

  /* ---------------- 指法查询：任意和弦名 -> 多个把位 ---------------- */
  // 精选开放把位补充（生成器覆盖不到的好听把位）
  const CURATED = {
    'C':  [{ frets: [-1, 3, 2, 0, 1, 0], fingers: [-1, 3, 2, 0, 1, 0], label: '经典开放' }],
    'D':  [{ frets: [-1, -1, 0, 2, 3, 2], fingers: [-1, -1, 0, 1, 3, 2], label: '经典开放' }],
    'Dm': [{ frets: [-1, -1, 0, 2, 3, 1], fingers: [-1, -1, 0, 2, 3, 1], label: '经典开放' }],
    'E':  [{ frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], label: '经典开放' }],
    'Em': [{ frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], label: '经典开放' }],
    'F':  [{ frets: [-1, -1, 3, 2, 1, 1], fingers: [-1, -1, 4, 3, 1, 1], barre: { fret: 1, from: 4, to: 5 }, label: '简易小横按' }],
    'G':  [{ frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3], label: '经典开放' }],
    'A':  [{ frets: [-1, 0, 2, 2, 2, 0], fingers: [-1, 0, 1, 2, 3, 0], label: '经典开放' }],
    'Am': [{ frets: [-1, 0, 2, 2, 1, 0], fingers: [-1, 0, 2, 3, 1, 0], label: '经典开放' }],
    'B7': [{ frets: [-1, 2, 1, 2, 0, 2], fingers: [-1, 2, 1, 3, 0, 4], label: '开放把位' }],
    'G7': [{ frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1], label: '经典开放' }],
    'C7': [{ frets: [-1, 3, 2, 3, 1, 0], fingers: [-1, 3, 2, 4, 1, 0], label: '开放把位' }],
    'D7': [{ frets: [-1, -1, 0, 2, 1, 2], fingers: [-1, -1, 0, 2, 1, 3], label: '开放把位' }],
    'Cadd9': [{ frets: [-1, 3, 2, 0, 3, 0], fingers: [-1, 3, 2, 0, 4, 0], label: '民谣最爱' }],
    'G6': [{ frets: [3, 2, 0, 0, 0, 0], fingers: [3, 2, 0, 0, 0, 0], label: '开放把位' }],
  };

  // 查询任意和弦的所有可用指法
  function getVoicings(chordName) {
    const c = Theory.parseChord(chordName);
    if (!c || !c.valid) return [];
    const out = [];
    const full = c.root + c.suffix;

    // 1) 精选把位
    (CURATED[full] || []).forEach((v) => out.push({ ...v, baseFret: 1 }));

    // 2) E 族 + A 族指型生成
    const family = QUALITY_FAMILY[c.suffix] || 'major';
    const shapeKeys = Object.keys(SHAPES).filter((k) => SHAPES[k].family === family);
    shapeKeys.forEach((sk) => {
      const s = SHAPES[sk];
      // 求基准品：(OPEN_NOTES[rootString] + f) % 12 == rootIdx
      const need = ((c.rootIdx - OPEN_NOTES[s.rootString]) % 12 + 12) % 12;
      const f = need; // 0 = 开放
      if (f > 11) return;
      const v = shapeAt(sk, f);
      const dup = out.some((o) => o.frets.join() === v.frets.join());
      if (!dup) {
        out.push({
          frets: v.frets,
          fingers: v.fingers,
          barre: v.barre,
          baseFret: v.baseFret,
          label: f === 0 ? `${s.cn}·开放` : `${s.cn}·第 ${f} 品`,
        });
      }
    });
    return out;
  }

  return { OPEN_NOTES, OPEN_FREQS, stringNote, stringFreq, chordFreqs, LIBRARY, SHAPES, shapeAt, getVoicings };
})();
