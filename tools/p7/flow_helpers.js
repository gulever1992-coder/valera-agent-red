// Хелперы для Google Flow (вставлять в консоль/javascript_tool на странице проекта).
// __job(refs, prompt) — добавляет ингредиенты по имени и вводит промпт; отправка — реальный клик по стрелке (__sendBtn() даёт координаты).
// __saveAll() — сохраняет новые картинки через приёмник tools/p7/recv7.py (порт 8783) по правилам __RULES.
(() => {
  const sl = ms => new Promise(r => setTimeout(r, ms));
  window.__q = async q => { const inp = [...document.querySelectorAll('input')].find(i => /Поиск объектов/.test(i.placeholder)); inp.focus(); inp.value = q; inp.dispatchEvent(new Event('input', { bubbles: true })); await sl(1200); return [...document.querySelectorAll('button.asset-item .asset-title')].map(e => e.textContent.trim()); };
  window.__pick = async name => { await window.__q(name); const b = [...document.querySelectorAll('button.asset-item')].find(b => b.querySelector('.asset-title')?.textContent.trim() === name); if (!b) return 'nf:' + name; b.click(); await sl(500); return 'ok'; };
  window.__plus = () => { const ed = document.querySelector('[contenteditable=true]'); let p = ed; for (let i = 0; i < 6; i++) { p = p.parentElement; const b = [...p.querySelectorAll('button')].find(b => b.textContent.trim() === 'add'); if (b) return b; } return null; };
  window.__addRef = async name => { const b = window.__plus(); if (!b) return 'noplus'; b.click(); await sl(1200); const r = await window.__pick(name); await sl(800); return r; };
  window.__type = async t => { const ed = document.querySelector('[contenteditable=true]'); ed.focus(); document.execCommand('selectAll'); document.execCommand('insertText', false, t); await sl(300); return ed.textContent.length; };
  window.__sendBtn = () => { const ed = document.querySelector('[contenteditable=true]'); let p = ed; for (let i = 0; i < 7; i++) { p = p.parentElement; const b = [...p.querySelectorAll('button')].find(b => b.textContent.trim().startsWith('arrow_forward')); if (b) { const r = b.getBoundingClientRect(); return [Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2), b.disabled]; } } return null; };
  window.__job = async (refs, text) => { const out = []; for (const r of refs) out.push(await window.__addRef(r)); await window.__type(text); return JSON.stringify({ out, send: window.__sendBtn() }); };
  window.__full = i => { let p = i; for (let k = 0; k < 9 && p; k++) { p = p.parentElement; const n = p.querySelectorAll('img').length; const tx = [...p.querySelectorAll('*')].map(e => e.childElementCount == 0 ? e.textContent : '').find(s => s.length > 120); if (tx) return n <= 6 ? tx : ''; } return ''; };
  window.__saved = window.__saved || {}; window.__cnt = window.__cnt || {};
  window.__saveAll = async () => {
    const res = []; const imgs = [...document.querySelectorAll('img')].filter(i => i.naturalWidth > 500 && i.src.includes('flow-content') && i.getBoundingClientRect().width > 120);
    for (const i of imgs) {
      const id = i.src.split('/image/')[1].slice(0, 8); if (window.__saved[id]) continue;
      const t = window.__full(i); const r = window.__RULES.find(r => t.includes(r[0])); if (!r) continue;
      const c = window.__cnt[r[1]] || 0; window.__cnt[r[1]] = c + 1; const name = r[1] + '_' + c + '.jpg';
      const b = await (await fetch(i.src)).blob(); const b64 = await new Promise(ok => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.readAsDataURL(b); });
      await fetch('http://127.0.0.1:8783/', { method: 'POST', body: name + '|' + b64 }); window.__saved[id] = name; res.push(name);
    }
    return res;
  };
})();
