/* ============================================================
 * 成长系统：XP 经验值 + 等级称号 + 激励提示
 * XP 来源：练习 1 XP/分钟，学完一课 +20，测验满分 +10
 * ============================================================ */
const Growth = {
  LEVELS: ['初识琴弦', '指尖学徒', '节奏新人', '和弦熟手', '转换达人', '扫弦小将', '弹唱新星', '横按勇士', '乐理行者', '指板游侠', '吉他高手'],

  xp() { return Store.getJSON('xp', 0) || 0; },
  level() { return Math.floor(this.xp() / 100) + 1; },
  levelName() { return this.LEVELS[Math.min(this.level() - 1, this.LEVELS.length - 1)]; },
  progress() { return (this.xp() % 100) / 100; },
  nextNeed() { return 100 - (this.xp() % 100); },

  add(n, label) {
    if (!n || n <= 0) return;
    Store.setJSON('xp', this.xp() + n);
    this.toast('+' + n + ' XP' + (label ? ' · ' + label : ''));
  },

  toast(text) {
    let t = document.getElementById('xp-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'xp-toast';
      document.body.appendChild(t);
    }
    t.textContent = '🎉 ' + text;
    t.classList.remove('show');
    void t.offsetWidth;
    t.classList.add('show');
    clearTimeout(this._tm);
    this._tm = setTimeout(() => t.classList.remove('show'), 2200);
  },
};
