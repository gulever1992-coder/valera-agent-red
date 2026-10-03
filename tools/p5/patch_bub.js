const fs = require('fs'); let s = fs.readFileSync('js/level5world.js', 'utf8');
s = s.replace("  for (const b of G.bubbles) { const tg = b.target;", "  const bl = G.bubbles.filter(b => b.target && b.target.x != null), key = b => (b.target === lv.pl || b.target.cop || b.target.d) ? -1 : Math.hypot(b.target.x - C.x, b.target.y - C.y), keep = new Set(bl.sort((a, b) => key(a) - key(b)).slice(0, 4));\n  for (const b of G.bubbles) { if (!keep.has(b)) continue; const tg = b.target;");
fs.writeFileSync('js/level5world.js', s);
