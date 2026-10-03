const fs = require('fs');
function edit(f, fn) { let s = fs.readFileSync(f, 'utf8'); s = fn(s); fs.writeFileSync(f, s); }
function rep(s, a, b) { if (!s.includes(a)) throw new Error('нет: ' + a.slice(0, 70)); return s.split(a).join(b); }
edit('js/level5.js', s => {
  s = s.replace(/  kesha: \{[^\n]*\n/, `  showgirl: { sheet: 'girls2', walk: [2, 3], idle: 4, hit: 7, sc: 0.46, sp: 26, lines: ['Привет, красавчик!', 'Угостишь шампанским?', 'Дорогой, не гони!', 'Ах, какая машина!'] },
  domina: { sheet: 'girls2', walk: [0, 1], idle: 0, hit: 1, sc: 0.5, sp: 28, lines: ['Ну-ка, смирно!', 'Плохой мальчик!', 'Осторожнее на дороге!'] },
  maid: { sheet: 'maidw', walk: [0, 1, 2, 3], idle: 0, hit: 5, sc: 0.5, sp: 28, lines: ['Ой, а я с работы!', 'Постойте, подвезите!', 'Ах, вы ж мои хорошие!'] },
  nurse: { sheet: 'walk4', walk: [4, 5, 6, 7], idle: 4, hit: 7, sc: 0.5, sp: 28, lines: ['Больной, вам лежать!', 'Таблеточку не желаете?', 'Я на смену, не гоните!'] },
`);
  s = rep(s, "const types = ['gopnik', 'gopnik', 'bomzh', 'alkash', 'punk', 'kesha'];", "const types = ['gopnik', 'gopnik', 'gopnik', 'bomzh', 'alkash', 'punk', 'showgirl', 'domina', 'maid', 'nurse'];");
  s = rep(s, "['bomzh', 'alkash', 'kesha', 'gopnik']", "['bomzh', 'alkash', 'showgirl', 'maid', 'nurse', 'gopnik']");
  s = rep(s, ", kesha_a, wk_a", ", girls2, maidw, walk4, wk_a");
  return s;
});
console.log('ok');
