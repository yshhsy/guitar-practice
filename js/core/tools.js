/* ============================================================
 * 工具注册表
 * 每个工具模块调用：
 * Tools.register({
 *   id: 'metronome',          // 唯一 id，路由 #/tool/metronome
 *   name: '节拍器',
 *   desc: '一句话简介（首页卡片用）',
 *   icon: '🥁',               // emoji 图标
 *   cat: '节奏与伴奏',         // 分组，见 Tools.CATS
 *   render(el, api) { ... }   // 挂载函数，el 为工具内容容器
 * })
 * api = { AudioEngine, Theory, ChordLib, Diagram, Store }
 * ============================================================ */
const Tools = (() => {
  const CATS = ['练习与训练', '节奏与伴奏', '乐理与工具', '指板与曲谱'];
  const list = [];
  const byId = {};

  function register(tool) {
    if (byId[tool.id]) return;
    list.push(tool);
    byId[tool.id] = tool;
  }

  function get(id) { return byId[id]; }
  function grouped() {
    return CATS.map((cat) => ({
      cat,
      tools: list.filter((t) => t.cat === cat),
    })).filter((g) => g.tools.length > 0);
  }

  return { CATS, register, get, grouped, list };
})();
