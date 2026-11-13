// Подключается после загрузки страницы: ждёт старта уровня и вешает покадровый режим
window.__boot = async function () {
  const s = document.createElement('script'); s.src = '/trailer/rec.js?' + Date.now();
  document.head.appendChild(s); await new Promise(r => s.onload = r);
  const s2 = document.createElement('script'); s2.src = '/trailer/clean.js?' + Date.now();
  document.head.appendChild(s2); await new Promise(r => s2.onload = r);
  for (let i = 0; i < 300; i++) {
    if (typeof App !== 'undefined' && App.level && !App.level.loading && App.state !== 'loading') break;
    await new Promise(r => setTimeout(r, 100));
  }
  await new Promise(r => setTimeout(r, 500));
  __R.hook();
  return __R.state();
};
// запуск записи без ожидания: __wait() потом ждёт окончания
window.__job = function (name, pre, secs, opt) {
  window.__done = 0;
  (async () => { if (window.__pre) await window.__pre(); await __boot(); if (pre) __R.skip(pre, opt); await __R.rec(name, secs, opt); window.__done = 1; })()
    .catch(e => { window.__done = 'ERR ' + e; });
  return 'started';
};
window.__wait = async function (ms = 40000) {
  const t = Date.now(); while (!window.__done && Date.now() - t < ms) await new Promise(r => setTimeout(r, 300));
  return window.__done;
};
