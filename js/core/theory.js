/* ============================================================
 * 乐理核心：音名 / 和弦解析 / 转调 / 音阶
 * ============================================================ */
const Theory = (() => {
  const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const FLAT  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

  const NAME2IDX = {
    'C': 0, 'B#': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4, 'Fb': 4, 'E#': 5, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7,
    'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11, 'Cb': 11,
  };

  function idx(name) {
    if (name == null) return -1;
    let n = String(name).trim()
      .replace('♯', '#').replace('♭', 'b')
      .replace(/^([a-g])/, (m) => m.toUpperCase());
    return NAME2IDX[n] !== undefined ? NAME2IDX[n] : -1;
  }

  function name(i, useFlat = false) {
    const t = ((i % 12) + 12) % 12;
    return useFlat ? FLAT[t] : SHARP[t];
  }

  // 频率与音名换算（A4 = 440）
  function freqOf(noteIdx, octave) {
    const midi = (octave + 1) * 12 + noteIdx;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /* ---------- 和弦 ---------- */
  // 常用和弦性质：suffix -> 相对根音的半音数
  const QUALITIES = {
    '':      { iv: [0, 4, 7],       cn: '大三和弦' },
    'm':     { iv: [0, 3, 7],       cn: '小三和弦' },
    '7':     { iv: [0, 4, 7, 10],   cn: '属七和弦' },
    'maj7':  { iv: [0, 4, 7, 11],   cn: '大七和弦' },
    'M7':    { iv: [0, 4, 7, 11],   cn: '大七和弦' },
    'm7':    { iv: [0, 3, 7, 10],   cn: '小七和弦' },
    'm7b5':  { iv: [0, 3, 6, 10],   cn: '半减七和弦' },
    'dim':   { iv: [0, 3, 6],       cn: '减三和弦' },
    'dim7':  { iv: [0, 3, 6, 9],    cn: '减七和弦' },
    'aug':   { iv: [0, 4, 8],       cn: '增三和弦' },
    'sus2':  { iv: [0, 2, 7],       cn: '挂二和弦' },
    'sus4':  { iv: [0, 5, 7],       cn: '挂四和弦' },
    'add9':  { iv: [0, 4, 7, 14],   cn: '加九和弦' },
    '6':     { iv: [0, 4, 7, 9],    cn: '六和弦' },
    'm6':    { iv: [0, 3, 7, 9],    cn: '小六和弦' },
    '9':     { iv: [0, 4, 7, 10, 14], cn: '属九和弦' },
    '5':     { iv: [0, 7],          cn: '强力和弦' },
  };

  // "F#m7" -> { root:'F#', rootIdx:6, quality:'m7', tones:[0,3,7,10] }
  function parseChord(str) {
    if (!str) return null;
    const m = String(str).trim().match(/^([A-Ga-g][#b♯♭]?)(.*)$/);
    if (!m) return null;
    const root = m[1].replace('♯', '#').replace('♭', 'b')
      .replace(/^([a-g])/, (s) => s.toUpperCase());
    let quality = m[2] || '';
    if (quality === 'M7') quality = 'maj7';
    if (quality === 'maj') quality = '';
    if (quality === 'min') quality = 'm';
    if (quality === '-') quality = 'm';
    const rootIdx = idx(root);
    if (rootIdx < 0) return null;
    const q = QUALITIES[quality];
    return {
      root, rootIdx, quality,
      suffix: quality,
      tones: q ? q.iv : (QUALITIES[''].iv),
      qualityCn: q ? q.cn : '大三和弦',
      valid: !!q,
    };
  }

  // 转调：返回新和弦名（保留性质后缀）
  function transposeChord(str, semis, useFlat = false) {
    const c = parseChord(str);
    if (!c) return str;
    return name(c.rootIdx + semis, useFlat) + c.suffix;
  }

  // 两个调之间的半音差（from -> to）
  function keyDistance(fromKey, toKey) {
    const a = idx(fromKey), b = idx(toKey);
    if (a < 0 || b < 0) return 0;
    return ((b - a) % 12 + 12) % 12;
  }

  function transposeProgression(chords, semis, useFlat = false) {
    return chords.map((c) => transposeChord(c, semis, useFlat));
  }

  /* ---------- 音阶 ---------- */
  const SCALES = {
    major:          { cn: '自然大调',     iv: [0, 2, 4, 5, 7, 9, 11] },
    minor:          { cn: '自然小调',     iv: [0, 2, 3, 5, 7, 8, 10] },
    major_pent:     { cn: '大调五声',     iv: [0, 2, 4, 7, 9] },
    minor_pent:     { cn: '小调五声',     iv: [0, 3, 5, 7, 10] },
    blues:          { cn: '布鲁斯',       iv: [0, 3, 5, 6, 7, 10] },
    dorian:         { cn: '多利亚',       iv: [0, 2, 3, 5, 7, 9, 10] },
    mixolydian:     { cn: '混合利底亚',   iv: [0, 2, 4, 5, 7, 9, 10] },
  };

  function scaleNotes(root, scaleKey) {
    const s = SCALES[scaleKey];
    if (!s) return [];
    const r = idx(root);
    return s.iv.map((i) => name(r + i));
  }

  /* ---------- 调与级数 ---------- */
  const MAJOR_KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'F', 'Bb', 'Eb', 'Ab', 'Db'];
  const DEGREE_QLT = ['', 'm', 'm', '', '', 'm', 'dim']; // 大调顺阶
  const DEGREE_NUM = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];

  function degreeChords(key) {
    const r = idx(key);
    return MAJOR_SCALE_DEGREES().map((d, i) => ({
      numeral: DEGREE_NUM[i],
      chord: name(r + d, key.includes('b') || key === 'F') + DEGREE_QLT[i],
    }));
  }
  function MAJOR_SCALE_DEGREES() { return [0, 2, 4, 5, 7, 9, 11]; }

  // 五度圈顺序（顺时针，升号方向）
  const CIRCLE = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];

  return {
    SHARP, FLAT, idx, name, freqOf,
    QUALITIES, parseChord, transposeChord, transposeProgression, keyDistance,
    SCALES, scaleNotes, MAJOR_KEYS, degreeChords, CIRCLE,
  };
})();
