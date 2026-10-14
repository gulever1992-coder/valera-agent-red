// Забрать картинки Flow по ключам промптов: await __saveK({L8ROO: 'l8roo', ...}) -> POST на приёмник 8783 (имя_0.jpg, имя_1.jpg).
window.__saveK = async (want) => {
  const done = {}, sc = document.scrollingElement;
  const scroller = [...document.querySelectorAll('*')].filter(e => e.scrollHeight > e.clientHeight + 200 && /auto|scroll/.test(getComputedStyle(e).overflowY)).sort((a, b) => b.scrollHeight - a.scrollHeight)[0] || sc;
  for (let step = 0; step < 14; step++) {
    scroller.scrollTop = step * 500; window.scrollTo(0, step * 500); await window.__sl(900);
    const keys = [...document.querySelectorAll('div,span,p')].filter(e => e.children.length === 0 && /KEYL8[A-Z0-9]+X/.test(e.textContent)).map(e => [e.textContent.match(/KEY(L8[A-Z0-9]+)X/)[1], e.getBoundingClientRect().y]);
    const imgs = [...document.querySelectorAll('img')].filter(i => i.naturalWidth > 300 && i.getBoundingClientRect().width > 200).map(i => { const r = i.getBoundingClientRect(); return [r.y, r.x, i.src]; });
    for (const [k, ky] of keys) {
      const nm = want[k]; if (!nm) continue;
      const row = imgs.filter(v => Math.abs(v[0] - ky) < 90).sort((a, b) => a[1] - b[1]);
      for (let j = 0; j < row.length && j < 2; j++) {
        const name = nm + '_' + j + '.jpg'; if (done[name]) continue;
        const b = await (await fetch(row[j][2])).blob(); const b64 = await new Promise(ok => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.readAsDataURL(b); });
        await fetch('http://127.0.0.1:8783/', { method: 'POST', body: name + '|' + b64 }); done[name] = b.size;
      }
    }
    if (Object.keys(done).length >= Object.keys(want).length * 2) break;
  }
  scroller.scrollTop = 0; window.scrollTo(0, 0); return JSON.stringify(done);
};
