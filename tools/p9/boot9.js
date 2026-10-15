// Загрузчик хелперов Flow для фоновой вкладки (таймеры заморожены — паузы через MessageChannel). Вставлять на странице проекта Flow:
//   window.__pol = trustedTypes.createPolicy('v' + Date.now(), { createScript: s => s }); (0, eval)(window.__pol.createScript(await (await fetch('http://127.0.0.1:8790/boot.js')).text())); await window.__ld();
// Отправка — настоящий клик по координатам из __chk() (send / chip); меню формата: клик по chip (после отправки — со второго раза), __mi('4:3') -> координаты пункта.
(() => {
  const K = window.__K || 0.968;   // координаты клика = пиксели страницы * K (ширина кадра скриншота / innerWidth)
  window.__sl = ms => new Promise(r => { const t0 = performance.now(), c = new MessageChannel(); c.port1.onmessage = () => performance.now() - t0 >= ms ? r() : c.port2.postMessage(0); c.port2.postMessage(0); });
  const dlgInp = () => [...document.querySelectorAll('input')].find(i => /^Поиск|^Search/.test(i.placeholder));
  window.__ld = async () => {
    const sv = window.__saved;
    for (const f of ['flow5.js', 'savek9.js', 'flow9.js']) { let t = await (await fetch('http://127.0.0.1:8790/' + f + '?' + Date.now())).text(); t = t.split('new Promise(r => setTimeout(r, ms))').join('window.__sl(ms)'); (0, eval)(window.__pol.createScript(t)); }
    if (sv) window.__saved = sv;
    const sl = window.__sl;
    window.__addRef = async name => { for (let k = 0; k < 3 && !dlgInp(); k++) { const b = window.__plus(); if (!b) return 'noplus'; b.click(); for (let i = 0; i < 20 && !dlgInp(); i++) await sl(250); } if (!dlgInp()) return 'nodlg'; const r = await window.__pick(name); await sl(800); return r; };
    window.__chip = () => { const b = [...document.querySelectorAll('button')].find(b => /crop_/.test(b.textContent) && /Banana/.test(b.textContent)); const r = b.getBoundingClientRect(); return [Math.round((r.x + r.width / 2) * K), Math.round((r.y + r.height / 2) * K), b.textContent.trim().slice(-14)]; };
    window.__chk = () => { const s = window.__sendBtn(); return JSON.stringify({ len: document.querySelector('[contenteditable=true]').textContent.length, send: [Math.round(s[0] * K), Math.round(s[1] * K)], chip: window.__chip(), ih: innerHeight }); };
    window.__jb = async n => { const r = await window.__job2(n); const ed = document.querySelector('[contenteditable=true]'); let p = ed; for (let i = 0; i < 6; i++) p = p.parentElement; return r + ' att=' + p.querySelectorAll('img').length + ' ' + window.__chk(); };
    window.__mi = t => JSON.stringify([...document.querySelectorAll('*')].filter(e => !e.children.length && e.textContent.trim() === t).map(e => { const r = e.getBoundingClientRect(); return [Math.round((r.x + r.width / 2) * K), Math.round((r.y - 8) * K)]; }).filter(p => p[0] > 700 && p[0] < 1060));
    // загрузка файлов-референсов: __upPrep() -> координаты кнопки «Загрузить» (настоящий клик) -> find file input -> file_upload
    window.__upPrep = async () => { const old = document.getElementById('__fileinp'); if (old) old.remove(); HTMLInputElement.prototype.click = function () { if (this.type === 'file') { this.id = '__fileinp'; document.body.appendChild(this); return; } return HTMLElement.prototype.click.call(this); };
      if (!dlgInp()) { window.__plus().click(); for (let i = 0; i < 20 && !dlgInp(); i++) await sl(250); } await window.__q('');
      return JSON.stringify([...document.querySelectorAll('button')].filter(b => /Загрузить|Upload/.test(b.textContent)).map(b => { const r = b.getBoundingClientRect(); return [Math.round((r.x + r.width / 2) * K), Math.round((r.y + r.height / 2) * K)]; })); };
    return Object.keys(window.__J).filter(k => k.startsWith('l9')).length;
  };
})();
