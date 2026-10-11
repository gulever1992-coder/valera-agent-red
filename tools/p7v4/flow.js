// Хелперы Google Flow (грузятся: eval(await (await fetch('http://127.0.0.1:8783/flow.js')).text()))
(() => {
  const sl = ms => new Promise(r => setTimeout(r, ms)); window.__sl = sl;
  window.__q = async q => { const inp = [...document.querySelectorAll('input')].find(i => /Поиск объектов/.test(i.placeholder)); if (!inp) return 'noinp'; inp.focus(); inp.value = q; inp.dispatchEvent(new Event('input', { bubbles: true })); await sl(1200); return [...document.querySelectorAll('button.asset-item .asset-title')].map(e => e.textContent.trim()); };
  window.__pick = async name => { await window.__q(name); const b = [...document.querySelectorAll('button.asset-item')].find(b => b.querySelector('.asset-title')?.textContent.trim() === name); if (!b) return 'nf:' + name; b.click(); await sl(500); return 'ok'; };
  window.__plus = () => { const ed = document.querySelector('[contenteditable=true]'); let p = ed; for (let i = 0; i < 6; i++) { p = p.parentElement; const b = [...p.querySelectorAll('button')].find(b => b.textContent.trim() === 'add'); if (b) return b; } return null; };
  window.__addRef = async name => { const b = window.__plus(); if (!b) return 'noplus'; b.click(); await sl(1200); const r = await window.__pick(name); await sl(800); return r; };
  window.__type = async t => { const ed = document.querySelector('[contenteditable=true]'); ed.focus(); document.execCommand('selectAll'); document.execCommand('insertText', false, t); await sl(300); return ed.textContent.length; };
  window.__job = async (refs, text) => { const out = []; for (const r of refs) out.push(await window.__addRef(r)); out.push(await window.__type(text)); return JSON.stringify(out); };
  window.__full = i => { let p = i; for (let k = 0; k < 9 && p; k++) { p = p.parentElement; const n = p.querySelectorAll('img').length; const tx = [...p.querySelectorAll('*')].map(e => e.childElementCount == 0 ? e.textContent : '').find(s => s.length > 120); if (tx) return n <= 6 ? tx : ''; } return ''; };
  window.__saved = window.__saved || {}; window.__cnt = window.__cnt || {}; window.__RULES = window.__RULES || [];
  window.__saveAll = async () => { const res = []; const imgs = [...document.querySelectorAll('img')].filter(i => i.naturalWidth > 500 && i.getBoundingClientRect().width > 120);
    for (const i of imgs) { const id = i.src.slice(-60); if (window.__saved[id]) continue; const t = window.__full(i); const r = window.__RULES.find(r => t.includes(r[0])); if (!r) continue;
      const c = window.__cnt[r[1]] || 0; window.__cnt[r[1]] = c + 1; const name = r[1] + '_' + c + '.jpg';
      const b = await (await fetch(i.src)).blob(); const b64 = await new Promise(ok => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.readAsDataURL(b); });
      await fetch('http://127.0.0.1:8783/', { method: 'POST', body: name + '|' + b64 }); window.__saved[id] = name; res.push(name); } return res; };
  window.__saveScroll = async (n = 6) => { const out = []; const sc = () => [...document.querySelectorAll('*')].filter(e => e.scrollHeight > e.clientHeight + 200 && getComputedStyle(e).overflowY != 'visible');
    sc().forEach(e => e.scrollTop = 0); await sl(1500); for (let k = 0; k < n; k++) { out.push(...await window.__saveAll()); sc().forEach(e => e.scrollTop += 600); await sl(1500); } return out; };
  window.__loadJobs = async f => { window.__B = await (await fetch('http://127.0.0.1:8783/' + f)).json(); window.__RULES = window.__RULES.concat(window.__B.map(b => [b[2].slice(0, 60), b[0]])); return window.__B.length; };
  window.__next = async () => { await sl(2500); const e = document.querySelector('[contenteditable=true]').textContent.length; if (e) return 'NOTSENT'; window.__i = (window.__i || 0); if (window.__i >= window.__B.length) return 'done'; const b = window.__B[window.__i++]; return b[0] + ' ' + await window.__job(b[1], b[2]); };
})();
