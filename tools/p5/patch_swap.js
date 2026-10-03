const fs = require('fs');
let s = fs.readFileSync('js/level5scenes.js', 'utf8');
const a = s.indexOf("  const doorL = carX - 30, doorR = carX + 40;");
const b = s.indexOf("  // 3. Валера за рулём");
if (a < 0 || b < 0) throw new Error('нет');
s = s.slice(0, a) + `  // ноги — на уровне колёс (низ шин), заднее сиденье — у задней двери, водительское — у передней
  const doorL = carX - 34, doorR = carX + 40, FY = GY + 12;
  val.y = vov.y = FY;
  // Вова выходит из-за машины (сзади) и садится на заднее сиденье; Валера выходит спереди и садится за руль
  vov.x = carX - 135; val.x = carX + 140; val.facing = -1; vov.facing = 1;
  val.setAnim('stand'); vov.setAnim('stand'); smoke = true; yield 0.4;
  vov.visible = true; yield 0.35; val.visible = true; Sound.play('door');
  const jv = Scene.moveTo(vov, doorL, 55, 'walk'), jl = Scene.moveTo(val, doorR, 55, 'walk');
  yield* jv; yield* jl;
  val.facing = -1; vov.facing = 1; val.setAnim('stand'); vov.setAnim('stand');
  yield* Scene.say('vova', 'Валер... Я ж ещё не доехал до самого интересного.', vov);
  Sound.play('door'); vov.visible = false; yield 0.35; Sound.play('door'); val.visible = false; smoke = false; carFr = 2; yield 0.5;
` + s.slice(b);
fs.writeFileSync('js/level5scenes.js', s);
