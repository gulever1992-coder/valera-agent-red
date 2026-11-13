// Разведка структуры уровня: где лежит игрок, враги, камера
window.__disc = function () {
  const out = {}, seen = new Set();
  const walk = (o, path, d) => {
    if (!o || typeof o !== 'object' || seen.has(o) || d > 3) return; seen.add(o);
    for (const k in o) {
      let v; try { v = o[k]; } catch (e) { continue; }
      if (Array.isArray(v)) {
        if (v.length && v[0] && typeof v[0] === 'object' && typeof v[0].x === 'number')
          out[path + '.' + k] = 'arr' + v.length + ':' + v[0].constructor.name + ('hp' in v[0] ? ':hp' : '') + ('dead' in v[0] ? ':dead' : '');
      } else if (v && typeof v === 'object') {
        if (typeof v.x === 'number' && typeof v.y === 'number' && /player|^pl$|^P$|valera|hero|car|boss/i.test(k))
          out[path + '.' + k] = v.constructor.name + ' x' + Math.round(v.x) + ' y' + Math.round(v.y) + (v.hp != null ? ' hp' + v.hp : '');
        if (!(v instanceof HTMLElement)) walk(v, path + '.' + k, d + 1);
      } else if (typeof v === 'number' && /^(cam|scroll|cx$|cy$)/i.test(k)) out[path + '.' + k] = Math.round(v);
    }
  };
  walk(App.level, 'L', 0);
  return JSON.stringify(out);
};
