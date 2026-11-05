// Раскладка и параметры фазы 3 «МОРЕ». Пишут «Редактор фазы 3.bat» (tools/p10/sem3/editor.html) и «Конструктор моря.bat».
// layers — слои сцены по порядку (см. LAYERS в level10sea.js); WY — вода у плотов; sem — Семён (x, y = линия воды, H); stations — станции (x, y, s, leg);
// bg — горизонт и море; lanes — ряды плотов; atk — параметры атак.
L10.SEA3 = {
 "valeraK": 0.37,
 "lanes": [
  {
   "y": 330,
   "k": 1
  },
  {
   "y": 297,
   "k": 0.86
  },
  {
   "y": 246,
   "k": 0.74
  }
 ],
 "raftSheet": "slab10",
 "raftTop": 0.62,
 "raftSub": 4,
 "WY": 275,
 "sem": {
  "x": 309,
  "y": 247,
  "H": 236
 },
 "legA": [
  [
   -62,
   -150
  ],
  [
   62,
   -150
  ]
 ],
 "stations": [
  {
   "x": 64,
   "y": 225,
   "s": 1,
   "leg": 1
  },
  {
   "x": 205,
   "y": 184,
   "s": 0.55,
   "leg": 0
  },
  {
   "x": 600,
   "y": 240,
   "s": 1,
   "leg": 2
  },
  {
   "x": 485,
   "y": 203,
   "s": 0.8,
   "leg": 3
  }
 ],
 "gunK": 0.62,
 "bg": {
  "seaY": 175,
  "seaH": 230,
  "shipZ": 70,
  "ships": 7
 },
 "raftX0": -60,
 "raftEvery": [
  1.6,
  2.4
 ],
 "raftSpeed": [
  32,
  48
 ],
 "raftW": [
  105,
  125
 ],
 "hp": 2000,
 "segs": 3,
 "atk": {
  "tracks": [
   3,
   2,
   3
  ],
  "cd": [
   2.2,
   1.8,
   1.4
  ],
  "ballLife": 10,
  "ballSpeed": 92,
  "ballTurn": 2,
  "ballHp": 2,
  "ballDmg": 14,
  "balls": [
   1,
   2,
   3
  ],
  "laserWarn": 0.9,
  "laserTime": 1.7,
  "laserDmg": 16,
  "hoseN": [
   3,
   4,
   5
  ],
  "hoseWarn": 0.6,
  "hoseDmg": 18,
  "clapWarn": 1,
  "clapDmg": 30,
  "clapEvery": 1,
  "minions": [
   1,
   3,
   5
  ],
  "minionEvery": 5,
  "minionDmgK": 0.6,
  "dmg": 14,
  "dmgWeak": 20,
  "splash": 40,
  "breath": 2.5,
  "stationHp": 30,
  "stationBack": 28,
  "smashWarn": 0.9,
  "smashEvery": 1.3,
  "smashDmg": 24,
  "smashR": 42,
  "sweepP": 0.35,
  "sweepWarn": 0.9,
  "sweepTime": 1,
  "sweepDmg": 18
 },
 "layers": [
  {
   "k": "sky"
  },
  {
   "k": "sea"
  },
  {
   "k": "sea",
   "sp": -190,
   "dx": 700,
   "dy": 3,
   "a": 0.33,
   "w": 1.3
  },
  {
   "k": "ships"
  },
  {
   "k": "stFar"
  },
  {
   "k": "sem"
  },
  {
   "k": "semWater"
  },
  {
   "k": "laser"
  },
  {
   "k": "stNear"
  },
  {
   "k": "rafts"
  },
  {
   "k": "hose"
  },
  {
   "k": "actors"
  },
  {
   "k": "arms"
  },
  {
   "k": "fx"
  },
  {
   "k": "rain"
  }
 ]
};
