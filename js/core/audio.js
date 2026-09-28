/* ============================================================
 * 音频引擎
 * - Karplus-Strong 拨弦合成（吉他音色，零音频文件）
 * - 鼓组合成（底鼓/军鼓/踩镲/吊镲/通鼓）
 * - Scheduler：lookahead 步进调度器（节拍器/鼓机/伴奏机共用）
 * ============================================================ */
const AudioEngine = (() => {
  let ctx = null;
  let noiseBuf = null;
  const pluckCache = new Map();

  function ensureCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function now() { return ensureCtx().currentTime; }

  function getNoise() {
    ensureCtx();
    if (!noiseBuf) {
      const len = ctx.sampleRate * 1.2;
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    return noiseBuf;
  }

  /* ---------------- 吉他拨弦（Karplus-Strong） ---------------- */
  function synthPluck(freq, duration = 2.4) {
    ensureCtx();
    const sr = ctx.sampleRate;
    const N = Math.max(2, Math.round(sr / freq));
    const len = Math.floor(sr * duration);
    const buf = ctx.createBuffer(1, len, sr);
    const out = buf.getChannelData(0);
    const ring = new Float32Array(N);
    for (let i = 0; i < N; i++) ring[i] = Math.random() * 2 - 1;
    let idxp = 0;
    for (let i = 0; i < len; i++) {
      const cur = ring[idxp];
      const next = ring[(idxp + 1) % N];
      ring[idxp] = 0.996 * 0.5 * (cur + next);
      out[i] = cur * 0.9;
      idxp = (idxp + 1) % N;
    }
    return buf;
  }

  function getPluck(freq) {
    const key = Math.round(freq * 10);
    if (!pluckCache.has(key)) pluckCache.set(key, synthPluck(freq));
    return pluckCache.get(key);
  }

  // 弹一根弦。when 为相对当前时刻的秒数偏移
  function pluck(freq, when = 0, gainVal = 0.8) {
    ensureCtx();
    const src = ctx.createBufferSource();
    src.buffer = getPluck(freq);
    const g = ctx.createGain();
    g.gain.value = gainVal;
    src.connect(g).connect(ctx.destination);
    src.start(ctx.currentTime + when);
  }

  // 扫弦：freqs 从低到高排列；dir 'up' 时反向
  function strum(freqs, { gap = 0.032, gain = 0.7, dir = 'down', when = 0 } = {}) {
    const list = dir === 'up' ? [...freqs].reverse() : freqs;
    list.forEach((f, i) => pluck(f, when + i * gap, gain));
  }

  // 琶音
  function arpeggio(freqs, { gap = 0.25, gain = 0.8, when = 0 } = {}) {
    freqs.forEach((f, i) => pluck(f, when + i * gap, gain));
  }

  /* ---------------- 鼓组合成 ---------------- */
  function kick(when = 0, gain = 1) {
    ensureCtx();
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.11);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    osc.connect(g).connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.3);
  }

  function snare(when = 0, gain = 0.85) {
    ensureCtx();
    const t = ctx.currentTime + when;
    // 噪声主体
    const n = ctx.createBufferSource();
    n.buffer = getNoise();
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 0.8;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(gain, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.17);
    n.connect(bp).connect(ng).connect(ctx.destination);
    n.start(t); n.stop(t + 0.2);
    // 鼓皮音头
    const osc = ctx.createOscillator();
    osc.frequency.value = 190;
    const og = ctx.createGain();
    og.gain.setValueAtTime(gain * 0.5, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(og).connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.1);
  }

  function hihat(when = 0, { open = false, gain = 0.4 } = {}) {
    ensureCtx();
    const t = ctx.currentTime + when;
    const n = ctx.createBufferSource();
    n.buffer = getNoise();
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 7800;
    const g = ctx.createGain();
    const dur = open ? 0.32 : 0.055;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    n.connect(hp).connect(g).connect(ctx.destination);
    n.start(t); n.stop(t + dur + 0.02);
  }

  function clap(when = 0, gain = 0.7) {
    ensureCtx();
    for (let i = 0; i < 3; i++) {
      const t = ctx.currentTime + when + i * 0.012;
      const n = ctx.createBufferSource();
      n.buffer = getNoise();
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 1300; bp.Q.value = 1.2;
      const g = ctx.createGain();
      g.gain.setValueAtTime(gain * (1 - i * 0.2), t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      n.connect(bp).connect(g).connect(ctx.destination);
      n.start(t); n.stop(t + 0.18);
    }
  }

  function rim(when = 0, gain = 0.6) {
    ensureCtx();
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    osc.frequency.value = 850;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
    osc.connect(g).connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.06);
  }

  function tom(freq = 120, when = 0, gain = 0.8) {
    ensureCtx();
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.62, t + 0.18);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    osc.connect(g).connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.35);
  }

  // 节拍器嘀嗒声
  function click(when = 0, accent = false) {
    ensureCtx();
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    osc.frequency.value = accent ? 1568 : 1046;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(accent ? 0.9 : 0.55, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    osc.connect(g).connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.1);
  }

  /* ---------------- 步进调度器 ----------------
   * 用法：const s = new AudioEngine.Scheduler({
   *   bpm: 90, stepsPerBeat: 4,
   *   onStep: (step, time) => { ... 在 time 时刻安排声音 ... }
   * });
   * s.onUiStep = (step) => { ... UI 高亮 ... };
   * s.start(); s.stop(); s.setBpm(120);
   * ------------------------------------------------ */
  class Scheduler {
    constructor({ bpm = 90, stepsPerBeat = 4, onStep = null } = {}) {
      this.bpm = bpm;
      this.stepsPerBeat = stepsPerBeat;
      this.onStep = onStep;
      this.onUiStep = null;
      this.playing = false;
      this.step = 0;
      this._timer = null;
      this._anchor = 0;
      this._raf = null;
    }
    get stepDur() { return 60 / this.bpm / this.stepsPerBeat; }
    start() {
      if (this.playing) return;
      ensureCtx();
      this.playing = true;
      this.step = 0;
      this._anchor = ctx.currentTime + 0.08;
      this._nextTime = this._anchor;
      this._scheduleLoop();
      this._uiLoop();
    }
    stop() {
      this.playing = false;
      clearTimeout(this._timer);
      cancelAnimationFrame(this._raf);
    }
    setBpm(v) { this.bpm = Math.min(240, Math.max(30, v)); }
    _scheduleLoop() {
      if (!this.playing) return;
      while (this._nextTime < ctx.currentTime + 0.15) {
        if (this.onStep) this.onStep(this.step, this._nextTime);
        this._nextTime += this.stepDur;
        this.step++;
      }
      this._timer = setTimeout(() => this._scheduleLoop(), 30);
    }
    _uiLoop() {
      if (!this.playing) return;
      if (this.onUiStep) {
        const s = Math.max(0, Math.floor((ctx.currentTime - this._anchor) / this.stepDur));
        if (s !== this._lastUiStep) {
          this._lastUiStep = s;
          this.onUiStep(s);
        }
      }
      this._raf = requestAnimationFrame(() => this._uiLoop());
    }
  }

  return {
    ensureCtx, now,
    pluck, strum, arpeggio,
    kick, snare, hihat, clap, rim, tom, click,
    Scheduler,
  };
})();
