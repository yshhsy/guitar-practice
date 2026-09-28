/* ============================================================
 * SVG 绘图组件
 * Diagram.chord(frets, opts)     竖版和弦指法图
 * Diagram.fretboard(opts)        横版指板图（音阶/CAGED/音符标记）
 * ============================================================ */
const Diagram = (() => {
  const STRINGS = 6;

  /* ---------------- 和弦指法图（竖版） ----------------
   * opts: { fingers, barre:{fret,from,to}, size, baseFret, lefty=false }
   */
  function chord(frets, opts = {}) {
    const { fingers = null, barre = null, size = 96, baseFret = 1 } = opts;
    const w = size, h = size * 1.2;
    const padX = w * 0.16, padTop = h * 0.17, padBottom = h * 0.13;
    const boardW = w - padX * 2, boardH = h - padTop - padBottom;
    const stringGap = boardW / (STRINGS - 1);
    const FRETS_SHOWN = 4;
    const fretGap = boardH / FRETS_SHOWN;
    const showNut = baseFret <= 1;

    let s = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`;

    frets.forEach((f, i) => {
      const x = padX + i * stringGap;
      if (f === -1) s += `<text x="${x}" y="${padTop - h * 0.045}" text-anchor="middle" font-size="${w * 0.1}" fill="#a29681" font-family="sans-serif">✕</text>`;
      else if (f === 0) s += `<circle cx="${x}" cy="${padTop - h * 0.062}" r="${w * 0.033}" fill="none" stroke="#a29681" stroke-width="1.4"/>`;
    });

    for (let j = 0; j <= FRETS_SHOWN; j++) {
      const y = padTop + j * fretGap;
      const nut = j === 0 && showNut;
      s += `<line x1="${padX}" y1="${y}" x2="${padX + boardW}" y2="${y}" stroke="${nut ? '#5a5142' : '#d8ccb0'}" stroke-width="${nut ? 3.6 : 1.3}"/>`;
    }
    for (let i = 0; i < STRINGS; i++) {
      const x = padX + i * stringGap;
      s += `<line x1="${x}" y1="${padTop}" x2="${x}" y2="${padTop + boardH}" stroke="#b9ac8e" stroke-width="${1.9 - i * 0.22}"/>`;
    }
    if (!showNut) {
      s += `<text x="${padX + boardW + w * 0.06}" y="${padTop + fretGap * 0.62}" font-size="${w * 0.085}" fill="#a29681" font-family="sans-serif">${baseFret}fr</text>`;
    }

    const dotR = w * 0.062;
    if (barre) {
      const y = padTop + (barre.fret - baseFret + 0.5) * fretGap;
      const x1 = padX + barre.from * stringGap;
      const x2 = padX + barre.to * stringGap;
      s += `<rect x="${x1 - dotR}" y="${y - dotR}" width="${x2 - x1 + dotR * 2}" height="${dotR * 2}" rx="${dotR}" fill="#17614e"/>`;
    }
    frets.forEach((f, i) => {
      if (f <= 0) return;
      const rel = f - baseFret;
      if (rel < 0 || rel >= FRETS_SHOWN) return;
      const x = padX + i * stringGap;
      const y = padTop + (rel + 0.5) * fretGap;
      const inBarre = barre && f === barre.fret && i >= barre.from && i <= barre.to;
      if (!inBarre) s += `<circle cx="${x}" cy="${y}" r="${dotR}" fill="#17614e"/>`;
      const finger = fingers ? fingers[i] : 0;
      if (finger > 0) {
        const showLabel = !inBarre || i === (barre ? barre.from : -1);
        if (showLabel) {
          s += `<text x="${x}" y="${y + w * 0.028}" text-anchor="middle" font-size="${w * 0.075}" font-weight="700" fill="#f3efe4" font-family="sans-serif">${inBarre ? 1 : finger}</text>`;
        }
      }
    });
    s += '</svg>';
    return s;
  }

  /* ---------------- 指板图（横版） ----------------
   * opts: {
   *   fromFret, toFret,          // 显示区间（默认 0-12）
   *   markers: [{ string(0-5, 0=6弦), fret, label, color, ring }]
   *   width, noteNames=false     // 未标记处显示音名
   * }
   */
  function fretboard(opts = {}) {
    const {
      fromFret = 0, toFret = 12, markers = [], width = 340, noteNames = false,
    } = opts;
    const h = 150, padL = 26, padR = 10, padT = 14, padB = 16;
    const w = width;
    const fretCount = toFret - fromFret;
    const fretW = (w - padL - padR) / fretCount;
    const stringGap = (h - padT - padB) / (STRINGS - 1);
    // 1弦(高音e)在上：行 r 对应弦下标 5-r
    const yOf = (stringIdx) => padT + (5 - stringIdx) * stringGap;
    const xOf = (fret) => padL + (fret - fromFret) * fretW;
    const inlayFrets = [3, 5, 7, 9, 12, 15, 17, 19, 21];

    let s = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" style="max-width:100%">`;
    // 木纹底
    s += `<rect x="${padL}" y="${padT}" width="${w - padL - padR}" height="${h - padT - padB}" rx="6" fill="#efe6d2" stroke="#d8ccb0"/>`;
    // 品记
    inlayFrets.forEach((f) => {
      if (f <= fromFret || f > toFret) return;
      const cx = xOf(f) - fretW / 2;
      const cy = padT + (h - padT - padB) / 2;
      s += `<circle cx="${cx}" cy="${cy}" r="${stringGap * 0.18}" fill="#ddd0b2"/>`;
    });
    // 品丝 + 品号
    for (let f = fromFret; f <= toFret; f++) {
      const x = xOf(f);
      s += `<line x1="${x}" y1="${padT}" x2="${x}" y2="${h - padB}" stroke="${f === 0 ? '#8a7d63' : '#cbbd9c'}" stroke-width="${f === 0 ? 4 : 1.4}"/>`;
      if (f > fromFret) s += `<text x="${x - fretW / 2}" y="${h - 3}" text-anchor="middle" font-size="9" fill="#a29681" font-family="sans-serif">${f}</text>`;
    }
    // 弦
    for (let i = 0; i < STRINGS; i++) {
      const y = yOf(i);
      s += `<line x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}" stroke="#a49677" stroke-width="${1.8 - (5 - i) * 0.22}"/>`;
    }
    // 弦名
    const names = ['E', 'A', 'D', 'G', 'B', 'e'];
    for (let i = 0; i < STRINGS; i++) {
      s += `<text x="${padL - 9}" y="${yOf(i) + 3}" text-anchor="middle" font-size="9" fill="#a29681" font-family="sans-serif">${names[i]}</text>`;
    }
    // 音名底纹
    if (noteNames) {
      for (let i = 0; i < STRINGS; i++) {
        for (let f = fromFret; f <= toFret; f++) {
          s += `<text x="${xOf(f) + (f === fromFret && f === 0 ? -fretW / 2 : fretW / 2)}" y="${yOf(i) + 3}" text-anchor="middle" font-size="8" fill="#c3b694" font-family="sans-serif">${ChordLib.stringNote(i, f)}</text>`;
        }
      }
    }
    // 标记点
    const r = Math.min(stringGap, fretW) * 0.36;
    markers.forEach((m) => {
      if (m.fret < fromFret || m.fret > toFret) return;
      const cx = m.fret === 0 ? xOf(0) - fretW * 0.35 : xOf(m.fret) - fretW / 2;
      const cy = yOf(m.string);
      const color = m.color || '#17614e';
      if (m.ring) {
        s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="2.4"/>`;
      } else {
        s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>`;
      }
      if (m.label) {
        s += `<text x="${cx}" y="${cy + r * 0.38}" text-anchor="middle" font-size="${r * 0.95}" font-weight="700" fill="${m.ring ? color : '#f3efe4'}" font-family="sans-serif">${m.label}</text>`;
      }
    });
    s += '</svg>';
    return s;
  }

  return { chord, fretboard };
})();
