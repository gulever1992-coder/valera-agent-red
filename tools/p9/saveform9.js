// Забрать картинки Flow формой (профиль без доступа к localhost): await __saveF({L9HCAP: 'l9hcap'}) -> страница уходит на 127.0.0.1:18799, потом вернуться назад.
window.__saveF = async (want, maxN = 6) => {
  const parts = [], sc = document.scrollingElement;
  const scroller = [...document.querySelectorAll('*')].filter(e => e.scrollHeight > e.clientHeight + 200 && /auto|scroll/.test(getComputedStyle(e).overflowY)).sort((a, b) => b.scrollHeight - a.scrollHeight)[0] || sc;
  const done = {};
  for (let step = 0; step < 16 && parts.length < maxN; step++) {
    scroller.scrollTop = step * 500; await window.__sl(900);
    const keys = [...document.querySelectorAll('div,span,p')].filter(e => e.children.length === 0 && /KEYL9[A-Z0-9]+X/.test(e.textContent)).map(e => [e.textContent.match(/KEY(L9[A-Z0-9]+)X/)[1], e.getBoundingClientRect().y]);
    const imgs = [...document.querySelectorAll('img')].filter(i => i.naturalWidth > 300 && i.getBoundingClientRect().width > 150).map(i => { const r = i.getBoundingClientRect(); return [r.y, r.x, i.src]; });
    for (const [k, ky] of keys) {
      const nm = want[k]; if (!nm) continue;
      const row = imgs.filter(v => Math.abs(v[0] - ky) < 90).sort((a, b) => a[1] - b[1]);
      for (let j = 0; j < row.length && j < 2 && parts.length < maxN; j++) {
        const name = nm + '_' + j + '.jpg'; if (done[name]) continue;
        const b = await (await fetch(row[j][2].replace(/=s\d+-rw/, '=s2048'))).blob(); const b64 = await new Promise(ok => { const fr = new FileReader(); fr.onload = () => ok(fr.result.split(',')[1]); fr.readAsDataURL(b); });
        parts.push(name + '|' + b64); done[name] = b.size;
      }
    }
  }
  scroller.scrollTop = 0;
  window.__lastSaved = Object.keys(done);
  if (!parts.length) return 'nothing';
  const f = document.createElement('form'); f.method = 'POST'; f.action = 'http://127.0.0.1:18799/'; f.enctype = 'text/plain';
  const t = document.createElement('textarea'); t.name = 'x'; t.value = parts.join(';'); f.appendChild(t); document.body.appendChild(f);
  setTimeout(() => f.submit(), 50); return JSON.stringify(done);
};
